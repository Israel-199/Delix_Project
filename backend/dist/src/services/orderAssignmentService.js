"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDriverToOrderAtomic = void 0;
const prisma_1 = require("../lib/prisma");
const assignDriverToOrderAtomic = async (orderId, driverId) => {
    try {
        const updated = await prisma_1.prisma.order.updateMany({
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
        const existing = await prisma_1.prisma.order.findUnique({
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
    }
    catch {
        // Database unavailable — allow socket-only flow for dev/fallback orders.
        return { success: true };
    }
};
exports.assignDriverToOrderAtomic = assignDriverToOrderAtomic;
