"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { AuthResponse, LoginRequest, RegisterRequest, TokenPair, User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setAuthData: (user: User, tokens: TokenPair) => void;
  upgradeToOrganizer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCookies = (accessToken: string, refreshToken: string, expiresAt: number) => {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; SameSite=Strict; Secure' : '; SameSite=Lax';
    const accessDate = new Date(expiresAt * 1000).toUTCString();
    const refreshDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `entra_token=${accessToken}; path=/; expires=${accessDate}${secureFlag}`;
    document.cookie = `entra_refresh=${refreshToken}; path=/; expires=${refreshDate}${secureFlag}`;
  };

  const clearCookies = () => {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; SameSite=Strict; Secure' : '; SameSite=Lax';
    document.cookie = `entra_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT${secureFlag}`;
    document.cookie = `entra_refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT${secureFlag}`;
  };

  const parseTokenRole = (tokenStr: string | null): string | null => {
    if (!tokenStr) return null;
    try {
      const parts = tokenStr.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload?.role || null;
    } catch {
      return null;
    }
  };

  const syncTokensIfRoleChanged = async (currentToken: string, currentRole: string) => {
    const tokenRole = parseTokenRole(currentToken);
    if (tokenRole && tokenRole !== currentRole) {
      try {
        const refreshMatch = document.cookie.match(/(?:(?:^|.*;\s*)entra_refresh\s*=\s*([^;]*).*$)|^.*$/);
        const refreshTokenStr = refreshMatch ? refreshMatch[1] : null;
        if (refreshTokenStr) {
          const refreshRes = await authApi.post<AuthResponse>("/api/v1/auth/refresh", { refresh_token: refreshTokenStr });
          if (refreshRes.data?.tokens) {
            setCookies(refreshRes.data.tokens.access_token, refreshRes.data.tokens.refresh_token, refreshRes.data.tokens.expires_at);
          }
        }
      } catch {
        // ignore background refresh failure
      }
    }
  };

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if token exists
      const tokenMatch = document.cookie.match(/(?:(?:^|.*;\s*)entra_token\s*=\s*([^;]*).*$)|^.*$/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        const response = await authApi.get<User>("/api/v1/auth/profile");
        if (response.data) {
          setUser(response.data);
          await syncTokensIfRoleChanged(token, response.data.role);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      clearCookies();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const tokenMatch = document.cookie.match(/(?:(?:^|.*;\s*)entra_token\s*=\s*([^;]*).*$)|^.*$/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (token) {
          const response = await authApi.get<User>("/api/v1/auth/profile");
          if (isMounted && response.data) {
            setUser(response.data);
            await syncTokensIfRoleChanged(token, response.data.role);
          }
        }
      } catch (error) {
        console.error("Failed to load profile on mount:", error);
        if (isMounted) {
          clearCookies();
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authApi.post<AuthResponse>("/api/v1/auth/login", data);
    if (response.data) {
      const { user: userData, tokens } = response.data;
      setCookies(tokens.access_token, tokens.refresh_token, tokens.expires_at);
      setUser(userData);
    }
  };

  const register = async (data: RegisterRequest) => {
    const response = await authApi.post<AuthResponse>("/api/v1/auth/register", data);
    if (response.data) {
      const { user: userData, tokens } = response.data;
      setCookies(tokens.access_token, tokens.refresh_token, tokens.expires_at);
      setUser(userData);
    }
  };

  const logout = () => {
    clearCookies();
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const refreshMatch = document.cookie.match(/(?:(?:^|.*;\s*)entra_refresh\s*=\s*([^;]*).*$)|^.*$/);
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

  const setAuthData = React.useCallback((userData: User, tokens: TokenPair) => {
    setCookies(tokens.access_token, tokens.refresh_token, tokens.expires_at);
    setUser(userData);
  }, []);

  const upgradeToOrganizer = React.useCallback(async () => {
    const response = await authApi.post<AuthResponse>("/api/v1/auth/upgrade");
    if (response.data?.tokens && response.data?.user) {
      setAuthData(response.data.user, response.data.tokens);
    }
  }, [setAuthData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        loadProfile,
        setAuthData,
        upgradeToOrganizer,
      }}
    >
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
