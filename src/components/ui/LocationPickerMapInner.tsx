'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';

export interface SelectedLocation {
  name: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
}

export interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  initialName?: string;
  initialAddress?: string;
  onLocationSelect: (location: SelectedLocation) => void;
  className?: string;
  height?: string;
}

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    building?: string;
    amenity?: string;
  };
}

export function LocationPickerMapInner({
  initialLat = -6.2088,
  initialLng = 106.8456,
  initialName = '',
  initialAddress = '',
  onLocationSelect,
  className = '',
  height = '360px',
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [currentLoc, setCurrentLoc] = useState<SelectedLocation>({
    name: initialName,
    address: initialAddress,
    city: 'Jakarta',
    province: 'DKI Jakarta',
    latitude: initialLat,
    longitude: initialLng,
  });

  // Helper to extract clean city/state from Nominatim address
  const parseNominatimAddress = (item: NominatimSearchResult) => {
    const addr = item.address || {};
    const name = item.name || item.display_name.split(',')[0] || '';
    const road = addr.road || addr.suburb || '';
    const city = addr.city || addr.town || addr.county || addr.village || 'Jakarta';
    const province = addr.state || 'DKI Jakarta';
    const fullAddress = item.display_name;

    return {
      name: name.trim(),
      address: road ? `${road}, ${city}` : fullAddress,
      city,
      province,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };
  };

  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Reverse geocode coordinate into address
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        setIsReverseGeocoding(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`,
          {
            headers: {
              'Accept-Language': 'id',
            },
          }
        );
        if (!res.ok) return;
        const data: NominatimSearchResult = await res.json();
        const parsed = parseNominatimAddress(data);

        setCurrentLoc(parsed);
        onLocationSelectRef.current?.(parsed);
      } catch (err) {
        console.warn('Reverse geocoding error:', err);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    []
  );

  const reverseGeocodeRef = useRef(reverseGeocode);
  useEffect(() => {
    reverseGeocodeRef.current = reverseGeocode;
  }, [reverseGeocode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Custom elegant modern Pin icon
      const customPinIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <div style="
              width: 38px;
              height: 38px;
              background-color: #09090b;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              border: 2.5px solid #ffffff;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div style="
              width: 8px;
              height: 8px;
              background-color: #09090b;
              border-radius: 9999px;
              margin-top: -3px;
              opacity: 0.6;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false,
      });

      // Add Zoom Control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Standard OpenStreetMap Tile Layer (100% Free, No API Key Required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocodeRef.current(pos.lat, pos.lng);
      });

      // Click anywhere on map to move marker
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        reverseGeocodeRef.current(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Fix container size on initial mount safely
      resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current && mapContainerRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {
            // safely ignore if unmounted
          }
        }
      }, 250);
    } else {
      try {
        mapInstanceRef.current.setView([initialLat, initialLng], mapInstanceRef.current.getZoom());
        markerRef.current?.setLatLng([initialLat, initialLng]);
      } catch {
        // safely ignore
      }
    }

    return () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // safely ignore
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [initialLat, initialLng]);

  // Handle place search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=id&limit=5`,
        {
          headers: {
            'Accept-Language': 'id',
          },
        }
      );
      if (res.ok) {
        const results: NominatimSearchResult[] = await res.json();
        setSearchResults(results);
        setShowDropdown(true);
      }
    } catch (err) {
      console.warn('Place search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search dropdown
  const handleSelectResult = (item: NominatimSearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      markerRef.current.setLatLng([lat, lng]);
    }

    const parsed = parseNominatimAddress(item);
    setCurrentLoc(parsed);
    onLocationSelect(parsed);
    setShowDropdown(false);
    setSearchQuery(parsed.name || item.display_name.split(',')[0]);
  };

  // Get current user GPS location
  const handleCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
          }
          reverseGeocode(lat, lng);
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }
  };

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative z-20">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-zinc-400 pointer-events-none">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-zinc-950" /> : <Search className="h-4 w-4" />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!showDropdown && searchResults.length > 0) setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
            placeholder="Ketik nama gedung, tempat, atau jalan di peta..."
            className="w-full pl-11 pr-24 py-3 bg-white rounded-full text-xs sm:text-sm font-medium text-zinc-950 placeholder-zinc-400 border-0 shadow-none focus:outline-none focus:ring-2 focus:ring-zinc-950/10 transition-all"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={handleCurrentLocation}
              title="Gunakan Lokasi Saya Saat Ini"
              className="p-2 text-zinc-500 hover:text-zinc-950 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer border-0 shadow-none"
            >
              <Navigation className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              disabled={isSearching || !searchQuery.trim()}
              className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-full text-xs font-bold transition-colors cursor-pointer border-0 shadow-none"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Search Results Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl p-2 shadow-xl border border-zinc-100 z-50 max-h-60 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-100 transition-colors flex items-start gap-2.5 cursor-pointer border-0"
              >
                <MapPin className="h-4 w-4 text-zinc-950 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-950 truncate">
                    {item.name || item.display_name.split(',')[0]}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">{item.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-100 z-10 border-0 shadow-none" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Instruction / Loading Hint */}
        <div className="absolute top-3 left-3 z-[400] bg-zinc-950/80 backdrop-blur-xs text-white text-[10px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          {isReverseGeocoding ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Membaca alamat koordinat...</span>
            </>
          ) : (
            <>
              <MapPin className="h-3 w-3 text-white" />
              <span>Klik pada peta atau geser pin untuk atur titik</span>
            </>
          )}
        </div>
      </div>

      {/* Selected Location Summary Box */}
      {currentLoc.name || currentLoc.address ? (
        <div className="p-3.5 bg-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-0 shadow-none">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-zinc-950 truncate">
              {currentLoc.name || 'Lokasi Terpilih'}
            </p>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
              {currentLoc.address || `${currentLoc.city}, ${currentLoc.province}`}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full">
            <span>Lat: {currentLoc.latitude.toFixed(4)}</span>
            <span>Lng: {currentLoc.longitude.toFixed(4)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
