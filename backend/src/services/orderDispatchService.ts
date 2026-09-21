import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../lib/prisma';
import { findNearbyDrivers, markDriverUnavailable } from './driverLocationStore';
import { driverRoom } from './driverSocketRegistry';
import { notifyDriver } from './driverNotificationService';

const OFFER_TIMEOUT_MS = 45_000;
const SEARCH_RADIUS_KM = 20;

export interface DispatchOrderPayload {
  orderId?: string;
  id?: string;
  vehicleRequested?: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupAddress?: string;
  destinationAddress?: string;
  estimatedPrice?: number;
  currency?: string;
  distanceKm?: number;
  cargoCategory?: string;
  paymentMethod?: string;
  customerPhone?: string;
  customerName?: string;
  [key: string]: unknown;
}

interface DispatchState {
  orderId: string;
  orderData: DispatchOrderPayload;
  pickupLat: number;
  pickupLng: number;
  vehicleType: string;
  rejectedDriverIds: Set<string>;
  currentDriverId?: string;
  timeout?: ReturnType<typeof setTimeout>;
  status: 'searching' | 'assigned' | 'exhausted';
}

const activeDispatches = new Map<string, DispatchState>();

const resolveDriverRecord = async (driverRef: string) => {
  try {
    return await prisma.driver.findFirst({
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
  } catch {
    return null;
  }
};

const normalizeVehicle = (value?: string) => String(value ?? '').toUpperCase().trim();

const getOrderId = (payload: DispatchOrderPayload) =>
  String(payload.orderId ?? payload.id ?? '').trim();

export const getEligibleNearbyDrivers = async (
  pickupLat: number,
  pickupLng: number,
  vehicleType: string,
  rejectedDriverIds: Set<string>
) => {
  const normalizedVehicle = normalizeVehicle(vehicleType);
  const nearby = findNearbyDrivers(pickupLat, pickupLng, normalizedVehicle, SEARCH_RADIUS_KM);

  const eligible: Array<{
    driverId: string;
    distanceKm: number;
    plateNumber?: string;
    name?: string;
    vehicleType: string;
  }> = [];

  for (const candidate of nearby) {
    const record = await resolveDriverRecord(candidate.driverId);
    if (!record) continue;
    if (record.status !== 'ACTIVE') continue;
    if (normalizeVehicle(record.vehicleType) !== normalizedVehicle) continue;

    const canonicalId = record.id;
    if (rejectedDriverIds.has(canonicalId)) continue;
    if (rejectedDriverIds.has(candidate.driverId)) continue;

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

const clearOfferTimeout = (state: DispatchState) => {
  if (state.timeout) {
    clearTimeout(state.timeout);
    state.timeout = undefined;
  }
};

const emitToOrder = (io: SocketIOServer, orderId: string, event: string, payload: unknown) => {
  io.to(`order:${orderId}`).emit(event, payload);
};

const cancelCurrentOffer = (io: SocketIOServer, state: DispatchState) => {
  if (!state.currentDriverId) return;

  io.to(driverRoom(state.currentDriverId)).emit('dispatch_offer_cancelled', {
    orderId: state.orderId,
    reason: 'reassigned',
  });

  state.currentDriverId = undefined;
  clearOfferTimeout(state);
};

export const offerToNextDriver = async (io: SocketIOServer, orderId: string) => {
  const state = activeDispatches.get(orderId);
  if (!state || state.status !== 'searching') return;

  cancelCurrentOffer(io, state);

  const candidates = await getEligibleNearbyDrivers(
    state.pickupLat,
    state.pickupLng,
    state.vehicleType,
    state.rejectedDriverIds
  );

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
  markDriverUnavailable(next.driverId);

  const photoUrl =
    (state.orderData.customerPhoto as string) ||
    (state.orderData.customerAvatar as string) ||
    (state.orderData.customerProfilePhoto as string);

  const alertPayload = {
    ...state.orderData,
    orderId: state.orderId,
    vehicleRequested: state.vehicleType,
    dispatchTargetDriverId: next.driverId,
    distanceKm: next.distanceKm,
    customerPhoto: photoUrl,
    customerAvatar: photoUrl,
    offerExpiresInSec: OFFER_TIMEOUT_MS / 1000,
  };

  io.to(driverRoom(next.driverId)).emit('incoming_delivery_alert', alertPayload);
  io.to(driverRoom(next.driverId)).emit('dispatch_incoming_order', alertPayload);

  void notifyDriver(
    next.driverId,
    'NEW_TRIP_REQUEST',
    'New trip request',
    `Delivery request ${next.distanceKm} km away — respond within ${OFFER_TIMEOUT_MS / 1000}s.`,
    state.orderId,
    io
  );

  console.log(
    `[Dispatch] Offered order ${orderId} to driver ${next.driverId} (${next.distanceKm} km away)`.cyan
  );

  emitToOrder(io, orderId, 'dispatch_progress', {
    orderId,
    status: 'OFFERED',
    candidateIndex: state.rejectedDriverIds.size + 1,
    driversRemaining: candidates.length,
  });

  state.timeout = setTimeout(() => {
    console.log(`[Dispatch] Offer timeout for driver ${next.driverId} on order ${orderId}`.yellow);
    handleDriverReject(io, orderId, next.driverId, true);
  }, OFFER_TIMEOUT_MS);
};

export const startOrderDispatch = async (io: SocketIOServer, orderData: DispatchOrderPayload) => {
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
    clearOfferTimeout(activeDispatches.get(orderId)!);
    activeDispatches.delete(orderId);
  }

  let customerPhoto = (orderData.customerPhoto || orderData.customerAvatar || orderData.customerProfilePhoto) as string | undefined;

  if (!customerPhoto && orderData.customerId) {
    try {
      const customerUser = await prisma.user.findFirst({
        where: { OR: [{ id: String(orderData.customerId) }, { phone: String(orderData.customerPhone || orderData.customerId) }] },
        select: { profilePhotoUrl: true },
      });
      if (customerUser?.profilePhotoUrl) {
        customerPhoto = customerUser.profilePhotoUrl;
      }
    } catch {
      // Non-blocking
    }
  }

  const state: DispatchState = {
    orderId,
    orderData: {
      ...orderData,
      orderId,
      customerPhoto,
      customerAvatar: customerPhoto,
    },
    pickupLat,
    pickupLng,
    vehicleType,
    rejectedDriverIds: new Set(),
    status: 'searching',
  };

  activeDispatches.set(orderId, state);

  console.log(
    `[Dispatch] Starting nearest-driver dispatch for ${orderId} · vehicle=${vehicleType}`.green
  );

  await offerToNextDriver(io, orderId);
};

export const handleDriverReject = async (
  io: SocketIOServer,
  orderId: string,
  driverId: string,
  timedOut = false
) => {
  const state = activeDispatches.get(orderId);
  if (!state || state.status !== 'searching') return;

  const record = await resolveDriverRecord(driverId);
  const canonicalId = record?.id ?? driverId;

  if (state.currentDriverId && state.currentDriverId !== canonicalId) {
    return;
  }

  state.rejectedDriverIds.add(canonicalId);
  clearOfferTimeout(state);
  state.currentDriverId = undefined;

  io.to(driverRoom(canonicalId)).emit('dispatch_offer_cancelled', {
    orderId,
    reason: timedOut ? 'timeout' : 'rejected',
  });

  emitToOrder(io, orderId, 'order_status_changed', {
    orderId,
    status: 'SEARCHING_DRIVER',
  });

  await offerToNextDriver(io, orderId);
};

export const handleDriverAccept = (io: SocketIOServer, orderId: string, driverId: string) => {
  const state = activeDispatches.get(orderId);
  if (!state) return;

  clearOfferTimeout(state);
  state.status = 'assigned';
  state.currentDriverId = undefined;
  activeDispatches.delete(orderId);

  io.to('drivers_online').emit('order_assigned_elsewhere', {
    orderId,
    assignedDriverId: driverId,
  });
};

export const isCurrentOfferTarget = (orderId: string, driverId: string) => {
  const state = activeDispatches.get(orderId);
  if (!state || state.status !== 'searching') return true;
  return !state.currentDriverId || state.currentDriverId === driverId;
};

export const isDispatchAssigned = (orderId: string) => {
  const state = activeDispatches.get(orderId);
  return !state || state.status === 'assigned';
};
