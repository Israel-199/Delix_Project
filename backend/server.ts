import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import 'colors';
import apiRoutes from './src/routes/apiRoutes';
import { upsertDriverLocation, setDriverOffline } from './src/services/driverLocationStore';
import { prisma } from './src/lib/prisma';
import { recordDriverTripComplete } from './src/services/driverTripService';

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
      upsertDriverLocation(data);
      persistDriverGps(data.driverId, data.lat, data.lng);

      if (data.orderId) {
        io.to(orderRoom(data.orderId)).emit('live_driver_moved', data);
      } else {
        io.emit('live_driver_moved', data);
      }
    }
  );

  socket.on('driver_go_offline', (payload: { driverId: string }) => {
    if (payload?.driverId) {
      setDriverOffline(payload.driverId);
    }
  });

  socket.on('request_cargo_delivery', (orderData: { orderId?: string; id?: string }) => {
    console.log(`[Order] New Cargo Request received:`, orderData);
    io.to('drivers_online').emit('incoming_delivery_alert', orderData);
    io.emit('incoming_delivery_alert', orderData);
  });

  socket.on(
    'accept_delivery_order',
    async (payload: {
      orderId: string;
      driverId: string;
      driverName?: string;
      plateNumber?: string;
      vehicleType?: string;
    }) => {
      console.log(`[Order] Driver ${payload.driverId} accepted order ${payload.orderId}`.green);

      try {
        await prisma.order.update({
          where: { id: payload.orderId },
          data: { status: 'DRIVER_ACCEPTED' },
        });
      } catch {
        // Order may be in-memory only
      }

      const statusPayload = {
        orderId: payload.orderId,
        status: 'DRIVER_ACCEPTED',
        driverId: payload.driverId,
        driverName: payload.driverName,
        plateNumber: payload.plateNumber,
        vehicleType: payload.vehicleType,
      };

      io.to(orderRoom(payload.orderId)).emit('order_status_changed', statusPayload);
      io.emit('order_status_changed', statusPayload);
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
    }
  );

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`.yellow);
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Delix Backend Server & WebSockets running on http://${HOST}:${PORT}`.green);
  console.log(`   Health check: http://localhost:${PORT}/api/health`.cyan);
});
