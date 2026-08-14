import { prisma } from '../lib/prisma';

export const createUserNotification = async (payload: {
  userId: string;
  title: string;
  message: string;
  type: string;
  orderId?: string;
}) => {
  try {
    return await prisma.notification.create({ data: payload });
  } catch {
    return null;
  }
};

export const notifyOrderCustomer = async (
  orderId: string,
  type: string,
  title: string,
  message: string
) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    });
    if (!order) return null;

    return createUserNotification({
      userId: order.customerId,
      title,
      message,
      type,
      orderId,
    });
  } catch {
    return null;
  }
};

export const getUserNotifications = async (userRef: string, limit = 50) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ id: userRef }, { phone: userRef }] },
  });
  if (!user) return [];

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const markNotificationRead = async (notificationId: string, userRef: string) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ id: userRef }, { phone: userRef }] },
  });
  if (!user) return null;

  return prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true },
  });
};
