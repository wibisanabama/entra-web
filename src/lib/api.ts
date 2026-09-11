import type { ApiResponse } from '@/types';

// Helper to get cookie on the client side
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

// Helper to set cookie on the client side
export function setCookie(name: string, value: string, maxAgeSeconds = 86400, path = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=${path}; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

// Helper to delete cookie on the client side
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
}

// Helper to get token in SSR or browser
export async function getAuthTokenAsync(): Promise<string | null> {
  if (typeof document !== 'undefined') {
    return getCookie('entra_token');
  }
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get('entra_token')?.value || null;
  } catch {
    return null;
  }
}

export async function getRefreshTokenAsync(): Promise<string | null> {
  if (typeof document !== 'undefined') {
    return getCookie('entra_refresh');
  }
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get('entra_refresh')?.value || null;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshTokenAsync();
      if (!refreshToken) {
        return null;
      }

      const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081';
      const res = await fetch(`${authBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: 'no-store',
      });

      if (!res.ok) {
        if (typeof document !== 'undefined') {
          document.cookie = 'entra_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
          document.cookie = 'entra_refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
        }
        return null;
      }

      const data = await res.json();
      const newAccessToken: string | undefined =
        data.data?.tokens?.access_token ||
        data.data?.access_token ||
        data.tokens?.access_token ||
        data.access_token;
      const newRefreshToken: string | undefined =
        data.data?.tokens?.refresh_token ||
        data.data?.refresh_token ||
        data.tokens?.refresh_token ||
        data.refresh_token;

      if (newAccessToken && typeof document !== 'undefined') {
        document.cookie = `entra_token=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;
        if (newRefreshToken) {
          document.cookie = `entra_refresh=${newRefreshToken}; path=/; max-age=604800; SameSite=Lax`;
        }
      }

      return newAccessToken || null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends RequestInit {
  _isRetry?: boolean;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithAuth<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    let token = getCookie('entra_token');
    if (!token && typeof document === 'undefined') {
      token = await getAuthTokenAsync();
    }

    // Proactive silent refresh: if access token is missing/expired but refresh token exists
    if (!token && typeof document !== 'undefined') {
      const refreshToken = getCookie('entra_refresh');
      if (refreshToken && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
        token = await refreshAccessToken();
      }
    }

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers,
    });

    // 401/403 Auto Token Refresh and Retry Interceptor (FE-SEC-002)
    if (
      (response.status === 401 || (response.status === 403 && endpoint.includes('/organizer'))) &&
      !options._isRetry &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/login')
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return this.fetchWithAuth<T>(endpoint, {
          ...options,
          headers: retryHeaders,
          _isRetry: true,
        });
      }
    }

    let data: ApiResponse<T>;
    const text = await response.text();
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text) as ApiResponse<T>;
      } catch {
        data = { success: response.ok, message: text } as ApiResponse<T>;
      }
    } else {
      data = { success: response.ok } as ApiResponse<T>;
    }

    if (!response.ok) {
      const errDetail = typeof data.errors === 'string'
        ? data.errors
        : data.errors
          ? JSON.stringify(data.errors)
          : '';
      const errMsg = errDetail
        ? `${data.message || 'Request failed'}: ${errDetail}`
        : (data.message || `Request failed with status ${response.status}`);
      throw new Error(errMsg);
    }

    return data;
  }

  public async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async del<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public async delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.del<T>(endpoint, options);
  }
}

export const authApi = new ApiClient(process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081');
export const eventApi = new ApiClient(process.env.NEXT_PUBLIC_EVENT_API_URL || 'http://localhost:8082');
export const ticketApi = new ApiClient(process.env.NEXT_PUBLIC_TICKET_API_URL || 'http://localhost:8083');
export const paymentApi = new ApiClient(process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:8084');
export const cashlessApi = new ApiClient(process.env.NEXT_PUBLIC_CASHLESS_API_URL || 'http://localhost:8085');
export const gateApi = new ApiClient(process.env.NEXT_PUBLIC_GATE_API_URL || 'http://localhost:8086');
export const storageApi = new ApiClient(process.env.NEXT_PUBLIC_STORAGE_API_URL || 'http://localhost:8087');
