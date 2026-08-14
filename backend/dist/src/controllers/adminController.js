"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDriverDocuments = exports.updateUserBlockStatus = exports.getAdminUsers = exports.resetDriverCommissionCycle = exports.getAdminCommissions = exports.getLiveDrivers = exports.updatePricingConfig = exports.getPricingConfig = exports.getAdminOrders = exports.getAdminStats = void 0;
const prisma_1 = require("../lib/prisma");
const pricing_1 = require("../utils/pricing");
const driverLocationStore_1 = require("../services/driverLocationStore");
const driverTripCycleService_1 = require("../services/driverTripCycleService");
const driverTripService_1 = require("../services/driverTripService");
const driverNotificationService_1 = require("../services/driverNotificationService");
const pricingService_1 = require("../services/pricingService");
const formatOrderStatus = (status) => {
    switch (status) {
        case 'SEARCHING_DRIVER':
            return 'Searching';
        case 'DRIVER_ACCEPTED':
        case 'ARRIVED_PICKUP':
        case 'IN_TRANSIT':
            return 'In Transit';
        case 'COMPLETED':
            return 'Completed';
        case 'CANCELLED':
            return 'Cancelled';
        default:
            return status;
    }
};
const getAdminStats = async (_req, res) => {
    try {
        const [activeOrders, completedOrders, drivers, users] = await Promise.all([
            prisma_1.prisma.order.count({
                where: {
                    status: { in: ['SEARCHING_DRIVER', 'DRIVER_ACCEPTED', 'ARRIVED_PICKUP', 'IN_TRANSIT'] },
                },
            }),
            prisma_1.prisma.order.count({ where: { status: 'COMPLETED' } }),
            prisma_1.prisma.driver.count({ where: { status: 'ACTIVE' } }),
            prisma_1.prisma.user.count(),
        ]);
        return res.status(200).json({
            success: true,
            stats: {
                activeDeliveries: activeOrders,
                verifiedDrivers: drivers,
                completedOrders,
                totalUsers: users,
            },
        });
    }
    catch {
        return res.status(200).json({
            success: true,
            stats: {
                activeDeliveries: 0,
                verifiedDrivers: 0,
                completedOrders: 0,
                totalUsers: 0,
            },
        });
    }
};
exports.getAdminStats = getAdminStats;
const getAdminOrders = async (_req, res) => {
    try {
        const orders = await prisma_1.prisma.order.findMany({
            include: {
                customer: { select: { phone: true, firstName: true, lastName: true } },
                driver: {
                    select: {
                        plateNumber: true,
                        user: { select: { firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return res.status(200).json({
            success: true,
            orders: orders.map((order) => ({
                id: order.id,
                customerName: [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') ||
                    'Customer',
                customerPhone: order.customer.phone,
                cargoCategory: order.cargoCategory.replace(/_/g, ' '),
                vehicleRequested: order.vehicleRequested.replace(/_/g, ' '),
                pickup: order.pickupAddress,
                destination: order.destinationAddress,
                price: `${Math.round(order.estimatedPrice)} ETB`,
                status: formatOrderStatus(order.status),
                date: order.createdAt.toISOString(),
                driverPlate: order.driver?.plateNumber ?? null,
            })),
        });
    }
    catch {
        return res.status(200).json({ success: true, orders: [] });
    }
};
exports.getAdminOrders = getAdminOrders;
const getPricingConfig = async (_req, res) => {
    await (0, pricingService_1.refreshPricingCache)();
    const pricing = (0, pricingService_1.getCachedPricing)();
    res.status(200).json({
        success: true,
        pricing: {
            baseFare: pricing.baseFare,
            perKmRate: pricing.perKmRate,
            waitingRatePerHour: pricing.waitingRatePerHour,
            formula: (0, pricingService_1.formatPricingFormula)(pricing),
        },
    });
};
exports.getPricingConfig = getPricingConfig;
const updatePricingConfig = async (req, res) => {
    try {
        const pricing = await (0, pricingService_1.updatePricingSettings)({
            baseFare: Number(req.body.baseFare ?? pricing_1.BASE_FARE_ETB),
            perKmRate: Number(req.body.perKmRate ?? pricing_1.DISTANCE_RATE_ETB_PER_KM),
            waitingRatePerHour: Number(req.body.waitingRatePerHour ?? pricing_1.WAITING_RATE_ETB_PER_HOUR),
        });
        res.status(200).json({
            success: true,
            message: 'Pricing updated. New rates apply immediately to all estimates and orders.',
            pricing: {
                baseFare: pricing.baseFare,
                perKmRate: pricing.perKmRate,
                waitingRatePerHour: pricing.waitingRatePerHour,
                formula: (0, pricingService_1.formatPricingFormula)(pricing),
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Pricing update failed';
        res.status(400).json({ error: message });
    }
};
exports.updatePricingConfig = updatePricingConfig;
const getLiveDrivers = async (_req, res) => {
    const drivers = (0, driverLocationStore_1.getAllLiveDrivers)().map((d) => ({
        id: d.driverId,
        latitude: d.latitude,
        longitude: d.longitude,
        vehicleType: d.vehicleType,
        plateNumber: d.plateNumber,
        name: d.name,
        available: d.available,
        lastUpdate: d.lastUpdate,
    }));
    res.status(200).json({ success: true, drivers });
};
exports.getLiveDrivers = getLiveDrivers;
const getAdminCommissions = async (_req, res) => {
    try {
        const drivers = await prisma_1.prisma.driver.findMany({
            include: {
                user: { select: { phone: true, firstName: true, lastName: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        const commissions = drivers.map((driver) => {
            const completedTripsInCycle = driver.completedTrips % driverTripCycleService_1.TRIP_CYCLE_LENGTH;
            const needsRecharge = driver.commissionBalance > 0 && completedTripsInCycle === 0;
            return {
                driverId: driver.id,
                driverName: [driver.user.firstName, driver.user.lastName].filter(Boolean).join(' ') ||
                    driver.plateNumber,
                phone: driver.user.phone,
                completedTripsInCycle,
                cycleStatus: needsRecharge ? 'Recharge Required' : 'Active',
                commissionAmount: Math.round(driver.commissionBalance),
                lastPaymentDate: driver.updatedAt.toISOString().slice(0, 10),
            };
        });
        return res.status(200).json({ success: true, commissions });
    }
    catch {
        return res.status(200).json({ success: true, commissions: [] });
    }
};
exports.getAdminCommissions = getAdminCommissions;
const resetDriverCommissionCycle = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const cycle = await (0, driverTripService_1.resetDriverTripCycle)(driverRef);
        await (0, driverNotificationService_1.notifyDriver)(driverRef, 'PAYMENT_CONFIRMED', 'Payment confirmed', 'Your Delix commission payment was confirmed. A new 10-trip cycle has started.');
        return res.status(200).json({
            success: true,
            message: 'Commission cycle reset. Driver can start a new 10-trip batch.',
            ...cycle,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reset cycle';
        return res.status(500).json({ error: message });
    }
};
exports.resetDriverCommissionCycle = resetDriverCommissionCycle;
const getAdminUsers = async (_req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            include: {
                _count: { select: { customerOrders: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        return res.status(200).json({
            success: true,
            users: users.map((user) => ({
                id: user.id,
                name: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') ||
                    user.phone,
                phone: user.phone,
                totalOrders: user._count.customerOrders,
                registeredDate: user.createdAt.toISOString().slice(0, 10),
                status: user.isBlocked ? 'Blocked' : 'Active',
            })),
        });
    }
    catch {
        return res.status(200).json({ success: true, users: [] });
    }
};
exports.getAdminUsers = getAdminUsers;
const updateUserBlockStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { blocked } = req.body;
        if (typeof blocked !== 'boolean') {
            return res.status(400).json({ error: 'blocked boolean required' });
        }
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { isBlocked: blocked },
        });
        return res.status(200).json({
            success: true,
            message: blocked ? 'Customer account blocked' : 'Customer account unblocked',
            user: {
                id: user.id,
                phone: user.phone,
                status: user.isBlocked ? 'Blocked' : 'Active',
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update user status';
        return res.status(500).json({ error: message });
    }
};
exports.updateUserBlockStatus = updateUserBlockStatus;
const getAdminDriverDocuments = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const driver = await prisma_1.prisma.driver.findFirst({
            where: {
                OR: [
                    { id: driverRef },
                    { plateNumber: driverRef },
                    { licenseNumber: driverRef },
                    { user: { phone: driverRef } },
                ],
            },
        });
        if (!driver) {
            return res.status(200).json({ success: true, documents: [], requiredTypes: [] });
        }
        const documents = await prisma_1.prisma.driverDocument.findMany({
            where: { driverId: driver.id },
            orderBy: { type: 'asc' },
        });
        return res.status(200).json({
            success: true,
            documents: documents.map((doc) => ({
                id: doc.id,
                type: doc.type,
                url: doc.url,
                publicId: doc.publicId,
                updatedAt: doc.updatedAt.toISOString(),
            })),
            requiredTypes: ['LICENSE', 'NATIONAL_ID', 'REGISTRATION_BOOK', 'INSURANCE'],
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load driver documents';
        return res.status(500).json({ error: message });
    }
};
exports.getAdminDriverDocuments = getAdminDriverDocuments;
