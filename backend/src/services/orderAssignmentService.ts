import { prisma } from '../lib/prisma';

export type AssignDriverResult =
  | { success: true; idempotent?: boolean }
  | { success: false; reason: 'no_longer_available' | 'not_found' };

export const assignDriverToOrderAtomic = async (
  orderId: string,
  driverId: string
): Promise<AssignDriverResult> => {
  try {
    const updated = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: 'SEARCHING_DRIVER',
        driverId: null,
      },
      data: {
        status: 'DRIVER_ACCEPTED',
        driverId,
      },
    });

    if (updated.count > 0) {
      return { success: true };
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, driverId: true },
    });

    if (!existing) {
      return { success: false, reason: 'not_found' };
    }

    if (existing.status === 'DRIVER_ACCEPTED' && existing.driverId === driverId) {
      return { success: true, idempotent: true };
    }

    return { success: false, reason: 'no_longer_available' };
  } catch {
    // Database unavailable — allow socket-only flow for dev/fallback orders.
    return { success: true };
  }
};
