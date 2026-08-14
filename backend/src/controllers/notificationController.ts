import { Request, Response } from 'express';
import {
  getUserNotifications,
  markNotificationRead,
} from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userRef = String(req.query.phone ?? req.query.userId ?? '').trim();
    if (!userRef) {
      return res.status(400).json({ error: 'phone or userId query param required' });
    }

    const notifications = await getUserNotifications(userRef);

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load notifications';
    return res.status(500).json({ error: message });
  }
};

export const readNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRef = String(req.query.phone ?? req.query.userId ?? '').trim();
    if (!userRef) {
      return res.status(400).json({ error: 'phone or userId query param required' });
    }

    await markNotificationRead(id, userRef);
    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update notification';
    return res.status(500).json({ error: message });
  }
};
