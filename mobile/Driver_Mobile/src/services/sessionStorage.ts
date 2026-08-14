import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@delix/driver_session';

export interface DriverSession {
  phone: string;
  token: string;
  driverId: string;
  plateNumber: string;
  vehicleType: string;
  name: string;
  needsRegistration: boolean;
}

export const driverSessionStorage = {
  get: async (): Promise<DriverSession | null> => {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DriverSession;
    } catch {
      return null;
    }
  },
  set: (session: DriverSession) =>
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)),
  clear: () => AsyncStorage.removeItem(SESSION_KEY),
};
