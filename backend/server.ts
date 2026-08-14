import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import 'colors';
import apiRoutes from './src/routes/apiRoutes';
import { upsertDriverLocation, setDriverOffline } from './src/services/driverLocationStore';
import {
  driverRoom,
  registerDriverSocket,
  unregisterSocket,
} from './src/services/driverSocketRegistry';
import {
  handleDriverAccept,
  handleDriverReject,
  startOrderDispatch,
  isCurrentOfferTarget,
} from './src/services/orderDispatchService';
import { assignDriverToOrderAtomic } from './src/services/orderAssignmentService';
import { prisma } from './src/lib/prisma';
import { refreshPricingCache } from './src/services/pricingService';
import { recordDriverTripComplete } from './src/services/driverTripService';
import { notifyOrderCustomer } from './src/services/notificationService';
import { notifyDriver } from './src/services/driverNotificationService';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use('/api', apiRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    message: 'Delix Cargo Delivery Backend API',
    database: 'PostgreSQL + Redis Layer Connected',
    timestamp: new Date().toISOString(),
  });
});

const orderRoom = (orderId: string) => `order:${orderId}`;

const resolveDriverRecord = async (driverRef: string) => {
  try {
    return await prisma.driver.findFirst({
      where: {
        OR: [
          { id: driverRef },
          { plateNumber: driverRef },
          { licenseNumber: driverRef },
          { user: { phone: driverRef } },
        ],
      },
      include: { user: { select: { phone: true } } },
    });
  } catch {
    return null;
  }
};

const joinDriverSocketRooms = async (socketId: string, driverRef: string, socket: import('socket.io').Socket) => {
  const record = await resolveDriverRecord(driverRef);
  const ids = new Set<string>([driverRef]);
  if (record) {
    ids.add(record.id);
    if (record.user.phone) ids.add(record.user.phone);
  }

  for (const id of ids) {
    socket.join(driverRoom(id));
    registerDriverSocket(id, socketId);
  }

  return record?.id ?? driverRef;
};

const persistDriverGps = async (driverId: string, lat: number, lng: number) => {
  try {
    await prisma.driver.updateMany({
      where: { OR: [{ id: driverId }, { userId: driverId }] },
      data: { currentLat: lat, currentLng: lng, status: 'ACTIVE' },
    });
  } catch {
    // Non-blocking when DB unavailable or driver not registered yet
  }
};

