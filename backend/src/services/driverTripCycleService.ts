export const TRIP_CYCLE_LENGTH = 10;

export interface TripCycleResult {
  completedTrips: number;
  tripsUntilRecharge: number;
  cycleReset: boolean;
  commissionBalance?: number;
}

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
    commissionBalance += earnings;
    memoryTripCounts.set(driverRef, 0);
  } else {
    memoryTripCounts.set(driverRef, next);
    if (earnings > 0) {
      commissionBalance += earnings;
    }
  }

  memoryCommission.set(driverRef, commissionBalance);

  return {
    completedTrips,
    tripsUntilRecharge: TRIP_CYCLE_LENGTH - completedTrips,
    cycleReset,
    commissionBalance,
  };
};

export const getTripCycleMemory = (driverRef: string): TripCycleResult => {
  const completedTrips = memoryTripCounts.get(driverRef) ?? 0;
  return {
    ...getTripCycleFromCount(completedTrips),
    commissionBalance: memoryCommission.get(driverRef) ?? 0,
  };
};
