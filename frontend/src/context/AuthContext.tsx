'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  login as apiLogin,
  clearToken,
  getStoredUser,
  getToken,
  type UserPayload,
  type Role,
} from '@/lib/api';

interface AuthContextType {
  user: UserPayload | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  DOCTOR: '/dashboard/doctor',
  LAB_TECH: '/dashboard/laboratory',
  PHARMACIST: '/dashboard/pharmacy',
  NURSE: '/dashboard/admin', // Nurses share admin queue view for triage
  PATIENT: '/dashboard/patient',
};

export function getDashboardPath(role: Role): string {
  return ROLE_DASHBOARD_MAP[role] || '/dashboard';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate from localStorage
  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  // Redirect unauthenticated users away from /dashboard
  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname?.startsWith('/dashboard')) {
      router.replace('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
    setToken(res.access_token);
    router.push(getDashboardPath(res.user.role));
  }, [router]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setToken(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
