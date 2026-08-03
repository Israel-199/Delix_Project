import { findRecentLocation } from '../constants/locations';
import { ADDIS_VIEWBOX, isInAddisAbaba } from '../constants/locationCoords';
import { LocationPoint } from '../types';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const NOMINATIM_HEADERS = { 'User-Agent': 'DelixUserApp/1.0 (mobile)' };

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      zoom: '18',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_REVERSE}?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      display_name?: string;
      address?: {
        road?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
      };
    };

    const road = data.address?.road;
    const area = data.address?.neighbourhood ?? data.address?.suburb;
    if (road && area) return `${road}, ${area}`;
    if (road) return road;
    return data.display_name?.split(',').slice(0, 2).join(',').trim() ?? null;
  } catch {
    return null;
  }
};

export const geocodeAddress = async (address: string): Promise<LocationPoint | null> => {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const recent = findRecentLocation(trimmed);
  if (recent) {
    return {
      latitude: recent.latitude,
      longitude: recent.longitude,
      address: recent.title,
    };
  }

  try {
    const params = new URLSearchParams({
      q: `${trimmed}, Addis Ababa, Ethiopia`,
      format: 'json',
      limit: '5',
      countrycodes: 'et',
      viewbox: `${ADDIS_VIEWBOX.minLng},${ADDIS_VIEWBOX.maxLat},${ADDIS_VIEWBOX.maxLng},${ADDIS_VIEWBOX.minLat}`,
      bounded: '1',
    });

    const response = await fetch(`${NOMINATIM_SEARCH}?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
    });

    if (!response.ok) return null;

    const results = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      importance?: number;
    }>;

    const inCity =
      results.find((r) => isInAddisAbaba(parseFloat(r.lat), parseFloat(r.lon))) ?? results[0];

    if (!inCity) return null;

    return {
      latitude: parseFloat(inCity.lat),
      longitude: parseFloat(inCity.lon),
      address: inCity.display_name,
    };
  } catch {
    return null;
  }
};

export const resolveDestination = async (
  destinationName: string,
  stored: LocationPoint | null
): Promise<LocationPoint | null> => {
  if (stored?.latitude && stored?.longitude) {
    return stored;
  }
  return geocodeAddress(destinationName);
};
