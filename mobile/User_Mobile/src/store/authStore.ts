import { create } from 'zustand';
import { requestOtp, verifyOtp } from '../services/authService';
import { setAuthToken } from '../services/apiClient';
import { tokenStorage } from '../services/tokenStorage';
import { normalizePhone } from '../utils/mappers';

interface AuthUser {
  phone: string;
  name: string;
  role: string;
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
      }
    } finally {
      set({ isHydrated: true });
    }
  },
}));
