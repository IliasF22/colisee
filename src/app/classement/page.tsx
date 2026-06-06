"use client";

import { useState, useMemo, useEffect } from "react";
import { Trophy, Search, Loader2, MapPin, Navigation, Store, ChevronRight, X, ExternalLink } from "lucide-react";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import { useFastFoods } from "@/lib/hooks";
import { FastFood } from "@/lib/types";

/** Niveau de prix affiché (1..3). Défaut €€ (10-20 €) quand Google ne l'indique pas. */
function priceLvl(ff: FastFood): number {
  const lvl = ff.price_level ?? 0;
  return lvl > 0 ? Math.min(lvl, 3) : 2;
}

function extractCity(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2];
    const withoutPostal = candidate.replace(/^\d{4,5}\s*/, "");
    if (withoutPostal) return withoutPostal;
  }
  return parts[0] || "Inconnu";
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type ViewMode = "category" | "city" | "nearby";

export default function ClassementPage() {
  const { fastfoods, loading } = useFastFoods();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<FoodCategoryId>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAsked, setLocationAsked] = useState(false);
  const [selected, setSelected] = useState<FastFood | null>(null);

  useEffect(() => {
    if (locationAsked || typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocationAsked(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setViewMode("nearby");
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, [locationAsked]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    fastfoods.forEach((ff) => {
      if (ff.location?.address) citySet.add(extractCity(ff.location.address));
    });
    return Array.from(citySet).sort();
  }, [fastfoods]);

  const filtered = useMemo(() => {
    let list = fastfoods;
    if (viewMode === "category" && category !== "all") {
      list = list.filter((ff) => ff.category === category);
    }
    if (viewMode === "city" && selectedCity !== "all") {
      list = list.filter((ff) => extractCity(ff.location?.address || "") === selectedCity);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((ff) =>
        ff.name.toLowerCase().includes(q) ||
        ff.chain.toLowerCase().includes(q) ||
        (ff.neighborhood || "").toLowerCase().includes(q) ||
        ff.category.toLowerCase().includes(q)
      );
    }
    if (viewMode === "nearby" && userLocation) {
      return [...list].sort((a, b) => {
        const dA = distanceKm(userLocation.lat, userLocation.lng, a.location.latitude, a.location.longitude);
        const dB = distanceKm(userLocation.lat, userLocation.lng, b.location.latitude, b.location.longitude);
        return dA - dB;
      });
    }
    return [...list].sort((a, b) => b.elo_score - a.elo_score);
  }, [searchQuery, category, selectedCity, viewMode, fastfoods, userLocation]);

  const activeCat = FOOD_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Mode Toggle + Filters Sticky Sub-header */}
      <div className="sticky top-14 z-40 border-b border-bd bg-bg/95 backdrop-blur-md px-5 py-2.5 space-y-2">
        {/* Toggle Par catégorie / Par ville */}
        <div className="flex items-center gap-1 rounded-lg bg-sf border border-bd p-0.5 w-fit">
          {userLocation && (
            <button
              onClick={() => setViewMode("nearby")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                viewMode === "nearby" ? "bg-bg text-fg shadow-sm" : "text-mt"
              }`}
            >
              <Navigation className="h-3.5 w-3.5" /> À proximité
            </button>
          )}
          <button
            onClick={() => setViewMode("category")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              viewMode === "category" ? "bg-bg text-fg shadow-sm" : "text-mt"
            }`}
          >
            <span>🏛️</span> Par catégorie
          </button>
          <button
            onClick={() => setViewMode("city")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              viewMode === "city" ? "bg-bg text-fg shadow-sm" : "text-mt"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" /> Par ville
          </button>
        </div>

        {/* Category pills or City pills (hidden in nearby mode) */}
        {viewMode !== "nearby" && <div className="flex items-center gap-1.5 overflow-x-auto">
          {viewMode === "category" ? (
            FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`category-pill flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap border border-bd ${
                  category === cat.id ? "active" : "text-mt"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))
          ) : (
            <>
              <button
                onClick={() => setSelectedCity("all")}
                className={`category-pill flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap border border-bd ${
                  selectedCity === "all" ? "active" : "text-mt"
                }`}
              >
                <MapPin className="h-3 w-3" /> Toutes
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`category-pill flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap border border-bd ${
                    selectedCity === city ? "active" : "text-mt"
                  }`}
                >
                  <MapPin className="h-3 w-3" /> {city}
                </button>
              ))}
            </>
          )}
        </div>}
      </div>

      <div className="px-5 py-6">
        {/* Header */}
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold font-cinzel tracking-wide">Classement</h1>
          {viewMode === "nearby" && (
            <span className="rounded-md bg-sf border border-bd px-2 py-0.5 text-[11px] text-mt">
              📍 À proximité
            </span>
          )}
          {viewMode === "category" && activeCat && (
            <span className="rounded-md bg-sf border border-bd px-2 py-0.5 text-[11px] text-mt">
              {activeCat.emoji} {activeCat.label}
            </span>
          )}
          {viewMode === "city" && selectedCity !== "all" && (
            <span className="rounded-md bg-sf border border-bd px-2 py-0.5 text-[11px] text-mt">
              📍 {selectedCity}
            </span>
          )}
        </div>
        <p className="text-sm text-mt mb-6">
          {viewMode === "nearby" ? "Trié par distance" : "Classement par score Elo"} · {filtered.length} fast-food{filtered.length > 1 ? "s" : ""}
        </p>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mt" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-bd bg-sf py-2 pl-9 pr-3 text-[13px] text-fg outline-none transition-colors focus:border-mt placeholder:text-mt/50"
        />
      </div>

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-bd">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-mt">
            <Loader2 className="h-6 w-6 mb-2 animate-spin text-mt/50" />
            <p className="text-sm">Chargement du classement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-mt">
            <Trophy className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-sm">Aucun résultat</p>
          </div>
        ) : (
          filtered.map((ff, i) => {
          const rank = i + 1;
          const cat = FOOD_CATEGORIES.find((c) => c.id === ff.category);

          return (
            <button
              key={ff.id}
              onClick={() => setSelected(ff)}
              className="lb-row w-full flex items-center gap-2.5 border-b border-bd-subtle px-4 py-3 last:border-b-0 text-left"
            >
              <span className={`w-6 shrink-0 text-center font-mono text-sm font-bold ${
                rank === 1 ? "text-gld" : rank === 2 ? "text-slv" : rank === 3 ? "text-brz" : "text-mt"
              }`}>
                {rank}
              </span>

              <div
                className="flex h-8 min-w-9 shrink-0 items-center justify-center rounded-md bg-sf-alt border border-bd-subtle px-1.5 font-mono text-[11px] font-bold"
                title={`Niveau de prix : ${"€".repeat(priceLvl(ff))}`}
              >
                <span className="text-gld">{"€".repeat(priceLvl(ff))}</span>
                <span className="text-mt/25">{"€".repeat(3 - priceLvl(ff))}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate flex items-center gap-1.5">
                  <span className="truncate">{ff.name}</span>
                  {ff.is_franchise && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-gld px-1 py-px text-[10px] font-semibold text-black">
                      <Store className="h-2.5 w-2.5" /> Franchise
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-mt truncate">
                  {ff.neighborhood || ff.chain}
                  {cat && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-sf border border-bd-subtle px-1 py-px text-[10px]">
                      {cat.emoji} {viewMode !== "category" && cat.label}
                    </span>
                  )}
                  {viewMode === "nearby" && userLocation && (
                    <span className="ml-1.5 text-[10px] text-mt/70">
                      {distanceKm(userLocation.lat, userLocation.lng, ff.location.latitude, ff.location.longitude).toFixed(1)} km
                    </span>
                  )}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-mt/40" />
            </button>
          );
        })
        )}
        </div>
      </div>

      {selected && (
        <SpotModal spot={selected} userLocation={userLocation} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SpotModal({
  spot,
  userLocation,
  onClose,
}: {
  spot: FastFood;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const winRate = spot.total_matches > 0 ? Math.round((spot.wins / spot.total_matches) * 100) : 0;
  const cat = FOOD_CATEGORIES.find((c) => c.id === spot.category);
  const lvl = priceLvl(spot);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${spot.name} ${spot.location?.address || ""}`
  )}`;
  const dist =
    userLocation && spot.location
      ? distanceKm(userLocation.lat, userLocation.lng, spot.location.latitude, spot.location.longitude)
      : null;

  const stats = [
    { label: "Score Elo", value: spot.elo_score },
    { label: "Win %", value: `${winRate}%` },
    { label: "Votes", value: spot.total_matches },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-bd bg-bg overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {spot.image_url && (
          <div className="relative h-48 w-full">
            <img src={spot.image_url} alt={spot.name} className="h-full w-full object-cover" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
            {spot.is_franchise && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-gld px-2 py-1 text-[11px] font-semibold text-black shadow-sm">
                <Store className="h-3 w-3" /> Franchise
              </span>
            )}
            {cat && (
              <span className="absolute bottom-3 left-3 rounded-md bg-fg/90 px-2 py-1 text-[11px] font-medium text-bg backdrop-blur-md">
                {cat.emoji} {cat.label}
              </span>
            )}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold leading-tight">{spot.name}</h2>
            <p className="mt-1 text-sm text-mt">
              {spot.neighborhood}
              {dist !== null && <span className="text-mt/70"> · {dist.toFixed(1)} km</span>}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-sf border border-bd-subtle px-2 py-2 text-center">
                <span className="block text-base font-bold font-mono">{s.value}</span>
                <span className="text-[10px] text-mt uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-sf border border-bd-subtle px-3 py-2">
            <span className="text-[12px] text-mt">Niveau de prix</span>
            <span className="font-mono text-sm font-bold">
              <span className="text-gld">{"€".repeat(lvl)}</span>
              <span className="text-mt/25">{"€".repeat(3 - lvl)}</span>
            </span>
          </div>

          {spot.location?.address && <p className="text-[13px] text-mt">{spot.location.address}</p>}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-transform hover:scale-[1.02]"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir sur Google Maps
          </a>
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-lg border border-bd px-4 py-2 text-sm font-medium text-mt hover:bg-sf-hover hover:text-fg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
