"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import { FastFood } from "@/lib/types";
import { FOOD_CATEGORIES } from "@/lib/categories";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#4ade80;border:2.5px solid #1a1a1a;box-shadow:0 0 8px rgba(74,222,128,0.4);"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

L.Marker.prototype.options.icon = defaultIcon;

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

  return (
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
        return (
          <Marker key={ff.id} position={[ff.location.latitude, ff.location.longitude]} icon={defaultIcon}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-[10px] text-muted uppercase tracking-wider font-mono">
                  {ff.chain} {cat ? cat.emoji : ""}
                </p>
                <p className="font-semibold text-sm mt-0.5">{ff.name}</p>
                <p className="text-[11px] text-muted mt-1">{ff.location.address}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="font-mono font-bold">{ff.elo_score} Elo</span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{ff.total_matches} matchs</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
