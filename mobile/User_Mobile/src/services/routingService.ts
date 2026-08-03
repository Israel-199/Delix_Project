import { LocationPoint } from '../types';

export interface RouteResult {
  coordinates: Array<{ latitude: number; longitude: number }>;
  distanceKm: number;
  durationSeconds: number;
  durationLabel: string;
  arrivalTime: string;
  arrivalLabel: string;
  followsRoads: boolean;
}

const OSRM_ROUTE = 'https://router.project-osrm.org/route/v1/driving';
const OSRM_NEAREST = 'https://router.project-osrm.org/nearest/v1/driving';

const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
};

const formatArrivalTime = (seconds: number): string => {
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const toLatLng = (coords: Array<[number, number]>) =>
  coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

const snapToRoad = async (
  point: LocationPoint
): Promise<LocationPoint> => {
  try {
    const url = `${OSRM_NEAREST}/${point.longitude},${point.latitude}?number=1`;
    const response = await fetch(url);
    if (!response.ok) return point;

    const data = (await response.json()) as {
      code?: string;
      waypoints?: Array<{ location: [number, number] }>;
    };

    const location = data.waypoints?.[0]?.location;
    if (data.code !== 'Ok' || !location) return point;

    return {
      ...point,
      latitude: location[1],
      longitude: location[0],
    };
  } catch {
    return point;
  }
};

const requestOsrmRoute = async (
  from: LocationPoint,
  to: LocationPoint
): Promise<RouteResult | null> => {
  const url =
    `${OSRM_ROUTE}/${from.longitude},${from.latitude};` +
    `${to.longitude},${to.latitude}?overview=full&geometries=geojson&alternatives=true&steps=false`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  };

  if (data.code !== 'Ok' || !data.routes?.length) return null;

  const route = [...data.routes].sort((a, b) => a.duration - b.duration)[0];
  const rawCoords = route.geometry?.coordinates;
  if (!rawCoords?.length) return null;

  const durationSeconds = Math.round(route.duration);
  const arrivalTime = formatArrivalTime(durationSeconds);

  return {
    coordinates: toLatLng(rawCoords),
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    arrivalTime,
    arrivalLabel: `Arrive ${arrivalTime}`,
    followsRoads: true,
  };
};

/** Fetch shortest driving route that follows roads (OSRM). */
export const fetchDrivingRoute = async (
  from: LocationPoint,
  to: LocationPoint
): Promise<RouteResult> => {
  try {
    const direct = await requestOsrmRoute(from, to);
    if (direct) return direct;

    const snappedFrom = await snapToRoad(from);
    const snappedTo = await snapToRoad(to);
    const snapped = await requestOsrmRoute(snappedFrom, snappedTo);
    if (snapped) return snapped;
  } catch {
    // fall through to estimate
  }

  const latDiff = to.latitude - from.latitude;
  const lngDiff = to.longitude - from.longitude;
  const distanceKm =
    Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
  const durationSeconds = Math.max(60, Math.round((distanceKm / 25) * 3600));
  const arrivalTime = formatArrivalTime(durationSeconds);

  return {
    coordinates: [from, to],
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
    arrivalTime,
    arrivalLabel: `Arrive ${arrivalTime}`,
    followsRoads: false,
  };
};
