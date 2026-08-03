import { LocationPoint } from '../types';

/** Known Addis Ababa coordinates for search presets and geocoding fallback. */
export const LOCATION_COORD_PRESETS: Record<string, LocationPoint> = {
  'bl-03-505': { latitude: 9.0205, longitude: 38.7469, address: 'BL-03-505 Street, Bole' },
  bole: { latitude: 9.0205, longitude: 38.7469, address: 'Bole, Addis Ababa' },
  gerji: { latitude: 8.9934, longitude: 38.7891, address: 'Gerji Mebrat Hail, Addis Ababa' },
  golagul: { latitude: 9.0128, longitude: 38.7612, address: 'Golagul Building, Addis Ababa' },
  aleph: { latitude: 9.0189, longitude: 38.7845, address: 'Aleph Hotel Bole, Addis Ababa' },
};

export const DEFAULT_PICKUP_COORD: LocationPoint = LOCATION_COORD_PRESETS['bl-03-505'];

export const findPresetCoordinate = (query: string): LocationPoint | null => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  for (const [key, point] of Object.entries(LOCATION_COORD_PRESETS)) {
    if (
      normalized.includes(key) ||
      point.address?.toLowerCase().includes(normalized) ||
      normalized.includes(point.address?.toLowerCase() ?? '')
    ) {
      return point;
    }
  }

  if (normalized.includes('gerji')) return LOCATION_COORD_PRESETS.gerji;
  if (normalized.includes('golagul')) return LOCATION_COORD_PRESETS.golagul;
  if (normalized.includes('aleph')) return LOCATION_COORD_PRESETS.aleph;

  return null;
};
