import { VehicleCategoryId } from '../types';

const BACKEND_VEHICLE_MAP: Record<string, VehicleCategoryId> = {
  LADA_BED: 'lada',
  PICKUP_TRUCK: 'pickup',
  MINI_TRUCK: 'mini_truck',
  LARGE_TRUCK: 'large_truck',
};

export const vehicleCategoryFromBackend = (value?: string): VehicleCategoryId => {
  if (!value) return 'pickup';
  const upper = value.toUpperCase();
  return BACKEND_VEHICLE_MAP[upper] ?? 'pickup';
};

export interface LiveDriverPayload {
  driverId: string;
  lat: number;
  lng: number;
  vehicleType?: string;
}
