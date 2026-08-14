"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCustomerUserId = void 0;
const prisma_1 = require("../lib/prisma");
const resolveCustomerUserId = async (customerRef) => {
    const normalizedPhone = customerRef.startsWith('+')
        ? customerRef
        : `+${customerRef.replace(/\D/g, '')}`;
    const existing = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ id: customerRef }, { phone: normalizedPhone }, { phone: customerRef }],
        },
    });
    if (existing)
        return existing.id;
    const created = await prisma_1.prisma.user.create({
        data: { phone: normalizedPhone },
    });
    return created.id;
};
exports.resolveCustomerUserId = resolveCustomerUserId;
