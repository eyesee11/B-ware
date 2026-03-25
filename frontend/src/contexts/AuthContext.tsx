'use client';

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '@/services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (name: string, email: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      // Verify token is still valid
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentToken = token || localStorage.getItem('auth_token');
      if (currentToken) {
        const userData = await authApi.getMe(currentToken);
        setUser(userData);
        setToken(currentToken);
      }
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      
      const newToken = response.token;
      const userData = response.user;

      // Store token in localStorage
      localStorage.setItem('auth_token', newToken);
      
      // Update state
      setToken(newToken);
      setUser(userData);

      return { user: userData, token: newToken };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(name, email, password);
      
      const newToken = response.token;
      const userData = response.user;

      // Store token in localStorage
      localStorage.setItem('auth_token', newToken);
      
      // Update state
      setToken(newToken);
      setUser(userData);

      return { user: userData, token: newToken };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentToken = token || localStorage.getItem('auth_token');
      if (currentToken) {
        await authApi.logout(currentToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and storage regardless of API response
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    setUser,
    setToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
