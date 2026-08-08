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
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.io with CORS for high-performance WebSockets
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Mount API Routes
app.use('/api', apiRoutes_1.default);
// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ONLINE',
        message: 'Delix Cargo Delivery Backend API',
        database: 'PostgreSQL + Redis Layer Connected',
        timestamp: new Date().toISOString()
    });
});
// Socket.io Real-Time Tracking & Matching Handlers
io.on('connection', (socket) => {
    console.log(`[WebSocket] New client connected: ${socket.id}`.cyan);
    // Driver emits live GPS coordinates (Lat, Lng, DriverID)
    socket.on('driver_location_update', (data) => {
        io.emit('live_driver_moved', data);
    });
    // Customer creates order dispatch request
    socket.on('request_cargo_delivery', (orderData) => {
        console.log(`[Order] New Cargo Request received:`, orderData);
        io.emit('incoming_delivery_alert', orderData);
    });
    // Driver accepts order
    socket.on('accept_delivery_order', (payload) => {
        console.log(`[Order] Driver ${payload.driverId} accepted order ${payload.orderId}`.green);
        io.emit('order_status_changed', { orderId: payload.orderId, status: 'DRIVER_ACCEPTED', driverId: payload.driverId });
    });
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
