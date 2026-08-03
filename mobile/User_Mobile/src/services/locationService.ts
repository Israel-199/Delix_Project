import * as Location from 'expo-location';
import { LocationPoint } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout')), ms)
    ),
  ]);

export const requestUserLocation = async (): Promise<LocationPoint | null> => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return null;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 60_000,
      requiredAccuracy: 120,
    });

    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
        20_000
      );

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: 'You',
        accuracy: position.coords.accuracy ?? undefined,
      };
    } catch {
      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          label: 'You',
          accuracy: lastKnown.coords.accuracy ?? undefined,
        };
      }
      return null;
    }
  } catch {
    return null;
  }
};
