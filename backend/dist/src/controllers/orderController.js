"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptOrder = exports.getUserOrders = exports.createOrder = exports.estimateOrderPrice = exports.getOrderById = void 0;
const prisma_1 = require("../lib/prisma");
const orderAssignmentService_1 = require("../services/orderAssignmentService");
const pricing_1 = require("../utils/pricing");
const calculatePrice = (distanceKm, waitingHours = 0) => (0, pricing_1.calculateAuthoritativeFare)(distanceKm || 0, waitingHours);
const CARGO_MAP = {
    FURNITURE: 'FURNITURE',
    CONSTRUCTION_MATERIALS: 'CONSTRUCTION_MATERIALS',
    CONSTRUCTION: 'CONSTRUCTION_MATERIALS',
    SHOP_GOODS: 'SHOP_GOODS',
    BUSINESS_GOODS: 'SHOP_GOODS',
    DOCUMENTS: 'DOCUMENTS',
    OTHER: 'OTHER',
};
const VEHICLE_MAP = {
    LADA_BED: 'LADA_BED',
    PICKUP_TRUCK: 'PICKUP_TRUCK',
    MINI_TRUCK: 'MINI_TRUCK',
    LARGE_TRUCK: 'LARGE_TRUCK',
};
const resolveCustomerUserId = async (customerRef) => {
    const normalizedPhone = customerRef.startsWith('+') ? customerRef : `+${customerRef.replace(/\D/g, '')}`;
    const existing = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ id: customerRef }, { phone: normalizedPhone }, { phone: customerRef }],
        },
    });
    if (existing) {
        if (existing.isBlocked) {
            throw new Error('BLOCKED_USER');
        }
        return existing.id;
    }
    const created = await prisma_1.prisma.user.create({
        data: { phone: normalizedPhone },
    });
    return created.id;
};
const formatOrderResponse = (order) => ({
    id: order.id,
    customerId: order.customerId,
    cargoCategory: order.cargoCategory,
    vehicleRequested: order.vehicleRequested,
    pickupAddress: order.pickupAddress,
    pickupLat: order.pickupLat,
    pickupLng: order.pickupLng,
    destinationAddress: order.destinationAddress,
    destinationLat: order.destinationLat,
    destinationLng: order.destinationLng,
    estimatedPrice: order.estimatedPrice,
    currency: 'ETB',
    distanceKm: order.distanceKm,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
});
const getOrderById = async (req, res) => {
    try {
        const orderId = String(req.params.id ?? '').trim();
        if (!orderId) {
            return res.status(400).json({ error: 'order id required' });
        }
        try {
            const order = await prisma_1.prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    driver: {
                        include: {
                            user: { select: { phone: true, firstName: true, lastName: true } },
                        },
                    },
                    customer: { select: { phone: true, firstName: true, lastName: true } },
                },
            });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            const driverName = order.driver
                ? [order.driver.user.firstName, order.driver.user.lastName].filter(Boolean).join(' ') ||
                    'Driver'
                : undefined;
            return res.status(200).json({
                success: true,
                order: {
                    ...formatOrderResponse(order),
                    driverId: order.driverId ?? undefined,
                    driverName,
                    driverPhone: order.driver?.user.phone,
                    plateNumber: order.driver?.plateNumber,
                    paymentMethod: 'Cash',
                },
            });
        }
        catch {
            return res.status(404).json({ error: 'Order not found' });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch order';
        res.status(500).json({ error: message });
    }
};
exports.getOrderById = getOrderById;
const estimateOrderPrice = async (req, res) => {
    try {
        const { vehicleType, distanceKm, waitingHours = 0 } = req.body;
        const { priceAmount, currency, breakdown } = calculatePrice(distanceKm, waitingHours);
        res.status(200).json({
            success: true,
            vehicleType,
            distanceKm: distanceKm || 0,
            estimatedPrice: priceAmount,
            currency,
            breakdown,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Pricing calculation failed';
        res.status(500).json({ error: message });
    }
};
exports.estimateOrderPrice = estimateOrderPrice;
const createOrder = async (req, res) => {
    try {
        const { customerId, cargoCategory, vehicleRequested, pickupAddress, pickupLat, pickupLng, destinationAddress, destinationLat, destinationLng, distanceKm, loadingAssistance, unloadingAssistance, cargoDescription, paymentMethod, } = req.body;
        const waitingHours = Number(req.body.waitingHours ?? 0);
        const { priceAmount } = calculatePrice(distanceKm, waitingHours);
        const cargo = CARGO_MAP[String(cargoCategory ?? 'OTHER').toUpperCase()] ?? 'OTHER';
        const vehicle = VEHICLE_MAP[String(vehicleRequested ?? 'PICKUP_TRUCK').toUpperCase()] ?? 'PICKUP_TRUCK';
        const pickupLatNum = Number(pickupLat ?? 9.0205);
        const pickupLngNum = Number(pickupLng ?? 38.7469);
        const destLatNum = Number(destinationLat ?? pickupLatNum);
        const destLngNum = Number(destinationLng ?? pickupLngNum);
        const distanceNum = Number(distanceKm ?? 0);
        try {
            const userId = await resolveCustomerUserId(String(customerId ?? 'guest'));
            const order = await prisma_1.prisma.order.create({
                data: {
                    customerId: userId,
                    cargoCategory: cargo,
                    cargoDescription: cargoDescription ?? null,
                    vehicleRequested: vehicle,
                    pickupAddress: pickupAddress ?? 'Pickup',
                    pickupLat: pickupLatNum,
                    pickupLng: pickupLngNum,
                    destinationAddress: destinationAddress ?? 'Destination',
                    destinationLat: destLatNum,
                    destinationLng: destLngNum,
                    loadingAssistance: Boolean(loadingAssistance),
                    unloadingAssistance: Boolean(unloadingAssistance),
                    distanceKm: distanceNum,
                    estimatedPrice: priceAmount,
                    paymentMethod: paymentMethod ?? 'Cash',
                    status: 'SEARCHING_DRIVER',
                },
                include: {
                    customer: { select: { phone: true, firstName: true, middleName: true, lastName: true } },
                },
            });
            const customerName = [order.customer.firstName, order.customer.middleName, order.customer.lastName]
                .filter(Boolean)
                .join(' ') || 'Customer';
            return res.status(201).json({
                success: true,
                message: 'Order created successfully. Searching for nearby drivers...',
                order: {
                    ...formatOrderResponse(order),
                    paymentMethod: paymentMethod ?? 'Cash',
                    customerPhone: order.customer.phone,
                    customerName,
                },
            });
        }
        catch (dbError) {
            if (dbError instanceof Error && dbError.message === 'BLOCKED_USER') {
                return res.status(403).json({ error: 'This account has been blocked. Contact Delix support.' });
            }
            console.warn('[Order] Database unavailable, using in-memory order:', dbError);
            const fallbackOrder = {
                id: `DLX-${Math.floor(1000 + Math.random() * 9000)}`,
                customerId: customerId || 'USR-TEMP',
                customerPhone: String(customerId ?? ''),
                customerName: 'Customer',
                cargoCategory: cargo,
                vehicleRequested: vehicle,
                pickupAddress,
                pickupLat: pickupLatNum,
                pickupLng: pickupLngNum,
                destinationAddress,
                destinationLat: destLatNum,
                destinationLng: destLngNum,
                estimatedPrice: priceAmount,
                currency: 'ETB',
                paymentMethod: paymentMethod || 'Cash',
                distanceKm: distanceNum,
                status: 'SEARCHING_DRIVER',
                createdAt: new Date().toISOString(),
            };
            return res.status(201).json({
                success: true,
                message: 'Order created successfully. Searching for nearby drivers...',
                order: fallbackOrder,
            });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Order creation failed';
        res.status(500).json({ error: message });
    }
};
exports.createOrder = createOrder;
const getUserOrders = async (req, res) => {
    try {
        const customerRef = String(req.query.customerId ?? req.query.phone ?? '').trim();
        if (customerRef) {
            try {
                const user = await prisma_1.prisma.user.findFirst({
                    where: {
                        OR: [{ phone: customerRef }, { id: customerRef }],
                    },
                });
                if (user) {
                    const orders = await prisma_1.prisma.order.findMany({
                        where: { customerId: user.id },
                        orderBy: { createdAt: 'desc' },
                        take: 50,
                    });
                    return res.status(200).json({
                        success: true,
                        orders: orders.map((order) => ({
                            ...formatOrderResponse(order),
                            paymentMethod: 'Cash',
                        })),
                    });
                }
            }
            catch (dbError) {
                console.warn('[Order] Could not load orders from database:', dbError);
            }
        }
        res.status(200).json({ success: true, orders: [] });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch orders';
        res.status(500).json({ error: message });
    }
};
exports.getUserOrders = getUserOrders;
const acceptOrder = async (req, res) => {
    try {
        const { orderId, driverId } = req.body;
        if (!orderId || !driverId) {
            return res.status(400).json({ error: 'orderId and driverId required' });
        }
        try {
            let resolvedDriverId;
            try {
                const driver = await prisma_1.prisma.driver.findFirst({
                    where: {
                        OR: [
                            { id: driverId },
                            { plateNumber: driverId },
                            { user: { phone: driverId } },
                        ],
                    },
                });
                resolvedDriverId = driver?.id;
            }
            catch {
                resolvedDriverId = driverId.startsWith('DRV-') ? undefined : driverId;
            }
            const assignment = await (0, orderAssignmentService_1.assignDriverToOrderAtomic)(orderId, resolvedDriverId ?? driverId);
            if (!assignment.success) {
                return res.status(409).json({ error: 'This trip is no longer available.' });
            }
            const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            return res.status(200).json({
                success: true,
                order: formatOrderResponse(order),
            });
        }
        catch {
            return res.status(409).json({ error: 'This trip is no longer available.' });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Accept failed';
        res.status(500).json({ error: message });
    }
};
exports.acceptOrder = acceptOrder;
