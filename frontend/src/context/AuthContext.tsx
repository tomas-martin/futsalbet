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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  exchangeSupabaseSession: (accessToken: string) => Promise<User>;
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

  const login = (newToken: string, newUser: User) => {
    persistUser(newToken, newUser);
  };

  const logout = async () => {
    try {
      await supabase?.auth.signOut();
    } catch (e) {
      // ignore
    }
    persistUser(null, null);
  };

  // Envía el access_token de la sesión de Supabase al backend para obtener
  // el JWT de la app y los datos del usuario local (incluido el rol admin).
  const exchangeSupabaseSession = async (accessToken: string): Promise<User> => {
    const res = await apiClient.post('/auth/supabase', { accessToken });
    const mapped: User = {
      id: res.data.user.id,
      email: res.data.user.email,
      username: res.data.user.username,
      displayName: res.data.user.displayName,
      avatarUrl: res.data.user.avatarUrl,
      role: res.data.user.role,
    };
    persistUser(res.data.token, mapped);
    return mapped;
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado en el frontend');
    const redirectTo = `${window.location.origin}/login`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;

    if (data.session) {
      await exchangeSupabaseSession(data.session.access_token);
      return { requiresEmailConfirmation: false };
    }
    return { requiresEmailConfirmation: true };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado en el frontend');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('No se obtuvo una sesión de Supabase');
    await exchangeSupabaseSession(data.session.access_token);
  };

  const refreshUser = async () => {
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
      };
      persistUser(token, updatedUser);
    } catch {
      // invalid token — fallback a sesión de Supabase si existe
      try {
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            await exchangeSupabaseSession(sessionData.session.access_token);
          }
        }
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    refreshUser();

    const sub = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        exchangeSupabaseSession(session.access_token).catch(() => {});
      }
      if (event === 'SIGNED_OUT') {
        persistUser(null, null);
      }
    });

    return () => {
      sub?.data.subscription.unsubscribe();
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
        refreshUser,
        signUp,
        signIn,
        exchangeSupabaseSession,
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