"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverEarnings = exports.getDriverActiveOrder = exports.getDriverTrips = exports.completeDriverTrip = exports.getDriverCycle = exports.updateDriverStatus = exports.getDriverProfile = exports.getDrivers = exports.registerDriver = void 0;
const prisma_1 = require("../lib/prisma");
const driverTripCycleService_1 = require("../services/driverTripCycleService");
const driverTripService_1 = require("../services/driverTripService");
const driverNotificationService_1 = require("../services/driverNotificationService");
const mockDriverList = [
    {
        id: 'DRV-101',
        name: 'Yared Moges',
        phone: '+251911234567',
        vehicleType: 'MINI_TRUCK',
        plateNumber: 'AA-3-90812',
        licenseNumber: 'ETH-89412',
        city: 'Addis Ababa',
        status: 'PENDING_APPROVAL',
        completedTrips: 0,
        commissionBalance: 0,
    },
    {
        id: 'DRV-102',
        name: 'Ahmed Hassan',
        phone: '+25377123456',
        vehicleType: 'LARGE_TRUCK',
        plateNumber: 'DJ-5-44312',
        licenseNumber: 'DJI-00319',
        city: 'Djibouti City',
        status: 'PENDING_APPROVAL',
        completedTrips: 0,
        commissionBalance: 0,
    },
    {
        id: 'DRV-103',
        name: 'Kassahun Bekele',
        phone: '+251912887766',
        vehicleType: 'PICKUP_TRUCK',
        plateNumber: 'AA-2-12894',
        licenseNumber: 'ETH-11029',
        city: 'Adama',
        status: 'ACTIVE',
        completedTrips: 6,
        commissionBalance: 350,
    },
];
const registerDriver = async (req, res) => {
    try {
        const { name, phone, licenseNumber, licensePhotoUrl, nationalId, plateNumber, vehicleType, vehicleCargoType, vehicleOwnerName, librePhotoUrl, insuranceInfo, bankAccount, city, address, } = req.body;
        if (!name || !phone || !plateNumber || !vehicleType) {
            return res.status(400).json({ error: 'Driver name, phone, plate number, and vehicle type are required.' });
        }
        const normalizedPhone = String(phone).replace(/\s/g, '');
        const nameParts = String(name).trim().split(' ');
        const firstName = nameParts[0] || 'Driver';
        const lastName = nameParts.slice(1).join(' ') || '';
        // Map requested vehicle types to internal VehicleType enum
        let vehicle = 'MINI_TRUCK';
        const vtUpper = String(vehicleType).toUpperCase();
        if (vtUpper.includes('LADA'))
            vehicle = 'LADA_BED';
        else if (vtUpper.includes('PICKUP'))
            vehicle = 'PICKUP_TRUCK';
        else if (vtUpper.includes('LARGE') || vtUpper.includes('5 TON') || vtUpper.includes('3 TON') || vtUpper.includes('REFRIGERATED'))
            vehicle = 'LARGE_TRUCK';
        else
            vehicle = 'MINI_TRUCK';
        try {
            let user = await prisma_1.prisma.user.findFirst({
                where: { OR: [{ phone }, { phone: normalizedPhone }] },
            });
            if (!user) {
                user = await prisma_1.prisma.user.create({
                    data: {
                        phone: normalizedPhone,
                        role: 'DRIVER',
                        firstName,
                        lastName,
                    },
                });
            }
            else {
                await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        firstName,
                        lastName: lastName || user.lastName,
                        role: 'DRIVER',
                    },
                });
            }
            const existingDriver = await prisma_1.prisma.driver.findFirst({
                where: { userId: user.id },
            });
            const effectiveLicense = licenseNumber || `LIC-${normalizedPhone.slice(-6)}`;
            const cleanPlate = plateNumber.toUpperCase().trim();
            const userAddress = address || city || 'Addis Ababa';
            let driver;
            if (existingDriver) {
                driver = await prisma_1.prisma.driver.update({
                    where: { id: existingDriver.id },
                    data: {
                        licenseNumber: effectiveLicense,
                        vehicleType: vehicle,
                        plateNumber: cleanPlate,
                        nationalId: nationalId || existingDriver.nationalId,
                        vehicleCargoType: vehicleCargoType || existingDriver.vehicleCargoType,
                        vehicleOwnerName: vehicleOwnerName || existingDriver.vehicleOwnerName,
                        insuranceInfo: insuranceInfo || existingDriver.insuranceInfo,
                        bankAccount: bankAccount || existingDriver.bankAccount,
                        address: userAddress,
                        photoUrl: licensePhotoUrl || existingDriver.photoUrl,
                        status: 'PENDING_APPROVAL',
                    },
                });
            }
            else {
                driver = await prisma_1.prisma.driver.create({
                    data: {
                        userId: user.id,
                        licenseNumber: effectiveLicense,
                        vehicleType: vehicle,
                        plateNumber: cleanPlate,
                        nationalId,
                        vehicleCargoType,
                        vehicleOwnerName,
                        insuranceInfo,
                        bankAccount,
                        address: userAddress,
                        photoUrl: licensePhotoUrl,
                        status: 'PENDING_APPROVAL',
                    },
                });
            }
            // Save driver documents if photo URLs are provided
            if (licensePhotoUrl) {
                await prisma_1.prisma.driverDocument.upsert({
                    where: { driverId_type: { driverId: driver.id, type: 'LICENSE' } },
                    update: { url: licensePhotoUrl },
                    create: { driverId: driver.id, type: 'LICENSE', url: licensePhotoUrl },
                }).catch(() => null);
            }
            if (librePhotoUrl) {
                await prisma_1.prisma.driverDocument.upsert({
                    where: { driverId_type: { driverId: driver.id, type: 'REGISTRATION_BOOK' } },
                    update: { url: librePhotoUrl },
                    create: { driverId: driver.id, type: 'REGISTRATION_BOOK', url: librePhotoUrl },
                }).catch(() => null);
            }
            return res.status(201).json({
                success: true,
                message: 'Driver registered successfully.',
                driver: {
                    id: driver.id,
                    name,
                    phone: normalizedPhone,
                    licenseNumber: driver.licenseNumber,
                    vehicleType: driver.vehicleType,
                    plateNumber: driver.plateNumber,
                    status: driver.status,
                    completedTrips: driver.completedTrips,
                },
            });
        }
        catch (dbErr) {
            console.warn('[Driver Register DB Warning]:', dbErr.message || dbErr);
        }
        const newDriver = {
            id: `DRV-${Math.floor(100 + Math.random() * 900)}`,
            name,
            phone: normalizedPhone,
            licenseNumber: licenseNumber || 'ETH-89412',
            vehicleType,
            plateNumber: plateNumber.toUpperCase(),
            city: address || city || 'Addis Ababa',
            status: 'PENDING_APPROVAL',
            completedTrips: 0,
            commissionBalance: 0,
        };
        mockDriverList.push(newDriver);
        return res.status(201).json({
            success: true,
            message: 'Driver registered successfully.',
            driver: newDriver,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Driver registration failed';
        res.status(500).json({ error: message });
    }
};
exports.registerDriver = registerDriver;
const getDrivers = async (_req, res) => {
    try {
        try {
            const drivers = await prisma_1.prisma.driver.findMany({
                include: {
                    user: { select: { phone: true, firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
            if (drivers.length > 0) {
                return res.status(200).json({
                    success: true,
                    count: drivers.length,
                    drivers: drivers.map((d) => ({
                        id: d.id,
                        name: [d.user.firstName, d.user.lastName].filter(Boolean).join(' ') || d.plateNumber,
                        phone: d.user.phone,
                        vehicleType: d.vehicleType,
                        plateNumber: d.plateNumber,
                        licenseNumber: d.licenseNumber,
                        status: d.status,
                        completedTrips: d.completedTrips,
                        commissionBalance: d.commissionBalance,
                    })),
                });
            }
        }
        catch {
            // fall through to mock list
        }
        res.status(200).json({
            success: true,
            count: mockDriverList.length,
            drivers: mockDriverList,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch drivers';
        res.status(500).json({ error: message });
    }
};
exports.getDrivers = getDrivers;
const getDriverProfile = async (req, res) => {
    try {
        const phone = String(req.query.phone ?? '').trim();
        if (!phone) {
            return res.status(400).json({ error: 'phone query param required' });
        }
        const normalized = phone.replace(/\s/g, '');
        try {
            const user = await prisma_1.prisma.user.findFirst({
                where: {
                    OR: [{ phone }, { phone: normalized }],
                },
                include: { driverProfile: true },
            });
            if (user?.driverProfile) {
                const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone;
                return res.status(200).json({
                    success: true,
                    driver: {
                        id: user.driverProfile.id,
                        name,
                        phone: user.phone,
                        profilePhotoUrl: user.profilePhotoUrl ?? user.driverProfile.photoUrl,
                        plateNumber: user.driverProfile.plateNumber,
                        vehicleType: user.driverProfile.vehicleType,
                        status: user.driverProfile.status,
                        completedTrips: user.driverProfile.completedTrips,
                    },
                });
            }
        }
        catch {
            // fall through
        }
        const mock = mockDriverList.find((d) => d.phone.replace(/\s/g, '') === normalized || d.phone === phone);
        if (mock) {
            return res.status(200).json({
                success: true,
                driver: {
                    id: mock.id,
                    plateNumber: mock.plateNumber,
                    vehicleType: mock.vehicleType,
                    status: mock.status,
                    completedTrips: mock.completedTrips,
                },
            });
        }
        res.status(200).json({ success: true, driver: null });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch driver profile';
        res.status(500).json({ error: message });
    }
};
exports.getDriverProfile = getDriverProfile;
const updateDriverStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        try {
            const updated = await prisma_1.prisma.driver.update({
                where: { id },
                data: { status: status },
            });
            return res.status(200).json({
                success: true,
                message: `Driver status updated to ${status}`,
                driver: updated,
            });
        }
        catch {
            // fall through
        }
        const driver = mockDriverList.find((d) => d.id === id);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        driver.status = status;
        res.status(200).json({
            success: true,
            message: `Driver status updated to ${status}`,
            driver,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Driver status update failed';
        res.status(500).json({ error: message });
    }
};
exports.updateDriverStatus = updateDriverStatus;
const getDriverCycle = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const cycle = await (0, driverTripService_1.getDriverTripCycle)(driverRef);
        res.status(200).json({
            success: true,
            cycleLength: driverTripCycleService_1.TRIP_CYCLE_LENGTH,
            ...cycle,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch trip cycle';
        res.status(500).json({ error: message });
    }
};
exports.getDriverCycle = getDriverCycle;
const completeDriverTrip = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const { orderId, earnings = 0 } = req.body;
        if (orderId) {
            try {
                await prisma_1.prisma.order.update({
                    where: { id: orderId },
                    data: { status: 'COMPLETED' },
                });
            }
            catch {
                // order may be in-memory only
            }
        }
        const cycle = await (0, driverTripService_1.recordDriverTripComplete)(driverRef, Number(earnings) || 0);
        if (cycle.cycleReset) {
            await (0, driverNotificationService_1.notifyDriver)(driverRef, 'PAYMENT_DUE', 'Commission payment due', `You completed 10 trips. Pay ${Math.round(cycle.commissionBalance ?? 0)} ETB via Telebirr before your next batch.`);
        }
        else {
            await (0, driverNotificationService_1.notifyDriver)(driverRef, 'TRIP_COMPLETED', 'Trip completed', 'Your delivery was marked complete.', orderId);
        }
        res.status(200).json({
            success: true,
            message: cycle.cycleReset
                ? 'Trip completed. 10-trip cycle finished — Telebirr commission recharge required.'
                : 'Trip completed.',
            cycleLength: driverTripCycleService_1.TRIP_CYCLE_LENGTH,
            ...cycle,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to complete trip';
        res.status(500).json({ error: message });
    }
};
exports.completeDriverTrip = completeDriverTrip;
const findDriverRecord = async (driverRef) => {
    return prisma_1.prisma.driver.findFirst({
        where: {
            OR: [
                { id: driverRef },
                { plateNumber: driverRef },
                { licenseNumber: driverRef },
                { user: { phone: driverRef } },
            ],
        },
    });
};
const getDriverTrips = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const page = Math.max(1, Number(req.query.page ?? 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
        const skip = (page - 1) * limit;
        const driver = await findDriverRecord(driverRef);
        if (!driver) {
            return res.status(200).json({ success: true, trips: [], page, total: 0 });
        }
        const [trips, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where: { driverId: driver.id, status: 'COMPLETED' },
                include: {
                    customer: { select: { phone: true, firstName: true, lastName: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.order.count({ where: { driverId: driver.id, status: 'COMPLETED' } }),
        ]);
        return res.status(200).json({
            success: true,
            page,
            total,
            trips: trips.map((trip) => ({
                id: trip.id,
                customerName: [trip.customer.firstName, trip.customer.lastName].filter(Boolean).join(' ') ||
                    trip.customer.phone,
                customerPhone: trip.customer.phone,
                pickup: trip.pickupAddress,
                destination: trip.destinationAddress,
                cargoCategory: trip.cargoCategory.replace(/_/g, ' '),
                distanceKm: trip.distanceKm,
                fare: Math.round(trip.estimatedPrice),
                paymentMethod: trip.paymentMethod ?? 'Cash',
                status: trip.status,
                date: trip.updatedAt.toISOString(),
            })),
        });
    }
    catch {
        return res.status(200).json({ success: true, trips: [], page: 1, total: 0 });
    }
};
exports.getDriverTrips = getDriverTrips;
const getDriverActiveOrder = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const driver = await findDriverRecord(driverRef);
        if (!driver) {
            return res.status(200).json({ success: true, order: null });
        }
        const order = await prisma_1.prisma.order.findFirst({
            where: {
                driverId: driver.id,
                status: { in: ['DRIVER_ACCEPTED', 'ARRIVED_PICKUP', 'IN_TRANSIT'] },
            },
            include: {
                customer: { select: { phone: true, firstName: true, lastName: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        if (!order) {
            return res.status(200).json({ success: true, order: null });
        }
        const customerName = [order.customer.firstName, order.customer.lastName].filter(Boolean).join(' ') ||
            'Customer';
        return res.status(200).json({
            success: true,
            order: {
                orderId: order.id,
                id: order.id,
                status: order.status,
                pickupAddress: order.pickupAddress,
                pickupLat: order.pickupLat,
                pickupLng: order.pickupLng,
                destinationAddress: order.destinationAddress,
                destinationLat: order.destinationLat,
                destinationLng: order.destinationLng,
                vehicleRequested: order.vehicleRequested,
                estimatedPrice: order.estimatedPrice,
                currency: 'ETB',
                distanceKm: order.distanceKm,
                customerPhone: order.customer.phone,
                customerName,
            },
        });
    }
    catch {
        return res.status(200).json({ success: true, order: null });
    }
};
exports.getDriverActiveOrder = getDriverActiveOrder;
const getDriverEarnings = async (req, res) => {
    try {
        const driverRef = String(req.params.id);
        const driver = await findDriverRecord(driverRef);
        if (!driver) {
            return res.status(200).json({
                success: true,
                earnings: { today: 0, month: 0, totalTrips: 0, totalEarnings: 0 },
            });
        }
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completed = await prisma_1.prisma.order.findMany({
            where: { driverId: driver.id, status: 'COMPLETED' },
            select: { estimatedPrice: true, updatedAt: true },
        });
        const today = completed
            .filter((t) => t.updatedAt >= startOfDay)
            .reduce((sum, t) => sum + t.estimatedPrice, 0);
        const month = completed
            .filter((t) => t.updatedAt >= startOfMonth)
            .reduce((sum, t) => sum + t.estimatedPrice, 0);
        const totalEarnings = completed.reduce((sum, t) => sum + t.estimatedPrice, 0);
        return res.status(200).json({
            success: true,
            earnings: {
                today: Math.round(today),
                month: Math.round(month),
                totalTrips: completed.length,
                totalEarnings: Math.round(totalEarnings),
            },
        });
    }
    catch {
        return res.status(200).json({
            success: true,
            earnings: { today: 0, month: 0, totalTrips: 0, totalEarnings: 0 },
        });
    }
};
exports.getDriverEarnings = getDriverEarnings;
