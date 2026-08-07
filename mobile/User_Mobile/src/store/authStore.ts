import { create } from 'zustand';
import { requestOtp, verifyOtp, updateUserProfile, getUserProfile } from '../services/authService';
import { setAuthToken } from '../services/apiClient';
import { tokenStorage } from '../services/tokenStorage';
import { normalizePhone } from '../utils/mappers';

export interface AuthUser {
  phone: string;
  name: string;
  role: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  profilePhotoUrl?: string | null;
  isProfileComplete?: boolean;
}

export interface ProfileUpdateData {
  firstName: string;
  middleName: string;
  lastName: string;
  profilePhoto: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  phone: string;
  accessToken: string | null;
  user: AuthUser | null;
  setPhone: (phone: string) => void;
  sendOtp: (phone: string) => Promise<{ devOtp?: string }>;
  verifyAndLogin: (phone: string, otp: string) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isHydrated: false,
  phone: '',
  accessToken: null,
  user: null,

  setPhone: (phone) => set({ phone }),

  sendOtp: async (phone) => {
    const response = await requestOtp(phone);
    const normalized = normalizePhone(phone);
    set({ phone: normalized });
    return { devOtp: response.devOtp };
  },

  verifyAndLogin: async (phone, otp) => {
    const response = await verifyOtp(phone, otp);
    const normalized = normalizePhone(phone);

    setAuthToken(response.token);
    await tokenStorage.setToken(response.token);
    await tokenStorage.setPhone(normalized);

    set({
      isAuthenticated: true,
      phone: normalized,
      accessToken: response.token,
      user: response.user,
    });

    // Automatically attempt profile fetch if existing
    get().fetchProfile();
  },

  updateProfile: async (data: ProfileUpdateData) => {
    const response = await updateUserProfile(data);
    const { user } = get();
    const nameParts = [data.firstName, data.middleName, data.lastName].filter(Boolean);
    const name = nameParts.join(' ');

    set({
      user: {
        ...(user || { phone: get().phone, role: 'CUSTOMER' }),
        name,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        profilePhotoUrl: data.profilePhoto,
        isProfileComplete: true,
      },
    });
  },

  fetchProfile: async () => {
    try {
      const response = await getUserProfile();
      if (response && response.user) {
        const u = response.user;
        const nameParts = [u.firstName, u.middleName, u.lastName].filter(Boolean);
        const name = nameParts.length > 0 ? nameParts.join(' ') : 'Delix User';
        set((state) => ({
          user: {
            ...state.user,
            phone: u.phone || state.phone,
            name,
            role: u.role || 'CUSTOMER',
            firstName: u.firstName,
            middleName: u.middleName,
            lastName: u.lastName,
            profilePhotoUrl: u.profilePhotoUrl,
            isProfileComplete: !!(u.firstName && u.middleName && u.lastName),
          },
        }));
      }
    } catch (err) {
      console.log('Fetch profile info fallback/quiet:', err);
    }
  },

  logout: async () => {
    setAuthToken(null);
    await tokenStorage.clear();
    set({
      isAuthenticated: false,
      phone: '',
      accessToken: null,
      user: null,
    });
  },

  hydrate: async () => {
    try {
      const [token, phone] = await Promise.all([
        tokenStorage.getToken(),
        tokenStorage.getPhone(),
      ]);

      if (token && phone) {
        setAuthToken(token);
        set({
          isAuthenticated: true,
          accessToken: token,
          phone,
          user: { phone, name: 'Delix User', role: 'CUSTOMER' },
        });

        // Background fetch to hydrate profile details like photo and name
        get().fetchProfile();
      }
    } finally {
      set({ isHydrated: true });
    }
  },
}));

