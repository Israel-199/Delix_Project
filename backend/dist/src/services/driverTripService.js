"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDriverTripCycle = exports.recordDriverTripComplete = exports.getDriverTripCycle = exports.TRIP_CYCLE_LENGTH = void 0;
const prisma_1 = require("../lib/prisma");
const driverTripCycleService_1 = require("./driverTripCycleService");
Object.defineProperty(exports, "TRIP_CYCLE_LENGTH", { enumerable: true, get: function () { return driverTripCycleService_1.TRIP_CYCLE_LENGTH; } });
const findDriver = async (driverRef) => {
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
const getDriverTripCycle = async (driverRef) => {
    try {
        const driver = await findDriver(driverRef);
        if (driver) {
            const completedTrips = driver.completedTrips % driverTripCycleService_1.TRIP_CYCLE_LENGTH;
            const result = {
                completedTrips,
                tripsUntilRecharge: driverTripCycleService_1.TRIP_CYCLE_LENGTH - completedTrips,
                cycleReset: false,
                commissionBalance: driver.commissionBalance,
            };
            return { ...result, paymentStatus: (0, driverTripCycleService_1.resolvePaymentStatus)(result) };
        }
    }
    catch {
        // fall through to memory store
    }
    const memory = (0, driverTripCycleService_1.getTripCycleMemory)(driverRef);
    return { ...memory, paymentStatus: (0, driverTripCycleService_1.resolvePaymentStatus)(memory) };
};
exports.getDriverTripCycle = getDriverTripCycle;
const recordDriverTripComplete = async (driverRef, earnings = 0) => {
    try {
        const driver = await findDriver(driverRef);
        if (driver) {
            const nextCount = driver.completedTrips + 1;
            const cycleReset = nextCount >= driverTripCycleService_1.TRIP_CYCLE_LENGTH;
            const completedTrips = cycleReset ? 0 : nextCount;
            const commissionBalance = cycleReset
                ? driver.commissionBalance + 500 // COMMISSION_AMOUNT_ETB
                : driver.commissionBalance;
            await prisma_1.prisma.driver.update({
                where: { id: driver.id },
                data: {
                    completedTrips,
                    commissionBalance,
                    status: 'ACTIVE',
                },
            });
            const result = {
                completedTrips,
                tripsUntilRecharge: driverTripCycleService_1.TRIP_CYCLE_LENGTH - completedTrips,
                cycleReset,
                commissionBalance,
            };
            return { ...result, paymentStatus: (0, driverTripCycleService_1.resolvePaymentStatus)(result) };
        }
    }
    catch {
        // fall through
    }
    const memory = (0, driverTripCycleService_1.recordTripCompleteMemory)(driverRef, earnings);
    return { ...memory, paymentStatus: (0, driverTripCycleService_1.resolvePaymentStatus)(memory) };
};
exports.recordDriverTripComplete = recordDriverTripComplete;
const resetDriverTripCycle = async (driverRef) => {
    try {
        const driver = await findDriver(driverRef);
        if (driver) {
            await prisma_1.prisma.driver.update({
                where: { id: driver.id },
                data: {
                    completedTrips: 0,
                    commissionBalance: 0,
                },
            });
            const result = {
                completedTrips: 0,
                tripsUntilRecharge: driverTripCycleService_1.TRIP_CYCLE_LENGTH,
                cycleReset: false,
                commissionBalance: 0,
            };
            return { ...result, paymentStatus: (0, driverTripCycleService_1.resolvePaymentStatus)(result) };
        }
    }
    catch {
        // fall through
    }
    const memory = (0, driverTripCycleService_1.resetTripCycleMemory)(driverRef);
    return { ...memory, paymentStatus: (0, driverTripCycleService_1.resolvePaymentStatus)(memory) };
};
exports.resetDriverTripCycle = resetDriverTripCycle;
