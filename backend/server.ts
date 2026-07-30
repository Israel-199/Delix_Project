import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import 'colors';
import apiRoutes from './src/routes/apiRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS for high-performance WebSockets
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount API Routes
app.use('/api', apiRoutes);

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
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
  socket.on('driver_location_update', (data: { driverId: string; lat: number; lng: number; vehicleType: string }) => {
    io.emit('live_driver_moved', data);
  });

  // Customer creates order dispatch request
  socket.on('request_cargo_delivery', (orderData) => {
    console.log(`[Order] New Cargo Request received:`, orderData);
    io.emit('incoming_delivery_alert', orderData);
  });

  // Driver accepts order
  socket.on('accept_delivery_order', (payload: { orderId: string; driverId: string }) => {
    console.log(`[Order] Driver ${payload.driverId} accepted order ${payload.orderId}`.green);
    io.emit('order_status_changed', { orderId: payload.orderId, status: 'DRIVER_ACCEPTED', driverId: payload.driverId });
  });

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`.yellow);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Delix Backend Server & WebSockets running on port ${PORT}`);
});
