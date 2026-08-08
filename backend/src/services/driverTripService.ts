import { prisma } from '../lib/prisma';
import {
  TRIP_CYCLE_LENGTH,
  TripCycleResult,
  getTripCycleMemory,
  recordTripCompleteMemory,
} from './driverTripCycleService';

export { TRIP_CYCLE_LENGTH };
export type { TripCycleResult };

const findDriver = async (driverRef: string) => {
  return prisma.driver.findFirst({
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

export const getDriverTripCycle = async (driverRef: string): Promise<TripCycleResult> => {
  try {
    const driver = await findDriver(driverRef);
    if (driver) {
      const completedTrips = driver.completedTrips % TRIP_CYCLE_LENGTH;
      return {
        completedTrips,
        tripsUntilRecharge: TRIP_CYCLE_LENGTH - completedTrips,
        cycleReset: false,
        commissionBalance: driver.commissionBalance,
      };
    }
  } catch {
    // fall through to memory store
  }

  return getTripCycleMemory(driverRef);
};

export const recordDriverTripComplete = async (
  driverRef: string,
  earnings = 0
): Promise<TripCycleResult> => {
  try {
    const driver = await findDriver(driverRef);
    if (driver) {
      const nextCount = driver.completedTrips + 1;
      const cycleReset = nextCount >= TRIP_CYCLE_LENGTH;
      const completedTrips = cycleReset ? 0 : nextCount;
      const commissionBalance = driver.commissionBalance + earnings;

      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          completedTrips,
          commissionBalance,
          status: 'ACTIVE',
        },
      });

      return {
        completedTrips,
        tripsUntilRecharge: TRIP_CYCLE_LENGTH - completedTrips,
        cycleReset,
        commissionBalance,
      };
    }
  } catch {
    // fall through
  }

  return recordTripCompleteMemory(driverRef, earnings);
};
