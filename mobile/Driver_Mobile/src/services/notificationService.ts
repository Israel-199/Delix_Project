import { API_BASE_URL } from '../config/api';

export interface DriverNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  orderId?: string | null;
  createdAt: string;
}

export const fetchDriverNotifications = async (phone: string): Promise<DriverNotification[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/notifications?phone=${encodeURIComponent(phone)}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.notifications ?? [];
  } catch {
    return [];
  }
};

export const markDriverNotificationRead = async (
  notificationId: string,
  phone: string
): Promise<void> => {
  try {
    await fetch(
      `${API_BASE_URL}/api/users/notifications/${encodeURIComponent(notificationId)}/read?phone=${encodeURIComponent(phone)}`,
      { method: 'PATCH' }
    );
  } catch {
    // non-blocking
  }
};
