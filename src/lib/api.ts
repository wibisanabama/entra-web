import { ApiResponse } from '@/types';

// Helper to get cookie on the client side
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = getCookie('entra_token');
    
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  public async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async del<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
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
