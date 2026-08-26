"use client";

import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { mockLocations } from "@scoutx/mock-data";

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json";

export function WorldPreviewMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [20, 25],
      zoom: 1.2,
      attributionControl: false,
      interactive: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      markersRef.current = mockLocations.map((location) => {
        const element = document.createElement("div");
        element.className = "scoutx-map-marker";
        element.style.width = "12px";
        element.style.height = "12px";
        element.style.borderRadius = "9999px";
        element.style.background = "#f4fbf7";
        element.style.border = "2px solid #0f6b4c";
        element.style.boxShadow = "0 0 0 4px rgba(15, 107, 76, 0.25)";

        return new maplibregl.Marker({ element })
          .setLngLat([location.coordinates.longitude, location.coordinates.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
              `<strong>${location.name}</strong><br/><span>${location.city}, ${location.country}</span>`,
            ),
          )
          .addTo(map);
      });
    });

    return () => {
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full min-h-[320px] w-full sm:min-h-[420px]" />;
}
