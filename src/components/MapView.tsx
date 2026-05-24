"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import { FastFood } from "@/lib/types";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  "poulet-frit": "#f59e0b",
  "smash-burger": "#ef4444",
  "pizza": "#f97316",
  "kebab": "#22c55e",
  "sandwich": "#a855f7",
  "crousti": "#ec4899",
  "thai": "#14b8a6",
  "asiatique": "#6366f1",
  "tacos": "#eab308",
};

function categoryIcon(categoryId: string) {
  const color = CATEGORY_COLORS[categoryId] || "#9ca3af";
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

const userIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#4ade80;border:2.5px solid #1a1a1a;box-shadow:0 0 8px rgba(74,222,128,0.4);"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MapViewProps {
  center: [number, number];
  zoom: number;
  fastfoods: FastFood[];
  userLocation: [number, number] | null;
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

export default function MapView({ center, zoom, fastfoods, userLocation }: MapViewProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const ranksByCategory = useMemo(() => {
    const groups: Record<string, FastFood[]> = {};
    fastfoods.forEach((ff) => {
      if (!groups[ff.category]) groups[ff.category] = [];
      groups[ff.category].push(ff);
    });
    const ranks: Record<string, number> = {};
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => b.elo_score - a.elo_score);
      group.forEach((ff, i) => {
        ranks[ff.id] = i + 1;
      });
    });
    return ranks;
  }, [fastfoods]);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={zoom} className="h-full w-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />
        <RecenterMap center={center} zoom={zoom} />

        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup><p className="font-medium text-sm text-center">Vous êtes ici</p></Popup>
            </Marker>
            <Circle
              center={userLocation}
              radius={500}
              pathOptions={{ color: "#4ade80", fillColor: "#4ade80", fillOpacity: 0.06, weight: 1 }}
            />
          </>
        )}

        {fastfoods.map((ff) => {
          const cat = FOOD_CATEGORIES.find((c) => c.id === ff.category);
          const rank = ranksByCategory[ff.id] || "-";
          return (
            <Marker
              key={ff.id}
              position={[ff.location.latitude, ff.location.longitude]}
              icon={categoryIcon(ff.category)}
            >
              <Popup>
                <div className="min-w-[180px] text-[#1a1a1a]">
                  <p className="font-bold text-sm">{ff.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {ff.neighborhood || ff.location.address}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <span className="font-mono font-bold">{ff.elo_score} Elo</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">#{rank} {cat?.label}</span>
                  </div>
                  <a
                    href={`/duel?category=${ff.category}`}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    Voter dans un duel →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-bd bg-bg/95 backdrop-blur-sm px-3 py-2 shadow-lg">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {FOOD_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5 text-[11px] text-mt">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: CATEGORY_COLORS[cat.id] || "#9ca3af" }}
              />
              {cat.emoji} {cat.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
