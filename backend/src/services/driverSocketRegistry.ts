const driverSocketIds = new Map<string, Set<string>>();
const socketToDrivers = new Map<string, Set<string>>();

export const driverRoom = (driverId: string) => `driver:${driverId}`;

export const registerDriverSocket = (driverId: string, socketId: string) => {
  if (!driverId || !socketId) return;

  if (!driverSocketIds.has(driverId)) {
    driverSocketIds.set(driverId, new Set());
  }
  driverSocketIds.get(driverId)!.add(socketId);

  if (!socketToDrivers.has(socketId)) {
    socketToDrivers.set(socketId, new Set());
  }
  socketToDrivers.get(socketId)!.add(driverId);
};

export const unregisterSocket = (socketId: string) => {
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

export const getDriverSocketCount = (driverId: string) =>
  driverSocketIds.get(driverId)?.size ?? 0;
