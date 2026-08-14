"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDispatchAssigned = exports.isCurrentOfferTarget = exports.handleDriverAccept = exports.handleDriverReject = exports.startOrderDispatch = exports.offerToNextDriver = exports.getEligibleNearbyDrivers = void 0;
const prisma_1 = require("../lib/prisma");
const driverLocationStore_1 = require("./driverLocationStore");
const driverSocketRegistry_1 = require("./driverSocketRegistry");
const driverNotificationService_1 = require("./driverNotificationService");
const OFFER_TIMEOUT_MS = 45_000;
const SEARCH_RADIUS_KM = 20;
const activeDispatches = new Map();
const resolveDriverRecord = async (driverRef) => {
    try {
        return await prisma_1.prisma.driver.findFirst({
            where: {
                OR: [
                    { id: driverRef },
                    { plateNumber: driverRef },
                    { licenseNumber: driverRef },
                    { user: { phone: driverRef } },
                ],
            },
            include: {
                user: { select: { phone: true, firstName: true, lastName: true } },
            },
        });
    }
    catch {
        return null;
    }
};
const normalizeVehicle = (value) => String(value ?? '').toUpperCase().trim();
const getOrderId = (payload) => String(payload.orderId ?? payload.id ?? '').trim();
const getEligibleNearbyDrivers = async (pickupLat, pickupLng, vehicleType, rejectedDriverIds) => {
    const normalizedVehicle = normalizeVehicle(vehicleType);
    const nearby = (0, driverLocationStore_1.findNearbyDrivers)(pickupLat, pickupLng, normalizedVehicle, SEARCH_RADIUS_KM);
    const eligible = [];
    for (const candidate of nearby) {
        const record = await resolveDriverRecord(candidate.driverId);
        if (!record)
            continue;
        if (record.status !== 'ACTIVE')
            continue;
        if (normalizeVehicle(record.vehicleType) !== normalizedVehicle)
            continue;
        const canonicalId = record.id;
        if (rejectedDriverIds.has(canonicalId))
            continue;
        if (rejectedDriverIds.has(candidate.driverId))
            continue;
        eligible.push({
            driverId: canonicalId,
            distanceKm: candidate.distanceKm,
            plateNumber: record.plateNumber,
            name: [record.user.firstName, record.user.lastName].filter(Boolean).join(' ') || record.plateNumber,
            vehicleType: record.vehicleType,
        });
    }
    return eligible;
};
exports.getEligibleNearbyDrivers = getEligibleNearbyDrivers;
const clearOfferTimeout = (state) => {
    if (state.timeout) {
        clearTimeout(state.timeout);
        state.timeout = undefined;
    }
};
const emitToOrder = (io, orderId, event, payload) => {
    io.to(`order:${orderId}`).emit(event, payload);
};
const cancelCurrentOffer = (io, state) => {
    if (!state.currentDriverId)
        return;
    io.to((0, driverSocketRegistry_1.driverRoom)(state.currentDriverId)).emit('dispatch_offer_cancelled', {
        orderId: state.orderId,
        reason: 'reassigned',
    });
    state.currentDriverId = undefined;
    clearOfferTimeout(state);
};
const offerToNextDriver = async (io, orderId) => {
    const state = activeDispatches.get(orderId);
    if (!state || state.status !== 'searching')
        return;
    cancelCurrentOffer(io, state);
    const candidates = await (0, exports.getEligibleNearbyDrivers)(state.pickupLat, state.pickupLng, state.vehicleType, state.rejectedDriverIds);
    if (candidates.length === 0) {
        state.status = 'exhausted';
        activeDispatches.delete(orderId);
        emitToOrder(io, orderId, 'order_status_changed', {
            orderId,
            status: 'NO_DRIVERS_AVAILABLE',
        });
        console.log(`[Dispatch] No eligible drivers left for order ${orderId}`.yellow);
        return;
    }
    const next = candidates[0];
    state.currentDriverId = next.driverId;
    (0, driverLocationStore_1.markDriverUnavailable)(next.driverId);
    const alertPayload = {
        ...state.orderData,
        orderId: state.orderId,
        vehicleRequested: state.vehicleType,
        dispatchTargetDriverId: next.driverId,
        distanceKm: next.distanceKm,
        offerExpiresInSec: OFFER_TIMEOUT_MS / 1000,
    };
    io.to((0, driverSocketRegistry_1.driverRoom)(next.driverId)).emit('incoming_delivery_alert', alertPayload);
    void (0, driverNotificationService_1.notifyDriver)(next.driverId, 'NEW_TRIP_REQUEST', 'New trip request', `Delivery request ${next.distanceKm} km away — respond within ${OFFER_TIMEOUT_MS / 1000}s.`, state.orderId, io);
    console.log(`[Dispatch] Offered order ${orderId} to driver ${next.driverId} (${next.distanceKm} km away)`.cyan);
    emitToOrder(io, orderId, 'dispatch_progress', {
        orderId,
        status: 'OFFERED',
        candidateIndex: state.rejectedDriverIds.size + 1,
        driversRemaining: candidates.length,
    });
    state.timeout = setTimeout(() => {
        console.log(`[Dispatch] Offer timeout for driver ${next.driverId} on order ${orderId}`.yellow);
        (0, exports.handleDriverReject)(io, orderId, next.driverId, true);
    }, OFFER_TIMEOUT_MS);
};
exports.offerToNextDriver = offerToNextDriver;
const startOrderDispatch = async (io, orderData) => {
    const orderId = getOrderId(orderData);
    if (!orderId) {
        console.warn('[Dispatch] Missing orderId in dispatch payload');
        return;
    }
    const pickupLat = Number(orderData.pickupLat);
    const pickupLng = Number(orderData.pickupLng);
    const vehicleType = normalizeVehicle(orderData.vehicleRequested);
    if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng) || !vehicleType) {
        console.warn('[Dispatch] Invalid pickup coords or vehicle type', orderData);
        return;
    }
    if (activeDispatches.has(orderId)) {
        clearOfferTimeout(activeDispatches.get(orderId));
        activeDispatches.delete(orderId);
    }
    const state = {
        orderId,
        orderData: { ...orderData, orderId },
        pickupLat,
        pickupLng,
        vehicleType,
        rejectedDriverIds: new Set(),
        status: 'searching',
    };
    activeDispatches.set(orderId, state);
    console.log(`[Dispatch] Starting nearest-driver dispatch for ${orderId} · vehicle=${vehicleType}`.green);
    await (0, exports.offerToNextDriver)(io, orderId);
};
exports.startOrderDispatch = startOrderDispatch;
const handleDriverReject = async (io, orderId, driverId, timedOut = false) => {
    const state = activeDispatches.get(orderId);
    if (!state || state.status !== 'searching')
        return;
    const record = await resolveDriverRecord(driverId);
    const canonicalId = record?.id ?? driverId;
    if (state.currentDriverId && state.currentDriverId !== canonicalId) {
        return;
    }
    state.rejectedDriverIds.add(canonicalId);
    clearOfferTimeout(state);
    state.currentDriverId = undefined;
    io.to((0, driverSocketRegistry_1.driverRoom)(canonicalId)).emit('dispatch_offer_cancelled', {
        orderId,
        reason: timedOut ? 'timeout' : 'rejected',
    });
    emitToOrder(io, orderId, 'order_status_changed', {
        orderId,
        status: 'SEARCHING_DRIVER',
    });
    await (0, exports.offerToNextDriver)(io, orderId);
};
exports.handleDriverReject = handleDriverReject;
const handleDriverAccept = (io, orderId, driverId) => {
    const state = activeDispatches.get(orderId);
    if (!state)
        return;
    clearOfferTimeout(state);
    state.status = 'assigned';
    state.currentDriverId = undefined;
    activeDispatches.delete(orderId);
    io.to('drivers_online').emit('order_assigned_elsewhere', {
        orderId,
        assignedDriverId: driverId,
    });
};
exports.handleDriverAccept = handleDriverAccept;
const isCurrentOfferTarget = (orderId, driverId) => {
    const state = activeDispatches.get(orderId);
    if (!state || state.status !== 'searching')
        return true;
    return !state.currentDriverId || state.currentDriverId === driverId;
};
exports.isCurrentOfferTarget = isCurrentOfferTarget;
const isDispatchAssigned = (orderId) => {
    const state = activeDispatches.get(orderId);
    return !state || state.status === 'assigned';
};
exports.isDispatchAssigned = isDispatchAssigned;
