import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

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
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('futsalbet_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futsalbet_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('futsalbet_token', newToken);
    localStorage.setItem('futsalbet_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('futsalbet_token');
    localStorage.removeItem('futsalbet_user');
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updated = { ...user, balance: newBalance };
      setUser(updated);
      localStorage.setItem('futsalbet_user', JSON.stringify(updated));
    }
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
        balance: Number(data.wallet?.balance ?? 0),
      };
      setUser(updatedUser);
      localStorage.setItem('futsalbet_user', JSON.stringify(updatedUser));
    } catch {
      // invalid token
    }
  };

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