io.on('connection', (socket) => {
  console.log(`[WebSocket] New client connected: ${socket.id}`.cyan);

  socket.on('join_order', (payload: { orderId: string }) => {
    if (!payload?.orderId) return;
    socket.join(orderRoom(payload.orderId));
    console.log(`[WebSocket] ${socket.id} joined ${orderRoom(payload.orderId)}`.cyan);
  });

  socket.on('leave_order', (payload: { orderId: string }) => {
    if (!payload?.orderId) return;
    socket.leave(orderRoom(payload.orderId));
  });

  socket.on('join_driver_pool', () => {
    socket.join('drivers_online');
  });

  socket.on('register_driver', async (payload: { driverId: string }) => {
    if (!payload?.driverId) return;
    const canonicalId = await joinDriverSocketRooms(socket.id, payload.driverId, socket);
    console.log(`[WebSocket] Driver ${payload.driverId} registered → room driver:${canonicalId}`.cyan);
  });

  socket.on(
    'driver_location_update',
    (data: {
      driverId: string;
      lat: number;
      lng: number;
      vehicleType: string;
      orderId?: string;
      online?: boolean;
      available?: boolean;
      approved?: boolean;
      plateNumber?: string;
      name?: string;
    }) => {
      void (async () => {
        const record = await resolveDriverRecord(data.driverId);
        const canonicalId = record?.id ?? data.driverId;
        upsertDriverLocation({ ...data, driverId: canonicalId });
        persistDriverGps(canonicalId, data.lat, data.lng);

        const payload = { ...data, driverId: canonicalId };
        if (data.orderId) {
          io.to(orderRoom(data.orderId)).emit('live_driver_moved', payload);
        }
      })();
    }
  );

  socket.on('driver_go_offline', (payload: { driverId: string }) => {
    if (payload?.driverId) {
      setDriverOffline(payload.driverId);
    }
  });

  socket.on('request_cargo_delivery', async (orderData: Record<string, unknown>) => {
    console.log(`[Order] Dispatch request received:`, orderData);
    await startOrderDispatch(io, orderData);
  });

  socket.on(
    'accept_delivery_order',
    async (payload: {
      orderId: string;
      driverId: string;
      driverName?: string;
      driverPhone?: string;
      plateNumber?: string;
      vehicleType?: string;
    }) => {
      const driverRecord = await resolveDriverRecord(payload.driverId);
      const canonicalId = driverRecord?.id ?? payload.driverId;

      if (!isCurrentOfferTarget(payload.orderId, canonicalId)) {
        socket.emit('dispatch_error', {
          orderId: payload.orderId,
          message: 'This trip is no longer assigned to you.',
        });
        return;
      }

      const assignment = await assignDriverToOrderAtomic(payload.orderId, canonicalId);
      if (!assignment.success) {
        socket.emit('dispatch_error', {
          orderId: payload.orderId,
          message: 'This trip is no longer available.',
        });
        return;
      }

      handleDriverAccept(io, payload.orderId, canonicalId);

      console.log(`[Order] Driver ${canonicalId} accepted order ${payload.orderId}`.green);

      try {
        // Order already updated atomically; ensure driver link exists when record resolved late.
        if (driverRecord) {
          await prisma.order.updateMany({
            where: { id: payload.orderId, driverId: null },
            data: { driverId: driverRecord.id },
          });
        }
      } catch {
        // Non-blocking
      }

      const statusPayload = {
        orderId: payload.orderId,
        status: 'DRIVER_ACCEPTED',
        driverId: canonicalId,
        driverName: payload.driverName,
        driverPhone: payload.driverPhone ?? driverRecord?.user.phone,
        plateNumber: payload.plateNumber,
        vehicleType: payload.vehicleType,
      };

      io.to(orderRoom(payload.orderId)).emit('order_status_changed', statusPayload);

      await notifyOrderCustomer(
        payload.orderId,
        'DRIVER_FOUND',
        'Driver found',
        `${payload.driverName ?? 'Your driver'} is on the way to pickup.`
      );
    }
  );

  socket.on('reject_delivery_order', async (payload: { orderId: string; driverId: string }) => {
    if (!payload?.orderId || !payload?.driverId) return;
    console.log(`[Order] Driver ${payload.driverId} rejected order ${payload.orderId}`.yellow);
    await handleDriverReject(io, payload.orderId, payload.driverId);
  });

  socket.on('driver_arrived_pickup', async (payload: { orderId: string; driverId?: string }) => {
    if (!payload?.orderId) return;

    try {
      await prisma.order.update({
        where: { id: payload.orderId },
        data: { status: 'ARRIVED_PICKUP' },
      });
    } catch {
      // non-blocking
    }

    io.to(orderRoom(payload.orderId)).emit('order_status_changed', {
      orderId: payload.orderId,
      status: 'ARRIVED_PICKUP',
    });

    await notifyOrderCustomer(
      payload.orderId,
      'DRIVER_ARRIVED',
      'Driver arrived',
      'Your driver has arrived at the pickup location.'
    );
  });

  socket.on(
    'start_delivery_trip',
    async (payload: { orderId: string; driverId?: string; lat?: number; lng?: number }) => {
      if (!payload?.orderId) return;

      try {
        await prisma.order.update({
          where: { id: payload.orderId },
          data: {
            status: 'IN_TRANSIT',
            tripStartedAt: new Date(),
            startLat: payload.lat,
            startLng: payload.lng,
          },
        });
      } catch {
        // non-blocking
      }

      io.to(orderRoom(payload.orderId)).emit('order_status_changed', {
        orderId: payload.orderId,
        status: 'IN_TRANSIT',
      });

      await notifyOrderCustomer(
        payload.orderId,
        'TRIP_STARTED',
        'Trip started',
        'Your cargo is on the way to the destination.'
      );
    }
  );

  socket.on(
    'order_completed',
    async (payload: { orderId: string; driverId?: string; earnings?: number }) => {
      if (!payload?.orderId) return;

      try {
        await prisma.order.update({
          where: { id: payload.orderId },
          data: { status: 'COMPLETED' },
        });
      } catch {
        // Non-blocking
      }

      if (payload.driverId) {
        try {
          await recordDriverTripComplete(payload.driverId, Number(payload.earnings) || 0);
        } catch {
          // Non-blocking
        }
      }

      io.to(orderRoom(payload.orderId)).emit('order_status_changed', {
        orderId: payload.orderId,
        status: 'DELIVERY_COMPLETED',
      });

      await notifyOrderCustomer(
        payload.orderId,
        'DELIVERY_COMPLETED',
        'Delivery completed',
        'Your delivery has been completed successfully.'
      );
    }
  );

  socket.on('disconnect', () => {
    unregisterSocket(socket.id);
    console.log(`[WebSocket] Client disconnected: ${socket.id}`.yellow);
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(Number(PORT), HOST, async () => {
  await refreshPricingCache();
  console.log(`🚀 Delix Backend Server & WebSockets running on http://${HOST}:${PORT}`.green);
  console.log(`   Health check: http://localhost:${PORT}/api/health`.cyan);

  setInterval(async () => {
    try {
      const res = await fetch('https://delix-project-1.onrender.com/api/health');
      if (res.ok) console.log('Keep-alive ping successful'.dim);
    } catch {
      console.log('Keep-alive ping failed'.yellow);
    }
  }, 14 * 60 * 1000); 
});
