"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getUserNotifications = exports.notifyOrderCustomer = exports.createUserNotification = void 0;
const prisma_1 = require("../lib/prisma");
const createUserNotification = async (payload) => {
    try {
        return await prisma_1.prisma.notification.create({ data: payload });
    }
    catch {
        return null;
    }
};
exports.createUserNotification = createUserNotification;
const notifyOrderCustomer = async (orderId, type, title, message) => {
    try {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            select: { customerId: true },
        });
        if (!order)
            return null;
        return (0, exports.createUserNotification)({
            userId: order.customerId,
            title,
            message,
            type,
            orderId,
        });
    }
    catch {
        return null;
    }
};
exports.notifyOrderCustomer = notifyOrderCustomer;
const getUserNotifications = async (userRef, limit = 50) => {
    const user = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ id: userRef }, { phone: userRef }] },
    });
    if (!user)
        return [];
    return prisma_1.prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};
exports.getUserNotifications = getUserNotifications;
const markNotificationRead = async (notificationId, userRef) => {
    const user = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ id: userRef }, { phone: userRef }] },
    });
    if (!user)
        return null;
    return prisma_1.prisma.notification.updateMany({
        where: { id: notificationId, userId: user.id },
        data: { read: true },
    });
};
exports.markNotificationRead = markNotificationRead;
