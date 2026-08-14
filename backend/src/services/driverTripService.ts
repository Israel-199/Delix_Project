import { prisma } from '../lib/prisma';
import {
  TRIP_CYCLE_LENGTH,
  TripCycleResult,
  resolvePaymentStatus,
  getTripCycleMemory,
  recordTripCompleteMemory,
  resetTripCycleMemory,
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
      const result = {
        completedTrips,
        tripsUntilRecharge: TRIP_CYCLE_LENGTH - completedTrips,
        cycleReset: false,
        commissionBalance: driver.commissionBalance,
      };
      return { ...result, paymentStatus: resolvePaymentStatus(result) };
    }
  } catch {
    // fall through to memory store
  }

  const memory = getTripCycleMemory(driverRef);
  return { ...memory, paymentStatus: resolvePaymentStatus(memory) };
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
      const commissionBalance = cycleReset 
        ? driver.commissionBalance + 500 // COMMISSION_AMOUNT_ETB
        : driver.commissionBalance;

      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          completedTrips,
          commissionBalance,
          status: 'ACTIVE',
        },
      });

      const result = {
        completedTrips,
        tripsUntilRecharge: TRIP_CYCLE_LENGTH - completedTrips,
        cycleReset,
        commissionBalance,
      };
      return { ...result, paymentStatus: resolvePaymentStatus(result) };
    }
  } catch {
    // fall through
  }

  const memory = recordTripCompleteMemory(driverRef, earnings);
  return { ...memory, paymentStatus: resolvePaymentStatus(memory) };
};

export const resetDriverTripCycle = async (driverRef: string): Promise<TripCycleResult> => {
  try {
    const driver = await findDriver(driverRef);
    if (driver) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          completedTrips: 0,
          commissionBalance: 0,
        },
      });

      const result = {
        completedTrips: 0,
        tripsUntilRecharge: TRIP_CYCLE_LENGTH,
        cycleReset: false,
        commissionBalance: 0,
      };
      return { ...result, paymentStatus: resolvePaymentStatus(result) };
    }
  } catch {
    // fall through
  }

  const memory = resetTripCycleMemory(driverRef);
  return { ...memory, paymentStatus: resolvePaymentStatus(memory) };
};
