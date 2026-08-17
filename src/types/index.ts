export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface Event {
  id: string;
  organizer_id: string;
  venue_id: string;
  category_id: string;
  title: string;
  description: string;
  banner_url: string;
  start_date: string;
  end_date: string;
  status: string;
  is_online: boolean;
  online_url: string;
  max_attendees: number;
  created_at: string;
  updated_at: string;
  venue?: Venue;
  category?: Category;
  ticket_types?: TicketType[];
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: { String: string; Valid: boolean } | string;
  price: string;
  quantity: number;
  sold: number;
  max_per_order: { Int32: number; Valid: boolean } | number;
  sale_start: string;
  sale_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  event_id: string;
  total_amount: number;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Ticket {
  id: string;
  order_id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string;
  ticket_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichedTicket extends Ticket {
  event?: Event;
  ticket_type?: TicketType;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: string;
  amount: number;
  reference_id: string;
  description: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: unknown;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface CreateEventRequest {
  venue_id: string;
  category_id: string;
  title: string;
  description: string;
  banner_url: string;
  start_date: string;
  end_date: string;
  is_online: boolean;
  online_url: string;
  max_attendees: number;
}

export interface UpdateEventRequest extends CreateEventRequest {
  status: string;
}

export interface CreateVenueRequest {
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity: number;
  description: string;
}

export interface CreateOrderRequest {
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  price: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface Withdrawal {
  id: string;
  organizer_id: string;
  amount: number | string;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | string;
  rejection_reason?: { String: string; Valid: boolean } | string;
  notes?: { String: string; Valid: boolean } | string;
  created_at: string;
  updated_at: string;
}

export interface OrganizerBalance {
  total_revenue: number;
  total_withdrawn: number;
  available_balance: number;
  pending_amount: number;
  paid_amount: number;
  total_requests: number;
}

export interface CreateWithdrawalRequest {
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  notes?: string;
}

