import { API_BASE_URL } from '../config/api';

export interface DriverCycleStats {
  completedTrips: number;
  tripsUntilRecharge: number;
  cycleLength: number;
  cycleReset?: boolean;
  commissionBalance?: number;
  paymentStatus?: 'Paid' | 'Due' | 'Processing';
}

export interface DriverTripRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  pickup: string;
  destination: string;
  cargoCategory: string;
  distanceKm: number;
  fare: number;
  paymentMethod: string;
  status: string;
  date: string;
}

export interface DriverEarningsSummary {
  today: number;
  month: number;
  totalTrips: number;
  totalEarnings: number;
}

export const fetchDriverCycle = async (driverId: string): Promise<DriverCycleStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/drivers/${encodeURIComponent(driverId)}/cycle`);
    if (!response.ok) throw new Error('Failed to load cycle');
    const data = (await response.json()) as DriverCycleStats & { success: boolean };
    return {
      completedTrips: data.completedTrips ?? 0,
      tripsUntilRecharge: data.tripsUntilRecharge ?? 10,
      cycleLength: data.cycleLength ?? 10,
      commissionBalance: data.commissionBalance,
      paymentStatus: data.paymentStatus,
    };
  } catch {
    return { completedTrips: 0, tripsUntilRecharge: 10, cycleLength: 10 };
  }
};

export const fetchDriverTrips = async (
  driverId: string,
  page = 1
): Promise<{ trips: DriverTripRecord[]; total: number; page: number }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/drivers/${encodeURIComponent(driverId)}/trips?page=${page}&limit=20`
    );
    if (!response.ok) throw new Error('Failed to load trips');
    const data = await response.json();
    return {
      trips: data.trips ?? [],
      total: data.total ?? 0,
      page: data.page ?? page,
    };
  } catch {
    return { trips: [], total: 0, page: 1 };
  }
};

export const fetchDriverEarnings = async (driverId: string): Promise<DriverEarningsSummary> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/drivers/${encodeURIComponent(driverId)}/earnings`
    );
    if (!response.ok) throw new Error('Failed to load earnings');
    const data = await response.json();
    return data.earnings ?? { today: 0, month: 0, totalTrips: 0, totalEarnings: 0 };
  } catch {
    return { today: 0, month: 0, totalTrips: 0, totalEarnings: 0 };
  }
};

export const fetchDriverActiveOrder = async (
  driverId: string
): Promise<Record<string, unknown> | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/drivers/${encodeURIComponent(driverId)}/active-order`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.order ?? null;
  } catch {
    return null;
  }
};

export const completeDriverTrip = async (
  driverId: string,
  payload: { orderId?: string; earnings?: number }
): Promise<DriverCycleStats & { message?: string; cycleReset?: boolean }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/drivers/${encodeURIComponent(driverId)}/complete-trip`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? 'Could not complete trip');
  }

  return data as DriverCycleStats & { message?: string; cycleReset?: boolean };
};
