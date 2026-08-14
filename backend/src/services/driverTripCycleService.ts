export const TRIP_CYCLE_LENGTH = 15;
export const COMMISSION_AMOUNT_ETB = 500;

export type PaymentStatus = 'Paid' | 'Due' | 'Processing';

export interface TripCycleResult {
  completedTrips: number;
  tripsUntilRecharge: number;
  cycleReset: boolean;
  commissionBalance?: number;
  paymentStatus?: PaymentStatus;
}

export const resolvePaymentStatus = (cycle: {
  completedTrips: number;
  commissionBalance?: number;
}): PaymentStatus => {
  const balance = cycle.commissionBalance ?? 0;
  // If they owe >= 500 ETB, mark as Due
  if (balance >= COMMISSION_AMOUNT_ETB) {
    return 'Due';
  }
  return 'Paid';
};

const memoryTripCounts = new Map<string, number>();
const memoryCommission = new Map<string, number>();

export const getTripCycleFromCount = (completedTrips: number): TripCycleResult => {
  const inCycle = completedTrips % TRIP_CYCLE_LENGTH;
  return {
    completedTrips: inCycle,
    tripsUntilRecharge: TRIP_CYCLE_LENGTH - inCycle,
    cycleReset: false,
  };
};

export const recordTripCompleteMemory = (driverRef: string, earnings = 0): TripCycleResult => {
  const current = memoryTripCounts.get(driverRef) ?? 0;
  const next = current + 1;
  let cycleReset = false;
  let completedTrips = next;
  let commissionBalance = memoryCommission.get(driverRef) ?? 0;

  if (next >= TRIP_CYCLE_LENGTH) {
    cycleReset = true;
    completedTrips = 0;
    // Apply exact flat fee of 500 rather than dynamically
    commissionBalance += COMMISSION_AMOUNT_ETB;
    memoryTripCounts.set(driverRef, 0);
  } else {
    memoryTripCounts.set(driverRef, next);
  }

  memoryCommission.set(driverRef, commissionBalance);

  return {
    completedTrips,
    tripsUntilRecharge: TRIP_CYCLE_LENGTH - completedTrips,
    cycleReset,
    commissionBalance,
    paymentStatus: resolvePaymentStatus({ completedTrips, commissionBalance })
  };
};

export const getTripCycleMemory = (driverRef: string): TripCycleResult => {
  const completedTrips = memoryTripCounts.get(driverRef) ?? 0;
  return {
    ...getTripCycleFromCount(completedTrips),
    commissionBalance: memoryCommission.get(driverRef) ?? 0,
  };
};

export const resetTripCycleMemory = (driverRef: string): TripCycleResult => {
  memoryTripCounts.set(driverRef, 0);
  memoryCommission.set(driverRef, 0);
  return getTripCycleMemory(driverRef);
};
