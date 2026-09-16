"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
require("colors");
const apiRoutes_1 = __importDefault(require("./src/routes/apiRoutes"));
const driverLocationStore_1 = require("./src/services/driverLocationStore");
const driverSocketRegistry_1 = require("./src/services/driverSocketRegistry");
const orderDispatchService_1 = require("./src/services/orderDispatchService");
const orderAssignmentService_1 = require("./src/services/orderAssignmentService");
const prisma_1 = require("./src/lib/prisma");
const pricingService_1 = require("./src/services/pricingService");
const driverTripService_1 = require("./src/services/driverTripService");
const notificationService_1 = require("./src/services/notificationService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '10mb' }));
app.use('/api', apiRoutes_1.default);
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ONLINE',
        message: 'Delix Cargo Delivery Backend API',
        database: 'PostgreSQL + Redis Layer Connected',
        timestamp: new Date().toISOString(),
    });
});
const orderRoom = (orderId) => `order:${orderId}`;
const resolveDriverRecord = async (driverRef) => {
    try {
        return await prisma_1.prisma.driver.findFirst({
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
    }
    catch {
        return null;
    }
};
const joinDriverSocketRooms = async (socketId, driverRef, socket) => {
    const record = await resolveDriverRecord(driverRef);
    const ids = new Set([driverRef]);
    if (record) {
        ids.add(record.id);
        if (record.user.phone)
            ids.add(record.user.phone);
    }
    for (const id of ids) {
        socket.join((0, driverSocketRegistry_1.driverRoom)(id));
        (0, driverSocketRegistry_1.registerDriverSocket)(id, socketId);
    }
    return record?.id ?? driverRef;
};
const persistDriverGps = async (driverId, lat, lng) => {
    try {
        await prisma_1.prisma.driver.updateMany({
            where: { OR: [{ id: driverId }, { userId: driverId }] },
            data: { currentLat: lat, currentLng: lng, status: 'ACTIVE' },
        });
    }
    catch {
        // Non-blocking when DB unavailable or driver not registered yet
    }
};
io.on('connection', (socket) => {
    console.log(`[WebSocket] New client connected: ${socket.id}`.cyan);
    socket.on('join_order', (payload) => {
        if (!payload?.orderId)
            return;
        socket.join(orderRoom(payload.orderId));
        console.log(`[WebSocket] ${socket.id} joined ${orderRoom(payload.orderId)}`.cyan);
    });
    socket.on('leave_order', (payload) => {
        if (!payload?.orderId)
            return;
        socket.leave(orderRoom(payload.orderId));
    });
    socket.on('join_driver_pool', () => {
        socket.join('drivers_online');
    });
    socket.on('register_driver', async (payload) => {
        if (!payload?.driverId)
            return;
        const canonicalId = await joinDriverSocketRooms(socket.id, payload.driverId, socket);
        console.log(`[WebSocket] Driver ${payload.driverId} registered → room driver:${canonicalId}`.cyan);
    });
    socket.on('driver_location_update', (data) => {
        void (async () => {
            const record = await resolveDriverRecord(data.driverId);
            const canonicalId = record?.id ?? data.driverId;
            (0, driverLocationStore_1.upsertDriverLocation)({ ...data, driverId: canonicalId });
            persistDriverGps(canonicalId, data.lat, data.lng);
            const payload = { ...data, driverId: canonicalId };
            if (data.orderId) {
                io.to(orderRoom(data.orderId)).emit('live_driver_moved', payload);
            }
        })();
    });
    socket.on('driver_go_offline', (payload) => {
        if (payload?.driverId) {
            (0, driverLocationStore_1.setDriverOffline)(payload.driverId);
        }
    });
    socket.on('request_cargo_delivery', async (orderData) => {
        console.log(`[Order] Dispatch request received:`, orderData);
        await (0, orderDispatchService_1.startOrderDispatch)(io, orderData);
    });
    socket.on('accept_delivery_order', async (payload) => {
        const driverRecord = await resolveDriverRecord(payload.driverId);
        const canonicalId = driverRecord?.id ?? payload.driverId;
        if (!(0, orderDispatchService_1.isCurrentOfferTarget)(payload.orderId, canonicalId)) {
            socket.emit('dispatch_error', {
                orderId: payload.orderId,
                message: 'This trip is no longer assigned to you.',
            });
            return;
        }
        const assignment = await (0, orderAssignmentService_1.assignDriverToOrderAtomic)(payload.orderId, canonicalId);
        if (!assignment.success) {
            socket.emit('dispatch_error', {
                orderId: payload.orderId,
                message: 'This trip is no longer available.',
            });
            return;
        }
        (0, orderDispatchService_1.handleDriverAccept)(io, payload.orderId, canonicalId);
        console.log(`[Order] Driver ${canonicalId} accepted order ${payload.orderId}`.green);
        try {
            // Order already updated atomically; ensure driver link exists when record resolved late.
            if (driverRecord) {
                await prisma_1.prisma.order.updateMany({
                    where: { id: payload.orderId, driverId: null },
                    data: { driverId: driverRecord.id },
                });
            }
        }
        catch {
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
        await (0, notificationService_1.notifyOrderCustomer)(payload.orderId, 'DRIVER_FOUND', 'Driver found', `${payload.driverName ?? 'Your driver'} is on the way to pickup.`);
    });
    socket.on('reject_delivery_order', async (payload) => {
        if (!payload?.orderId || !payload?.driverId)
            return;
        console.log(`[Order] Driver ${payload.driverId} rejected order ${payload.orderId}`.yellow);
        await (0, orderDispatchService_1.handleDriverReject)(io, payload.orderId, payload.driverId);
    });
    socket.on('driver_arrived_pickup', async (payload) => {
        if (!payload?.orderId)
            return;
        try {
            await prisma_1.prisma.order.update({
                where: { id: payload.orderId },
                data: { status: 'ARRIVED_PICKUP' },
            });
        }
        catch {
            // non-blocking
        }
        io.to(orderRoom(payload.orderId)).emit('order_status_changed', {
            orderId: payload.orderId,
            status: 'ARRIVED_PICKUP',
        });
        await (0, notificationService_1.notifyOrderCustomer)(payload.orderId, 'DRIVER_ARRIVED', 'Driver arrived', 'Your driver has arrived at the pickup location.');
    });
    socket.on('start_delivery_trip', async (payload) => {
        if (!payload?.orderId)
            return;
        try {
            await prisma_1.prisma.order.update({
                where: { id: payload.orderId },
                data: {
                    status: 'IN_TRANSIT',
                    tripStartedAt: new Date(),
                    startLat: payload.lat,
                    startLng: payload.lng,
                },
            });
        }
        catch {
            // non-blocking
        }
        io.to(orderRoom(payload.orderId)).emit('order_status_changed', {
            orderId: payload.orderId,
            status: 'IN_TRANSIT',
        });
        await (0, notificationService_1.notifyOrderCustomer)(payload.orderId, 'TRIP_STARTED', 'Trip started', 'Your cargo is on the way to the destination.');
    });
    socket.on('order_completed', async (payload) => {
        if (!payload?.orderId)
            return;
        try {
            await prisma_1.prisma.order.update({
                where: { id: payload.orderId },
                data: { status: 'COMPLETED' },
            });
        }
        catch {
            // Non-blocking
        }
        if (payload.driverId) {
            try {
                await (0, driverTripService_1.recordDriverTripComplete)(payload.driverId, Number(payload.earnings) || 0);
            }
            catch {
                // Non-blocking
            }
        }
        io.to(orderRoom(payload.orderId)).emit('order_status_changed', {
            orderId: payload.orderId,
            status: 'DELIVERY_COMPLETED',
        });
        await (0, notificationService_1.notifyOrderCustomer)(payload.orderId, 'DELIVERY_COMPLETED', 'Delivery completed', 'Your delivery has been completed successfully.');
    });
    socket.on('disconnect', () => {
        (0, driverSocketRegistry_1.unregisterSocket)(socket.id);
        console.log(`[WebSocket] Client disconnected: ${socket.id}`.yellow);
    });
});
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(Number(PORT), HOST, async () => {
    await (0, pricingService_1.refreshPricingCache)();
    console.log(`🚀 Delix Backend Server & WebSockets running on http://${HOST}:${PORT}`.green);
    console.log(`   Health check: http://localhost:${PORT}/api/health`.cyan);
    setInterval(async () => {
        try {
            const res = await fetch('https://delix-project-1.onrender.com/api/health');
            if (res.ok)
                console.log('Keep-alive ping successful'.dim);
        }
        catch {
            console.log('Keep-alive ping failed'.yellow);
        }
    }, 14 * 60 * 1000);
});
