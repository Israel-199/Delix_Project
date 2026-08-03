import { findPresetCoordinate } from '../constants/locationCoords';
import { LocationPoint } from '../types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export const geocodeAddress = async (address: string): Promise<LocationPoint | null> => {
  const preset = findPresetCoordinate(address);
  if (preset) return preset;

  const trimmed = address.trim();
  if (!trimmed) return null;

  try {
    const params = new URLSearchParams({
      q: `${trimmed}, Addis Ababa, Ethiopia`,
      format: 'json',
      limit: '1',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': 'DelixUserApp/1.0' },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = results[0];
    if (!first) return null;

    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      address: first.display_name,
    };
  } catch {
    return null;
  }
};
