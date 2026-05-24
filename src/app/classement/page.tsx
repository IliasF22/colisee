"use client";

import { useState, useMemo, useEffect } from "react";
import { Trophy, Search, ChevronUp, ChevronDown, Minus, Loader2, MapPin, Navigation } from "lucide-react";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import { useFastFoods } from "@/lib/hooks";
import { FastFood } from "@/lib/types";

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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-bd">
        <div className="grid grid-cols-[40px_1fr_72px_72px_72px] items-center gap-2 border-b border-bd bg-sf-alt px-4 py-2.5 text-[11px] font-medium text-mt uppercase tracking-wider">
          <span>Rang</span>
          <span>Fast-food</span>
          <span className="text-right">Score</span>
          <span className="text-right hidden sm:block">Votes</span>
          <span className="text-right">Win%</span>
        </div>

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
          const winRate = ff.total_matches > 0 ? Math.round((ff.wins / ff.total_matches) * 100) : 0;
          const trend = ff.elo_score >= 1530 ? "up" : ff.elo_score <= 1450 ? "down" : "flat";
          const cat = FOOD_CATEGORIES.find((c) => c.id === ff.category);

          return (
            <div
              key={ff.id}
              className="lb-row grid grid-cols-[40px_1fr_72px_72px_72px] items-center gap-2 border-b border-bd-subtle px-4 py-3 last:border-b-0"
            >
              <span className={`font-mono text-sm font-bold ${
                rank === 1 ? "text-gld" : rank === 2 ? "text-slv" : rank === 3 ? "text-brz" : "text-mt"
              }`}>
                {rank}
              </span>

              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sf-alt border border-bd-subtle font-mono text-xs font-bold text-mt">
                  {ff.chain.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">{ff.name}</p>
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
              </div>

              <div className="flex items-center justify-end gap-1">
                {trend === "up" && <ChevronUp className="h-3 w-3 text-ok" />}
                {trend === "down" && <ChevronDown className="h-3 w-3 text-err" />}
                {trend === "flat" && <Minus className="h-3 w-3 text-mt/30" />}
                <span className="font-mono text-[13px] font-bold">{ff.elo_score}</span>
              </div>

              <span className="text-right font-mono text-[13px] text-mt hidden sm:block">
                {ff.total_matches.toLocaleString()}
              </span>

              <span className="text-right font-mono text-[13px]">{winRate}%</span>
            </div>
          );
        })
        )}
        </div>
      </div>
    </div>
  );
}
