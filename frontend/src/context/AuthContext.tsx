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
  authSuccessNotice: string | null;
  clearAuthSuccessNotice: () => void;
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
  const [authSuccessNotice, setAuthSuccessNotice] = useState<string | null>(null);

  const clearAuthSuccessNotice = () => setAuthSuccessNotice(null);

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
    // 1. Intentar registro sin verificación vía backend (usuario pre-confirmado en Supabase Auth)
    try {
      await apiClient.post('/auth/register', { email, password });
      // Iniciar sesión automáticamente
      if (supabase) {
        await signIn(email, password);
      }
      return { requiresEmailConfirmation: false };
    } catch (backendErr: any) {
      const message = backendErr.response?.data?.error;
      if (message) {
        throw new Error(message);
      }

      // 2. Fallback a Supabase Auth directo en caso de que el backend no responda
      if (!supabase) throw new Error('Supabase no está configurado en el frontend');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (data.session) {
        await exchangeSupabaseSession(data.session.access_token);
      } else {
        // Intentar iniciar sesión por si email_confirm está desactivado en la consola
        await signIn(email, password).catch(() => {});
      }
      return { requiresEmailConfirmation: false };
    }
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
    let isHashVerification = false;

    // Si la URL viene con hash #access_token=... (p.ej. redirección de email de confirmación)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');

      if (type === 'signup' || type === 'email_verification' || !type) {
        setAuthSuccessNotice('¡Email verificado con éxito! Tu cuenta está activada e iniciaste sesión.');
      }
      isHashVerification = true;
    }

    refreshUser();

    // Escuchar cambios de autenticación en Supabase
    const sub = supabase?.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') &&
        session?.access_token
      ) {
        exchangeSupabaseSession(session.access_token).catch(() => {});
      }
      if (event === 'SIGNED_OUT') {
        persistUser(null, null);
      }
    });

    // Verificación directa de la sesión de Supabase al montar por si el hash ya fue procesado
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.access_token) {
          exchangeSupabaseSession(data.session.access_token).catch(() => {});
        }
      });
    }

    // Limpiar el hash de la URL si se procesó la redirección
    if (isHashVerification) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

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
        authSuccessNotice,
        clearAuthSuccessNotice,
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