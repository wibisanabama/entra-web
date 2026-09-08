export type EventDateFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'UPCOMING';
export type EventPriceFilter = 'ALL' | 'FREE' | 'PAID';
export type EventSort = 'EARLIEST' | 'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'ALPHABETICAL';

export interface EventFilterState {
  query: string;
  category: string;
  date: EventDateFilter;
  city: string;
  price: EventPriceFilter;
  sort: EventSort;
}

const dates: EventDateFilter[] = ['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'UPCOMING'];
const prices: EventPriceFilter[] = ['ALL', 'FREE', 'PAID'];
const sorts: EventSort[] = ['EARLIEST', 'NEWEST', 'PRICE_LOW', 'PRICE_HIGH', 'ALPHABETICAL'];

function oneOf<T extends string>(value: string | null, values: T[], fallback: T): T {
  return value && values.includes(value as T) ? (value as T) : fallback;
}

export function parseEventFilters(params: URLSearchParams): EventFilterState {
  return {
    query: params.get('q')?.trim() || '',
    category: params.get('category') || 'All',
    date: oneOf(params.get('date'), dates, 'ALL'),
    city: params.get('city') || 'ALL',
    price: oneOf(params.get('price'), prices, 'ALL'),
    sort: oneOf(params.get('sort'), sorts, 'EARLIEST'),
  };
}

export function serializeEventFilters(filters: EventFilterState): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.category !== 'All') params.set('category', filters.category);
  if (filters.date !== 'ALL') params.set('date', filters.date);
  if (filters.city !== 'ALL') params.set('city', filters.city);
  if (filters.price !== 'ALL') params.set('price', filters.price);
  if (filters.sort !== 'EARLIEST') params.set('sort', filters.sort);
  return params.toString();
}
