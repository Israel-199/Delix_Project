import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  phone: string;
  accessToken: string | null;
  setPhone: (phone: string) => void;
  login: (phone: string, otp: string) => boolean;
  logout: () => void;
  hydrate: () => void;
}

/** Mock OTP for development — replace with API integration. */
const DEV_OTP = '123456';

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isHydrated: false,
  phone: '',
  accessToken: null,

  setPhone: (phone) => set({ phone }),

  login: (phone, otp) => {
    const normalized = phone.replace(/\s/g, '');
    if (otp !== DEV_OTP) {
      return false;
    }
    set({
      isAuthenticated: true,
      phone: normalized,
      accessToken: `mock-token-${Date.now()}`,
    });
    return true;
  },

  logout: () =>
    set({
      isAuthenticated: false,
      phone: '',
      accessToken: null,
    }),

  hydrate: () => {
    // Future: load token from secure storage
    set({ isHydrated: true });
  },
}));
