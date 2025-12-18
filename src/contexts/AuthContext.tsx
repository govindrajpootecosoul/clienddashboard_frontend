'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/services/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authApi.getMe();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success && response.data) {
      const { user, tokens } = response.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setUser(user);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const signup = async (data: { name: string; email: string; password: string; phone?: string; role?: string }) => {
    const response = await authApi.signup(data);
    if (response.success && response.data) {
      const { user, tokens } = response.data;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setUser(user);
    } else {
      throw new Error(response.message || 'Signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


