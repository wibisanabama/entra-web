'use client';

import { useEffect, useState, useMemo } from 'react';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { eventApi } from '@/lib/api';
import { Event, Category, Venue } from '@/types';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  ArrowUpDown,
  X,
  RotateCcw,
  Sparkles
} from 'lucide-react';

type DateFilterOption = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'UPCOMING';
type PriceFilterOption = 'ALL' | 'FREE' | 'PAID';
type SortOption = 'EARLIEST' | 'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH' | 'ALPHABETICAL';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ALL');
  const [selectedCity, setSelectedCity] = useState<string | 'ALL'>('ALL');
  const [priceFilter, setPriceFilter] = useState<PriceFilterOption>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('EARLIEST');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, venueRes, res] = await Promise.all([
          eventApi.get<Category[]>('/api/v1/categories').catch(() => ({ success: false, data: [] as Category[] })),
          eventApi.get<Venue[]>('/api/v1/venues').catch(() => ({ success: false, data: [] as Venue[] })),
          eventApi.get<Event[]>('/api/v1/events?page=1&per_page=50').catch(() => ({ success: false, data: [] as Event[] })),
        ]);

        const rawCategories = Array.isArray(catRes.data) ? catRes.data : [];
        const rawVenues = Array.isArray(venueRes.data) ? venueRes.data : [];
        const rawEvents = Array.isArray(res.data) ? res.data : [];

        setCategories(rawCategories);
        setVenues(rawVenues);

        // Enrich events with venue & category models
        const enrichedEvents = rawEvents.map((ev) => {
          const matchedVenue = rawVenues.find((v) => v.id === ev.venue_id);
          const matchedCat = rawCategories.find((c) => c.id === ev.category_id);
          return {
            ...ev,
            venue: matchedVenue || ev.venue,
            category: matchedCat || ev.category,
          };
        });

        setEvents(enrichedEvents);
      } catch (error) {
        console.error('Error fetching event directory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract unique cities from venues
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    venues.forEach((v) => {
      if (v.city && v.city.trim().length > 0) {
        citySet.add(v.city.trim());
      }
    });
    return Array.from(citySet).sort();
  }, [venues]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setDateFilter('ALL');
    setSelectedCity('ALL');
    setPriceFilter('ALL');
    setSortBy('EARLIEST');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    dateFilter !== 'ALL' ||
    selectedCity !== 'ALL' ||
    priceFilter !== 'ALL' ||
    sortBy !== 'EARLIEST';

  // Filter & sort logic
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // End of this week (Sunday)
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    // End of this month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return events
      .filter((event) => {
        // 1. Search Query (title, description, venue city/name)
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase();
          const matchTitle = event.title?.toLowerCase().includes(q);
          const matchDesc = event.description?.toLowerCase().includes(q);
          const matchVenue =
            event.venue?.name?.toLowerCase().includes(q) ||
            event.venue?.city?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchVenue) return false;
        }

        // 2. Category Filter
        if (selectedCategory !== 'All' && event.category_id !== selectedCategory) {
          return false;
        }

        // 3. Date Range Filter
        if (event.start_date) {
          const eventDate = new Date(event.start_date);
          if (dateFilter === 'TODAY') {
            if (eventDate < startOfToday || eventDate > endOfToday) return false;
          } else if (dateFilter === 'THIS_WEEK') {
            if (eventDate < startOfToday || eventDate > endOfWeek) return false;
          } else if (dateFilter === 'THIS_MONTH') {
            if (eventDate < startOfToday || eventDate > endOfMonth) return false;
          } else if (dateFilter === 'UPCOMING') {
            if (eventDate < startOfToday) return false;
          }
        }

        // 4. City Filter
        if (selectedCity !== 'ALL') {
          if (event.venue?.city?.toLowerCase() !== selectedCity.toLowerCase()) {
            return false;
          }
        }

        // 5. Price Filter
        if (priceFilter !== 'ALL') {
          const ticketTypes = event.ticket_types || [];
          const isFree = ticketTypes.length > 0 && ticketTypes.every((t) => Number(t.price) === 0);
          if (priceFilter === 'FREE' && !isFree) return false;
          if (priceFilter === 'PAID' && isFree) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Dynamic Sorting
        if (sortBy === 'EARLIEST') {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        }
        if (sortBy === 'NEWEST') {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === 'ALPHABETICAL') {
          return (a.title || '').localeCompare(b.title || '');
        }

        // Price Sorting helper
        const getMinPrice = (ev: Event) => {
          if (!ev.ticket_types || ev.ticket_types.length === 0) return 0;
          return Math.min(...ev.ticket_types.map((t) => Number(t.price) || 0));
        };

        if (sortBy === 'PRICE_LOW') {
          return getMinPrice(a) - getMinPrice(b);
        }
        if (sortBy === 'PRICE_HIGH') {
          return getMinPrice(b) - getMinPrice(a);
        }

        return 0;
      });
  }, [events, searchQuery, selectedCategory, dateFilter, selectedCity, priceFilter, sortBy]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8 text-zinc-900">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold uppercase tracking-wider border border-zinc-200">
          <Sparkles className="h-3.5 w-3.5 text-zinc-700" />
          Direktori Acara & Festival
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
          Jelajahi Event & Konser Spektakuler
        </h1>
        <p className="text-zinc-500 text-sm sm:text-base">
          Temukan tiket festival musik, seminar teknologi, workshop seni, dan turnamen olahraga terbaik di Indonesia.
        </p>
      </div>

      {/* Main Search & Quick Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul event, artis, atau venue..."
              aria-label="Cari judul event, artis, atau nama venue"
              className="w-full pl-11 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* City / Location Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[150px]">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter Kota Venue"
                className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-xs sm:text-sm text-zinc-800 font-medium focus:outline-none focus:border-zinc-900 appearance-none cursor-pointer hover:bg-zinc-100 transition-colors"
              >
                <option value="ALL">Semua Kota</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[160px]">
              <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Urutkan Event"
                className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-xs sm:text-sm text-zinc-800 font-medium focus:outline-none focus:border-zinc-900 appearance-none cursor-pointer hover:bg-zinc-100 transition-colors"
              >
                <option value="EARLIEST">Tanggal Terdekat</option>
                <option value="NEWEST">Terbaru Dibuat</option>
                <option value="PRICE_LOW">Harga Termurah</option>
                <option value="PRICE_HIGH">Harga Tertinggi</option>
                <option value="ALPHABETICAL">Nama (A - Z)</option>
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className="md:hidden py-2.5 px-3 rounded-full border-zinc-200"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Secondary Filter Bar: Categories, Date & Price Options */}
        <div className="pt-3 border-t border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70 border border-zinc-200/60'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70 border border-zinc-200/60'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Date Chips */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-100 p-1 rounded-full border border-zinc-200 text-xs">
            {[
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'TODAY', label: 'Hari Ini' },
              { id: 'THIS_WEEK', label: 'Minggu Ini' },
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as DateFilterOption)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  dateFilter === d.id ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Display & Reset Bar */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-500 font-medium">Filter Aktif:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-full font-medium">
                  Cari: &quot;{searchQuery}&quot;
                  <X className="h-3 w-3 cursor-pointer text-zinc-400 hover:text-zinc-900" onClick={() => setSearchQuery('')} />
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-full font-medium">
                  Kategori: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                  <X className="h-3 w-3 cursor-pointer text-zinc-400 hover:text-zinc-900" onClick={() => setSelectedCategory('All')} />
                </span>
              )}
              {selectedCity !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-full font-medium">
                  Kota: {selectedCity}
                  <X className="h-3 w-3 cursor-pointer text-zinc-400 hover:text-zinc-900" onClick={() => setSelectedCity('ALL')} />
                </span>
              )}
              {dateFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-full font-medium">
                  Waktu: {dateFilter}
                  <X className="h-3 w-3 cursor-pointer text-zinc-400 hover:text-zinc-900" onClick={() => setDateFilter('ALL')} />
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span>
          Menampilkan <strong className="text-zinc-950 font-semibold">{filteredEvents.length}</strong> event yang tersedia
        </span>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                <Skeleton className="h-44 w-full rounded-xl bg-zinc-200/60" />
                <Skeleton className="h-5 w-3/4 bg-zinc-200/60 mt-2" />
                <Skeleton className="h-4 w-1/2 bg-zinc-200/60" />
              </div>
            ))
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[360px] text-center p-8 bg-zinc-50/50 rounded-3xl border border-zinc-200 space-y-4">
            <div className="p-4 bg-zinc-100 rounded-full text-zinc-400 w-16 h-16 flex items-center justify-center border border-zinc-200">
              <Search className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-950 mb-1">Tidak Ada Event yang Sesuai</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto">
                Coba gunakan kata kunci lain, pilih kategori yang berbeda, atau reset filter untuk melihat semua event.
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-zinc-900 border-zinc-300 rounded-full"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Semua Filter
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
