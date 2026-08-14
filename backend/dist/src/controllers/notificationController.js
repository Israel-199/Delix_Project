"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readNotification = exports.getNotifications = void 0;
const notificationService_1 = require("../services/notificationService");
const getNotifications = async (req, res) => {
    try {
        const userRef = String(req.query.phone ?? req.query.userId ?? '').trim();
        if (!userRef) {
            return res.status(400).json({ error: 'phone or userId query param required' });
        }
        const notifications = await (0, notificationService_1.getUserNotifications)(userRef);
        return res.status(200).json({
            success: true,
            notifications: notifications.map((n) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                read: n.read,
                orderId: n.orderId,
                createdAt: n.createdAt.toISOString(),
            })),
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load notifications';
        return res.status(500).json({ error: message });
    }
};
exports.getNotifications = getNotifications;
const readNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userRef = String(req.query.phone ?? req.query.userId ?? '').trim();
        if (!userRef) {
            return res.status(400).json({ error: 'phone or userId query param required' });
        }
        await (0, notificationService_1.markNotificationRead)(id, userRef);
        return res.status(200).json({ success: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update notification';
        return res.status(500).json({ error: message });
    }
};
exports.readNotification = readNotification;
