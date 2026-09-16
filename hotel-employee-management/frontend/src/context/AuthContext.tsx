'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getMe, logout as logoutApi } from '@/lib/api/auth';
import type { Admin } from '@/lib/types';

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  admin: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    const user = await getMe();
    setAdmin(user);
    setLoading(false);
    return user;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    const isLoginPage = pathname === '/login';
    if (!admin && !isLoginPage) {
      router.replace('/login');
    } else if (admin && isLoginPage) {
      router.replace('/');
    }
  }, [admin, loading, pathname, router]);

  const logout = async () => {
    await logoutApi();
    setAdmin(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ admin, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
