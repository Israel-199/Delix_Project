import apiClient from './apiClient';
import { geocodeAddress } from './geocodingService';
import { NearbyDriver, VehicleCategoryId } from '../types';
import { vehicleCategoryFromBackend } from '../utils/driverTracking';
import { VEHICLE_TO_BACKEND } from '../utils/mappers';

export interface LocationSearchResult {
  id: string;
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
}

export const searchLocationsApi = async (query: string): Promise<LocationSearchResult[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const response = await apiClient.get<{ success: boolean; results: LocationSearchResult[] }>(
      `/locations/search?q=${encodeURIComponent(q)}`
    );
    return response.results ?? [];
  } catch {
    const point = await geocodeAddress(q);
    if (!point) return [];
    return [
      {
        id: 'local-0',
        title: point.address?.split(',')[0] ?? q,
        subtitle: point.address ?? q,
        latitude: point.latitude,
        longitude: point.longitude,
      },
    ];
  }
};

export const fetchRecentLocations = async (userId = 'guest'): Promise<LocationSearchResult[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; locations: LocationSearchResult[] }>(
      `/locations/recent?userId=${encodeURIComponent(userId)}`
    );
    return response.locations ?? [];
  } catch {
    return [];
  }
};

export const saveRecentLocationApi = async (payload: {
  userId?: string;
  placeName: string;
  address?: string;
  latitude: number;
  longitude: number;
}) => {
  try {
    await apiClient.post('/locations/recent', {
      userId: payload.userId ?? 'guest',
      placeName: payload.placeName,
      address: payload.address ?? payload.placeName,
      latitude: payload.latitude,
      longitude: payload.longitude,
    });
  } catch {
    // Non-blocking — recent list is a convenience feature
  }
};

export const fetchNearbyRecommendations = async (
  lat: number,
  lng: number
): Promise<LocationSearchResult[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; results: LocationSearchResult[] }>(
      `/locations/nearby?lat=${lat}&lng=${lng}`
    );
    return response.results ?? [];
  } catch {
    return [];
  }
};

export const fetchNearbyDrivers = async (
  lat: number,
  lng: number,
  vehicleCategoryId?: VehicleCategoryId
): Promise<NearbyDriver[]> => {
  try {
    const vehicleType = vehicleCategoryId ? VEHICLE_TO_BACKEND[vehicleCategoryId] : undefined;
    const query = vehicleType
      ? `?lat=${lat}&lng=${lng}&vehicleType=${encodeURIComponent(vehicleType)}`
      : `?lat=${lat}&lng=${lng}`;

    const response = await apiClient.get<{
      success: boolean;
      drivers: Array<{
        id: string;
        coordinate: { latitude: number; longitude: number };
        vehicleType: string;
        distanceKm?: number;
      }>;
    }>(`/drivers/nearby${query}`);

    return (response.drivers ?? []).map((driver) => ({
      id: driver.id,
      coordinate: driver.coordinate,
      vehicleCategory: vehicleCategoryFromBackend(driver.vehicleType),
      etaMinutes: Math.max(1, Math.round((driver.distanceKm ?? 1) * 3)),
    }));
  } catch {
    return [];
  }
};
