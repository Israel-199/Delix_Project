import { LocationPoint } from '../types';

/** Fallback when GPS is unavailable — Bole, Addis Ababa. */
export const DEFAULT_PICKUP_COORD: LocationPoint = {
  latitude: 9.0205,
  longitude: 38.7469,
  address: 'Bole, Addis Ababa',
};

/** Addis Ababa bounding box for geocoding bias. */
export const ADDIS_VIEWBOX = {
  minLng: 38.65,
  minLat: 8.85,
  maxLng: 38.95,
  maxLat: 9.15,
};

export const isInAddisAbaba = (lat: number, lng: number): boolean =>
  lat >= ADDIS_VIEWBOX.minLat &&
  lat <= ADDIS_VIEWBOX.maxLat &&
  lng >= ADDIS_VIEWBOX.minLng &&
  lng <= ADDIS_VIEWBOX.maxLng;
