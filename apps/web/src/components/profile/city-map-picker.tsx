"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { searchGlobalCities, type GlobalCityItem } from "@/lib/global-cities";

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json";

interface CityMapPickerProps {
  selectedCity: string;
  selectedCountry: string;
  selectedCountryCode: string;
  latitude: number;
  longitude: number;
  availableForMissions: boolean;
  onLocationChange: (loc: {
    city: string;
    country: string;
    countryCode: string;
    latitude: number;
    longitude: number;
  }) => void;
  onAvailabilityChange: (available: boolean) => void;
}

export function CityMapPicker({
  selectedCity,
  selectedCountry,
  selectedCountryCode,
  latitude,
  longitude,
  availableForMissions,
  onLocationChange,
  onAvailabilityChange,
}: CityMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState(`${selectedCity}, ${selectedCountry}`);
  const [searchResults, setSearchResults] = useState<GlobalCityItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [longitude, latitude],
      zoom: 11,
      attributionControl: false,
      interactive: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      const el = document.createElement("div");
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "9999px";
      el.style.background = "#059669";
      el.style.border = "3px solid #ffffff";
      el.style.boxShadow = "0 0 0 6px rgba(5, 150, 105, 0.3)";

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([longitude, latitude])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onLocationChange({
          city: selectedCity,
          country: selectedCountry,
          countryCode: selectedCountryCode,
          latitude: Math.round(lngLat.lat * 10000) / 10000,
          longitude: Math.round(lngLat.lng * 10000) / 10000,
        });
      });

      markerRef.current = marker;
    });

    map.on("click", (e) => {
      if (markerRef.current) {
        markerRef.current.setLngLat(e.lngLat);
        onLocationChange({
          city: selectedCity,
          country: selectedCountry,
          countryCode: selectedCountryCode,
          latitude: Math.round(e.lngLat.lat * 10000) / 10000,
          longitude: Math.round(e.lngLat.lng * 10000) / 10000,
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length > 0) {
      setSearchResults(searchGlobalCities(q));
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectCity = (cityItem: GlobalCityItem) => {
    setSearchQuery(cityItem.displayName);
    setIsDropdownOpen(false);

    onLocationChange({
      city: cityItem.city,
      country: cityItem.country,
      countryCode: cityItem.countryCode,
      latitude: cityItem.latitude,
      longitude: cityItem.longitude,
    });

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [cityItem.longitude, cityItem.latitude],
        zoom: 11,
      });
    }
    if (markerRef.current) {
      markerRef.current.setLngLat([cityItem.longitude, cityItem.latitude]);
    }
  };

  const handleDetectLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        onLocationChange({
          city: selectedCity,
          country: selectedCountry,
          countryCode: selectedCountryCode,
          latitude: lat,
          longitude: lng,
        });
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 12 });
        }
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }
      },
      (err) => {
        setGeoError(err.message || "Failed to detect current location");
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Ready-to-work toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Ready-To-Work Status
          </span>
          <span className="text-sm font-bold text-[var(--scoutx-foreground)]">
            Available for missions
          </span>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            When ON, your city location appears on the Global Scout Map for mission matching.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAvailabilityChange(!availableForMissions)}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            availableForMissions ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              availableForMissions ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Global City Search Auto-complete */}
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-foreground)]">
            Global City Search
          </label>
          <button
            type="button"
            onClick={handleDetectLocation}
            className="text-xs font-bold text-[var(--scoutx-primary)] hover:underline"
          >
            📍 Detect My Location
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search City or Country (e.g. Hanoi, Vietnam / Tokyo, Japan)"
          className="mt-1.5 w-full rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-2.5 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
        />

        {geoError && <p className="mt-1 text-xs text-red-500">{geoError}</p>}

        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] py-2 shadow-lg">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCity(item)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-semibold text-[var(--scoutx-foreground)] hover:bg-[var(--scoutx-muted)]"
              >
                <span>📍 {item.displayName}</span>
                <span className="text-[10px] text-[var(--scoutx-muted-foreground)]">
                  {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Map Picker Canvas */}
      <div className="overflow-hidden rounded-2xl border border-[var(--scoutx-border)] shadow-sm">
        <div ref={containerRef} className="h-56 w-full" />
        <div className="bg-[var(--scoutx-card)] px-4 py-2 flex items-center justify-between text-xs text-[var(--scoutx-muted-foreground)]">
          <span>📍 Selected: {selectedCity}, {selectedCountry}</span>
          <span>Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
