import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../lib/prisma';
import { createUserNotification } from './notificationService';
import { driverRoom } from './driverSocketRegistry';

const findDriverUserId = async (driverRef: string) => {
  const driver = await prisma.driver.findFirst({
    where: {
      OR: [
        { id: driverRef },
        { plateNumber: driverRef },
        { licenseNumber: driverRef },
        { user: { phone: driverRef } },
      ],
    },
    select: { userId: true, id: true },
  });
  return driver;
};

export const notifyDriver = async (
  driverRef: string,
  type: string,
  title: string,
  message: string,
  orderId?: string,
  io?: SocketIOServer
) => {
  try {
    const driver = await findDriverUserId(driverRef);
    if (!driver) return null;

    const notification = await createUserNotification({
      userId: driver.userId,
      title,
      message,
      type,
      orderId,
    });

    if (io && notification) {
      io.to(driverRoom(driver.id)).emit('driver_notification', {
        id: notification.id,
        title,
        message,
        type,
        orderId,
        createdAt: notification.createdAt.toISOString(),
      });
    }

    return notification;
  } catch {
    return null;
  }
};
