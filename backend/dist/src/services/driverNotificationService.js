"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyDriver = void 0;
const prisma_1 = require("../lib/prisma");
const notificationService_1 = require("./notificationService");
const driverSocketRegistry_1 = require("./driverSocketRegistry");
const findDriverUserId = async (driverRef) => {
    const driver = await prisma_1.prisma.driver.findFirst({
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
const notifyDriver = async (driverRef, type, title, message, orderId, io) => {
    try {
        const driver = await findDriverUserId(driverRef);
        if (!driver)
            return null;
        const notification = await (0, notificationService_1.createUserNotification)({
            userId: driver.userId,
            title,
            message,
            type,
            orderId,
        });
        if (io && notification) {
            io.to((0, driverSocketRegistry_1.driverRoom)(driver.id)).emit('driver_notification', {
                id: notification.id,
                title,
                message,
                type,
                orderId,
                createdAt: notification.createdAt.toISOString(),
            });
        }
        return notification;
    }
    catch {
        return null;
    }
};
exports.notifyDriver = notifyDriver;
