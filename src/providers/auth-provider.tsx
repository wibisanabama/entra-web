"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCookies = (accessToken: string, refreshToken: string, expiresAt: number) => {
    const date = new Date(expiresAt * 1000).toUTCString();
    document.cookie = `entra_token=${accessToken}; path=/; expires=${date}`;
    document.cookie = `entra_refresh=${refreshToken}; path=/; expires=${date}`;
  };

  const clearCookies = () => {
    document.cookie = "entra_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "entra_refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  };

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Check if token exists
      const tokenMatch = document.cookie.match(/(?:(?:^|.*;\s*)entra_token\s*\=\s*([^;]*).*$)|^.*$/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        const response = await authApi.get<User>("/api/v1/auth/profile");
        if (response.data) {
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      clearCookies();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.post<AuthResponse>("/api/v1/auth/login", data);
      if (response.data) {
        const { user: userData, tokens } = response.data;
        setCookies(tokens.access_token, tokens.refresh_token, tokens.expires_at);
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authApi.post<AuthResponse>("/api/v1/auth/register", data);
      if (response.data) {
        const { user: userData, tokens } = response.data;
        setCookies(tokens.access_token, tokens.refresh_token, tokens.expires_at);
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    clearCookies();
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const refreshMatch = document.cookie.match(/(?:(?:^|.*;\s*)entra_refresh\s*\=\s*([^;]*).*$)|^.*$/);
      const token = refreshMatch ? refreshMatch[1] : null;
      
      if (!token) throw new Error("No refresh token available");

      const response = await authApi.post<AuthResponse>("/api/v1/auth/refresh", { refresh_token: token });
      if (response.data) {
        const { tokens } = response.data;
        setCookies(tokens.access_token, tokens.refresh_token, tokens.expires_at);
      }
    } catch (error) {
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshToken, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
