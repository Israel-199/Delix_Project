import * as Location from 'expo-location';
import { DEFAULT_PICKUP_COORD } from '../constants/locationCoords';
import { LocationPoint } from '../types';

export const requestUserLocation = async (): Promise<LocationPoint | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      label: 'You',
    };
  } catch {
    return null;
  }
};

export const getDefaultUserLocation = (): LocationPoint => ({
  ...DEFAULT_PICKUP_COORD,
  label: 'You',
});
