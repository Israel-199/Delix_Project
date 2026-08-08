import * as Location from 'expo-location';
import { LocationPoint } from '../types';

/** Street-level zoom (~500 m view) — Yango-style detail on open. */
export const USER_DETAIL_ZOOM_DELTA = 0.005;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout')), ms)
    ),
  ]);

export const isValidCoordinate = (latitude: number, longitude: number): boolean =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180 &&
  !(latitude === 0 && longitude === 0);

const toLocationPoint = (position: Location.LocationObject): LocationPoint => ({
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  label: 'You',
  accuracy: position.coords.accuracy ?? undefined,
});

export const hasLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

export const requestUserLocation = async (): Promise<LocationPoint | null> => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return null;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 120_000,
      requiredAccuracy: 200,
    });

    if (lastKnown && isValidCoordinate(lastKnown.coords.latitude, lastKnown.coords.longitude)) {
      return toLocationPoint(lastKnown);
    }

    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        }),
        15_000
      );

      if (!isValidCoordinate(position.coords.latitude, position.coords.longitude)) {
        return null;
      }

      return toLocationPoint(position);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
};

export type LocationWatchCallback = (point: LocationPoint) => void;

/** Live GPS updates while the map screen is open. Returns cleanup fn. */
export const watchUserLocation = async (
  onUpdate: LocationWatchCallback
): Promise<() => void> => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return () => undefined;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return () => undefined;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1500,
        distanceInterval: 3,
      },
      (position) => {
        const { latitude, longitude } = position.coords;
        if (!isValidCoordinate(latitude, longitude)) return;
        onUpdate(toLocationPoint(position));
      }
    );

    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
};

export const regionAround = (
  point: { latitude: number; longitude: number },
  delta = USER_DETAIL_ZOOM_DELTA
) => ({
  latitude: point.latitude,
  longitude: point.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

/**
 * Street-level zoom centered exactly on the user's GPS coordinates.
 * Bottom sheet space is handled via MapView mapPadding, not camera offset.
 */
export const regionAroundUserDetail = (
  point: { latitude: number; longitude: number }
) => ({
  latitude: point.latitude,
  longitude: point.longitude,
  latitudeDelta: USER_DETAIL_ZOOM_DELTA,
  longitudeDelta: USER_DETAIL_ZOOM_DELTA,
});
