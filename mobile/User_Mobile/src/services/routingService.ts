import { LocationPoint } from '../types';

export interface RouteResult {
  coordinates: Array<{ latitude: number; longitude: number }>;
  distanceKm: number;
  durationSeconds: number;
  durationLabel: string;
  arrivalLabel: string;
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
};

const formatArrivalTime = (seconds: number): string => {
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

/** Straight-line fallback when OSRM is unavailable. */
const buildStraightRoute = (
  from: LocationPoint,
  to: LocationPoint
): RouteResult => {
  const latDiff = to.latitude - from.latitude;
  const lngDiff = to.longitude - from.longitude;
  const distanceKm =
    Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

  const durationSeconds = Math.max(60, Math.round((distanceKm / 30) * 3600));
  const steps = 24;
  const coordinates = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return {
      latitude: from.latitude + latDiff * t,
      longitude: from.longitude + lngDiff * t,
    };
  });

  return {
    coordinates,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    arrivalLabel: `Arrive ${formatArrivalTime(durationSeconds)}`,
  };
};

export const fetchDrivingRoute = async (
  from: LocationPoint,
  to: LocationPoint
): Promise<RouteResult> => {
  const url =
    `${OSRM_BASE}/${from.longitude},${from.latitude};` +
    `${to.longitude},${to.latitude}?overview=full&geometries=geojson&alternatives=false`;

  try {
    const response = await fetch(url);
    if (!response.ok) return buildStraightRoute(from, to);

    const data = (await response.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };

    const route = data.routes?.[0];
    const rawCoords = route?.geometry?.coordinates;
    if (!route || !rawCoords?.length) return buildStraightRoute(from, to);

    const coordinates = rawCoords.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    const durationSeconds = Math.round(route.duration);
    return {
      coordinates,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationSeconds,
      durationLabel: formatDuration(durationSeconds),
      arrivalLabel: `Arrive ${formatArrivalTime(durationSeconds)}`,
    };
  } catch {
    return buildStraightRoute(from, to);
  }
};
