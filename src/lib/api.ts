import { ApiResponse } from '@/types';

// Helper to get cookie on the client side
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = getCookie('entra_token');
    
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  public async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async del<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const authApi = new ApiClient(process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081');
export const eventApi = new ApiClient(process.env.NEXT_PUBLIC_EVENT_API_URL || 'http://localhost:8082');
export const ticketApi = new ApiClient(process.env.NEXT_PUBLIC_TICKET_API_URL || 'http://localhost:8083');
export const paymentApi = new ApiClient(process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:8084');
export const cashlessApi = new ApiClient(process.env.NEXT_PUBLIC_CASHLESS_API_URL || 'http://localhost:8085');
export const gateApi = new ApiClient(process.env.NEXT_PUBLIC_GATE_API_URL || 'http://localhost:8086');
export const storageApi = new ApiClient(process.env.NEXT_PUBLIC_STORAGE_API_URL || 'http://localhost:8087');
