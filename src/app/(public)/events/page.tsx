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
  Calendar as CalendarIcon,
  MapPin,
  Tag,
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
          eventApi.get('/api/v1/categories').catch(() => ({ data: [] })),
          eventApi.get('/api/v1/venues').catch(() => ({ data: [] })),
          eventApi.get('/api/v1/events?page=1&per_page=50').catch(() => ({ data: [] })),
        ]);

        const rawCategories = Array.isArray(catRes.data) ? (catRes.data as Category[]) : [];
        const rawVenues = Array.isArray(venueRes.data?.data)
          ? (venueRes.data.data as Venue[])
          : Array.isArray(venueRes.data)
          ? (venueRes.data as Venue[])
          : [];
        const rawEvents = Array.isArray(res.data) ? (res.data as Event[]) : [];

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
    <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 text-violet-400 text-xs font-bold uppercase tracking-wider border border-violet-500/30">
          <Sparkles className="h-3.5 w-3.5" />
          Direktori Acara & Festival
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          Jelajahi Event & Konser Spektakuler
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Temukan tiket festival musik, seminar teknologi, workshop seni, dan turnamen olahraga terbaik di Indonesia.
        </p>
      </div>

      {/* Main Search & Quick Controls Bar */}
      <div className="bg-gray-900/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-gray-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul event, artis, atau nama venue..."
              className="w-full pl-12 pr-10 py-3 bg-gray-950 border border-gray-800 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* City / Location Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[150px]">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter Kota Venue"
                className="w-full pl-10 pr-8 py-3 bg-gray-950 border border-gray-800 rounded-2xl text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
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
              <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Urutkan Event"
                className="w-full pl-10 pr-8 py-3 bg-gray-950 border border-gray-800 rounded-2xl text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
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
              className="md:hidden py-3 px-3.5 rounded-2xl border-gray-800"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Secondary Filter Bar: Categories, Date & Price Options */}
        <div className="pt-2 border-t border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                  : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                    : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Date Chips */}
          <div className="hidden lg:flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
            {[
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'TODAY', label: 'Hari Ini' },
              { id: 'THIS_WEEK', label: 'Minggu Ini' },
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as DateFilterOption)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  dateFilter === d.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Display & Reset Bar */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-500 font-medium">Filter Aktif:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-950/60 text-violet-300 border border-violet-500/30 rounded-lg">
                  Cari: &quot;{searchQuery}&quot;
                  <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-950/60 text-violet-300 border border-violet-500/30 rounded-lg">
                  Kategori: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                  <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => setSelectedCategory('All')} />
                </span>
              )}
              {selectedCity !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 rounded-lg">
                  Kota: {selectedCity}
                  <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => setSelectedCity('ALL')} />
                </span>
              )}
              {dateFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-950/60 text-blue-300 border border-blue-500/30 rounded-lg">
                  Waktu: {dateFilter}
                  <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => setDateFilter('ALL')} />
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>
          Menampilkan <strong className="text-white">{filteredEvents.length}</strong> event yang tersedia
        </span>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col gap-3 bg-gray-900 p-4 rounded-2xl border border-gray-800">
                <Skeleton className="h-44 w-full rounded-xl bg-gray-800" />
                <Skeleton className="h-5 w-3/4 bg-gray-800 mt-2" />
                <Skeleton className="h-4 w-1/2 bg-gray-800" />
              </div>
            ))
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[360px] text-center p-8 bg-gray-900/40 rounded-3xl border border-gray-800/80 space-y-4">
            <div className="p-4 bg-gray-800/60 rounded-full text-gray-500 w-16 h-16 flex items-center justify-center">
              <Search className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Tidak Ada Event yang Sesuai</h3>
              <p className="text-gray-400 text-xs max-w-md mx-auto">
                Coba gunakan kata kunci lain, pilih kategori yang berbeda, atau reset filter untuk melihat semua event.
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-violet-400 border-violet-500/40"
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
