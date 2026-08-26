"use client";

import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { ScoutMapLocationCluster } from "@/app/api/scouts/map/route";

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
      center: [105, 15],
      zoom: 2,
      attributionControl: false,
      interactive: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const renderScoutMarkers = async () => {
      try {
        const res = await fetch("/api/scouts/map", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        const locations: ScoutMapLocationCluster[] = data.locations || [];

        // Clear existing markers
        for (const marker of markersRef.current) {
          marker.remove();
        }
        markersRef.current = [];

        for (const loc of locations) {
          const element = document.createElement("div");
          element.className = "scoutx-live-map-marker group";
          element.style.width = "16px";
          element.style.height = "16px";
          element.style.borderRadius = "9999px";
          element.style.background = "#10b981";
          element.style.border = "2px solid #ffffff";
          element.style.boxShadow = "0 0 0 6px rgba(16, 185, 129, 0.35), 0 2px 10px rgba(0,0,0,0.3)";
          element.style.cursor = "pointer";

          const badgeCount = document.createElement("span");
          badgeCount.innerText = String(loc.availableScoutCount);
          badgeCount.style.display = "flex";
          badgeCount.style.alignItems = "center";
          badgeCount.style.justifyContent = "center";
          badgeCount.style.position = "absolute";
          badgeCount.style.top = "-8px";
          badgeCount.style.right = "-8px";
          badgeCount.style.background = "#059669";
          badgeCount.style.color = "#ffffff";
          badgeCount.style.fontSize = "9px";
          badgeCount.style.fontWeight = "bold";
          badgeCount.style.borderRadius = "9999px";
          badgeCount.style.width = "16px";
          badgeCount.style.height = "16px";
          element.appendChild(badgeCount);

          const marker = new maplibregl.Marker({ element })
            .setLngLat([loc.longitude, loc.latitude])
            .setPopup(
              new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
                `<div style="font-family: sans-serif; padding: 4px;">
                  <strong style="color: #059669; font-size: 13px;">⚡ ${loc.availableScoutCount} Scout(s) Available</strong>
                  <br/>
                  <span style="color: #374151; font-size: 11px; font-weight: 600;">📍 ${loc.city}, ${loc.country}</span>
                </div>`,
              ),
            )
            .addTo(map);

          markersRef.current.push(marker);
        }
      } catch (err) {
        console.error("Failed to load map markers:", err);
      }
    };

    map.on("load", () => {
      renderScoutMarkers();
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
