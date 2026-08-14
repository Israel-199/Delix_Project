"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverSocketCount = exports.unregisterSocket = exports.registerDriverSocket = exports.driverRoom = void 0;
const driverSocketIds = new Map();
const socketToDrivers = new Map();
const driverRoom = (driverId) => `driver:${driverId}`;
exports.driverRoom = driverRoom;
const registerDriverSocket = (driverId, socketId) => {
    if (!driverId || !socketId)
        return;
    if (!driverSocketIds.has(driverId)) {
        driverSocketIds.set(driverId, new Set());
    }
    driverSocketIds.get(driverId).add(socketId);
    if (!socketToDrivers.has(socketId)) {
        socketToDrivers.set(socketId, new Set());
    }
    socketToDrivers.get(socketId).add(driverId);
};
exports.registerDriverSocket = registerDriverSocket;
const unregisterSocket = (socketId) => {
    const driverIds = socketToDrivers.get(socketId);
    if (driverIds) {
        for (const driverId of driverIds) {
            const sockets = driverSocketIds.get(driverId);
            sockets?.delete(socketId);
            if (sockets?.size === 0) {
                driverSocketIds.delete(driverId);
            }
        }
    }
    socketToDrivers.delete(socketId);
};
exports.unregisterSocket = unregisterSocket;
const getDriverSocketCount = (driverId) => driverSocketIds.get(driverId)?.size ?? 0;
exports.getDriverSocketCount = getDriverSocketCount;
