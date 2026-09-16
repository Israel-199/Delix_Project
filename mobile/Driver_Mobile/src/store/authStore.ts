import { create } from 'zustand';
import { fetchDriverProfile, registerDriver, requestDriverOtp, verifyDriverOtp } from '../services/authService';
import { driverSessionStorage } from '../services/sessionStorage';

interface DriverAuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  needsRegistration: boolean;
  phone: string;
  token: string | null;
  driverId: string;
  plateNumber: string;
  vehicleType: string;
  name: string;
  hydrate: () => Promise<void>;
  sendOtp: (phone: string) => Promise<{ devOtp?: string; bypassedAuth?: boolean }>;
  verifyAndLogin: (phone: string, otp: string) => Promise<void>;
  completeRegistration: (payload: {
    name: string;
    licenseNumber: string;
    licensePhotoUrl?: string;
    profilePhotoUrl?: string;
    nationalId?: string;
    plateNumber: string;
    vehicleType: string;
    vehicleCargoType?: string;
    vehicleOwnerName?: string;
    librePhotoUrl?: string;
    insuranceInfo?: string;
    bankAccount?: string;
    address?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const persistSession = async (state: {
  phone: string;
  token: string;
  driverId: string;
  plateNumber: string;
  vehicleType: string;
  name: string;
  needsRegistration: boolean;
}) => {
  await driverSessionStorage.set({
    phone: state.phone,
    token: state.token,
    driverId: state.driverId,
    plateNumber: state.plateNumber,
    vehicleType: state.vehicleType,
    name: state.name,
    needsRegistration: state.needsRegistration,
  });
};

export const useDriverAuthStore = create<DriverAuthState>((set, get) => ({
  isAuthenticated: false,
  isHydrated: false,
  needsRegistration: false,
  phone: '',
  token: null,
  driverId: '',
  plateNumber: '',
  vehicleType: 'MINI_TRUCK',
  name: 'Driver',

  hydrate: async () => {
    const session = await driverSessionStorage.get();
    if (session) {
      set({
        isAuthenticated: true,
        isHydrated: true,
        needsRegistration: session.needsRegistration,
        phone: session.phone,
        token: session.token,
        driverId: session.driverId,
        plateNumber: session.plateNumber,
        vehicleType: session.vehicleType,
        name: session.name,
      });

      try {
        const profile = await fetchDriverProfile(session.phone);
        if (profile.driver) {
          const isRegistered = !!(profile.driver.plateNumber && profile.driver.name);
          const refreshed = {
            driverId: profile.driver.id,
            plateNumber: profile.driver.plateNumber,
            vehicleType: profile.driver.vehicleType,
            needsRegistration: !isRegistered,
          };
          set(refreshed);
          await persistSession({
            phone: session.phone,
            token: session.token,
            name: session.name,
            ...refreshed,
          });
        }
      } catch {
        // keep cached session
      }
      return;
    }
    set({ isHydrated: true });
  },

  sendOtp: async (phone) => {
    const res = await requestDriverOtp(phone);
    set({ phone: res.phone ?? phone });
    
    if (res.token && res.isProfileComplete) {
      // User is already verified and profile is complete (bypass OTP)
      let needsRegistration = true;
      let driverId = phone;
      let plateNumber = '';
      let vehicleType = 'MINI_TRUCK';

      try {
        const profile = await fetchDriverProfile(phone);
        if (profile.driver) {
          driverId = profile.driver.id;
          plateNumber = profile.driver.plateNumber || '';
          vehicleType = profile.driver.vehicleType || 'MINI_TRUCK';
          needsRegistration = !(profile.driver.plateNumber && profile.driver.name);
        }
      } catch {
        // Keep defaults
      }

      const next = {
        isAuthenticated: true,
        isHydrated: true,
        phone,
        token: res.token,
        driverId,
        plateNumber,
        vehicleType,
        name: res.user?.name ?? 'Driver',
        needsRegistration,
      };

      set(next);
      await persistSession({ ...next, token: res.token });
      return { bypassedAuth: true };
    }

    return { devOtp: res.devOtp };
  },

  verifyAndLogin: async (phone, otp) => {
    const res = await verifyDriverOtp(phone, otp);
    let driverId = phone;
    let plateNumber = '';
    let vehicleType = 'MINI_TRUCK';
    let needsRegistration = true;

    try {
      const profile = await fetchDriverProfile(phone);
      if (profile.driver) {
        driverId = profile.driver.id;
        plateNumber = profile.driver.plateNumber || '';
        vehicleType = profile.driver.vehicleType || 'MINI_TRUCK';
        needsRegistration = !(profile.driver.plateNumber && profile.driver.name);
      }
    } catch {
      // keep phone as driver ref
    }

    const next = {
      isAuthenticated: true,
      phone,
      token: res.token,
      driverId,
      plateNumber,
      vehicleType,
      name: res.user.name ?? 'Driver',
      needsRegistration,
    };

    set(next);
    await persistSession({ ...next, token: res.token });
  },

  completeRegistration: async (payload) => {
    const { phone, token } = get();
    const res = await registerDriver({
      phone,
      ...payload,
    });

    const driver = res.driver;
    const next = {
      driverId: driver.id,
      plateNumber: driver.plateNumber,
      vehicleType: driver.vehicleType,
      name: payload.name,
      needsRegistration: false,
    };

    set(next);
    await persistSession({
      phone,
      token: token ?? '',
      ...next,
      needsRegistration: false,
    });
  },

  logout: async () => {
    await driverSessionStorage.clear();
    set({
      isAuthenticated: false,
      needsRegistration: false,
      phone: '',
      token: null,
      driverId: '',
      plateNumber: '',
      vehicleType: 'MINI_TRUCK',
      name: 'Driver',
    });
  },
}));
