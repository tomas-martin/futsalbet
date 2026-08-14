import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  balance: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
  refreshUser: () => Promise<void>;
  signInWithEmail?: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('futsalbet_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futsalbet_user');
    return saved ? JSON.parse(saved) : null;
  });

  const persistUser = (newToken: string | null, newUser: User | null) => {
    if (newToken && newUser) {
      localStorage.setItem('futsalbet_token', newToken);
      localStorage.setItem('futsalbet_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('futsalbet_token');
      localStorage.removeItem('futsalbet_user');
    }
    setToken(newToken);
    setUser(newUser);
  };

  // Keep the old API-based login signature for existing pages/components
  const login = (newToken: string, newUser: User) => {
    persistUser(newToken, newUser);
  };

  const logout = async () => {
    try {
      // sign out from Supabase if used
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    persistUser(null, null);
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updated = { ...user, balance: newBalance };
      persistUser(token, updated);
    }
  };

  const refreshUser = async () => {
    // Try Supabase first
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        const u = data.user;
        const isAdmin = (u.user_metadata as any)?.is_admin === true;
        const mapped: User = {
          id: u.id,
          email: u.email ?? '',
          username: (u.user_metadata as any)?.username ?? u.email ?? '',
          displayName: (u.user_metadata as any)?.displayName ?? (u.user_metadata as any)?.name ?? '',
          avatarUrl: (u.user_metadata as any)?.avatarUrl ?? undefined,
          role: isAdmin ? 'ADMIN' : 'USER',
          balance: Number((u.user_metadata as any)?.balance ?? 0),
        };
        const session = (await supabase.auth.getSession()).data.session;
        const accessToken = session?.access_token ?? null;
        persistUser(accessToken, mapped);
        return;
      }
    } catch (err) {
      // fallthrough to backend
    }

    // Fallback: try backend auth/me if token present
    if (!token) return;
    try {
      const res = await apiClient.get('/auth/me');
      const data = res.data;
      const updatedUser: User = {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        role: data.role,
        balance: Number(data.wallet?.balance ?? 0),
      };
      persistUser(token, updatedUser);
    } catch {
      // invalid token
    }
  };

  // helper for signing in via Supabase (email/password)
  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const session = data.session;
    const u = data.user;
    const isAdmin = (u?.user_metadata as any)?.is_admin === true;
    const mapped: User = {
      id: u!.id,
      email: u!.email ?? '',
      username: (u!.user_metadata as any)?.username ?? u!.email ?? '',
      displayName: (u!.user_metadata as any)?.displayName ?? (u!.user_metadata as any)?.name ?? '',
      avatarUrl: (u!.user_metadata as any)?.avatarUrl ?? undefined,
      role: isAdmin ? 'ADMIN' : 'USER',
      balance: Number((u!.user_metadata as any)?.balance ?? 0),
    };
    const accessToken = session?.access_token ?? null;
    persistUser(accessToken, mapped);
  };

  useEffect(() => {
    // on mount try to restore session from Supabase or backend
    refreshUser();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // set user from session
        const u = session.user;
        const isAdmin = (u.user_metadata as any)?.is_admin === true;
        const mapped: User = {
          id: u.id,
          email: u.email ?? '',
          username: (u.user_metadata as any)?.username ?? u.email ?? '',
          displayName: (u.user_metadata as any)?.displayName ?? (u.user_metadata as any)?.name ?? '',
          avatarUrl: (u.user_metadata as any)?.avatarUrl ?? undefined,
          role: isAdmin ? 'ADMIN' : 'USER',
          balance: Number((u.user_metadata as any)?.balance ?? 0),
        };
        const accessToken = session.access_token ?? null;
        persistUser(accessToken, mapped);
      }

      if (event === 'SIGNED_OUT') {
        persistUser(null, null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token && !user) {
      refreshUser();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
        updateUserBalance,
        refreshUser,
        signInWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
