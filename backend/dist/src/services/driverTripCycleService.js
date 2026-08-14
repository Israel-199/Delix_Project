"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTripCycleMemory = exports.getTripCycleMemory = exports.recordTripCompleteMemory = exports.getTripCycleFromCount = exports.resolvePaymentStatus = exports.COMMISSION_AMOUNT_ETB = exports.TRIP_CYCLE_LENGTH = void 0;
exports.TRIP_CYCLE_LENGTH = 15;
exports.COMMISSION_AMOUNT_ETB = 500;
const resolvePaymentStatus = (cycle) => {
    const balance = cycle.commissionBalance ?? 0;
    // If they owe >= 500 ETB, mark as Due
    if (balance >= exports.COMMISSION_AMOUNT_ETB) {
        return 'Due';
    }
    return 'Paid';
};
exports.resolvePaymentStatus = resolvePaymentStatus;
const memoryTripCounts = new Map();
const memoryCommission = new Map();
const getTripCycleFromCount = (completedTrips) => {
    const inCycle = completedTrips % exports.TRIP_CYCLE_LENGTH;
    return {
        completedTrips: inCycle,
        tripsUntilRecharge: exports.TRIP_CYCLE_LENGTH - inCycle,
        cycleReset: false,
    };
};
exports.getTripCycleFromCount = getTripCycleFromCount;
const recordTripCompleteMemory = (driverRef, earnings = 0) => {
    const current = memoryTripCounts.get(driverRef) ?? 0;
    const next = current + 1;
    let cycleReset = false;
    let completedTrips = next;
    let commissionBalance = memoryCommission.get(driverRef) ?? 0;
    if (next >= exports.TRIP_CYCLE_LENGTH) {
        cycleReset = true;
        completedTrips = 0;
        // Apply exact flat fee of 500 rather than dynamically
        commissionBalance += exports.COMMISSION_AMOUNT_ETB;
        memoryTripCounts.set(driverRef, 0);
    }
    else {
        memoryTripCounts.set(driverRef, next);
    }
    memoryCommission.set(driverRef, commissionBalance);
    return {
        completedTrips,
        tripsUntilRecharge: exports.TRIP_CYCLE_LENGTH - completedTrips,
        cycleReset,
        commissionBalance,
        paymentStatus: (0, exports.resolvePaymentStatus)({ completedTrips, commissionBalance })
    };
};
exports.recordTripCompleteMemory = recordTripCompleteMemory;
const getTripCycleMemory = (driverRef) => {
    const completedTrips = memoryTripCounts.get(driverRef) ?? 0;
    return {
        ...(0, exports.getTripCycleFromCount)(completedTrips),
        commissionBalance: memoryCommission.get(driverRef) ?? 0,
    };
};
exports.getTripCycleMemory = getTripCycleMemory;
const resetTripCycleMemory = (driverRef) => {
    memoryTripCounts.set(driverRef, 0);
    memoryCommission.set(driverRef, 0);
    return (0, exports.getTripCycleMemory)(driverRef);
};
exports.resetTripCycleMemory = resetTripCycleMemory;
