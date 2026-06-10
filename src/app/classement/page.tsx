"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useLocationContext } from "@/lib/LocationContext";
import { Trophy, Search, Loader2, MapPin, Navigation, Store, ChevronRight, X, ExternalLink, Lock, Swords, PartyPopper } from "lucide-react";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import { useFastFoods } from "@/lib/hooks";
import { FastFood } from "@/lib/types";
import { cityFromAddress } from "@/lib/zones";
import { getDuelsDone, consumeJustUnlocked, REQUIRED_DUELS } from "@/lib/engagement";

/** Niveau de prix affiché (1..3). Défaut €€ (10-20 €) quand Google ne l'indique pas. */
function priceLvl(ff: FastFood): number {
  const lvl = ff.price_level ?? 0;
  return lvl > 0 ? Math.min(lvl, 3) : 2;
}

/** Ville robuste d'un resto (réutilise le parseur de zones.ts). */
function cityOf(ff: FastFood): string {
  return cityFromAddress(ff.location?.address || "");
}

/** Département (2 chiffres) depuis le code postal de l'adresse. */
function deptOf(ff: FastFood): string | null {
  const m = (ff.location?.address || "").match(/\b(\d{5})\b/);
  return m ? m[1].slice(0, 2) : null;
}

/** Normalise pour comparer/chercher sans accents ni casse. */
function norm(s: string): string {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Rayon (km) du bloc « autour de la ville ». */
const NEARBY_RADIUS_KM = 15;
const NEARBY_MAX = 40;

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
  const [cityQuery, setCityQuery] = useState("");
  const [pick, setPick] = useState<{ kind: "city" | "dept"; label: string; value: string } | null>(null);
  const { userLocation } = useLocationContext();
  const [selected, setSelected] = useState<FastFood | null>(null);
  const [duelsDone, setDuelsDone] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const nearbySwitchedRef = useRef(false);

  useEffect(() => {
    setDuelsDone(getDuelsDone());
    if (consumeJustUnlocked()) {
      setJustUnlocked(true);
      const t = setTimeout(() => setJustUnlocked(false), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // Quand une localisation (ville ou GPS) est définie, on bascule une fois en « À proximité ».
  useEffect(() => {
    if (userLocation && !nearbySwitchedRef.current) {
      nearbySwitchedRef.current = true;
      setViewMode("nearby");
    }
  }, [userLocation]);

  // Villes connues avec leur nombre d'adresses (pour les suggestions / chips).
  const cityList = useMemo(() => {
    const counts = new Map<string, number>();
    fastfoods.forEach((ff) => {
      if (!ff.location?.address) return;
      const c = cityOf(ff);
      if (c && c !== "Inconnu") counts.set(c, (counts.get(c) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [fastfoods]);

  // Suggestions selon la saisie (ville par nom, ou département par n°).
  const suggestions = useMemo(() => {
    const q = norm(cityQuery);
    if (!q || (pick && norm(pick.label) === q)) return [];
    const out: { kind: "city" | "dept"; label: string; value: string }[] = [];
    // Département (2-3 chiffres)
    if (/^\d{2,3}$/.test(q)) {
      const code = q.slice(0, 2);
      const n = fastfoods.filter((ff) => deptOf(ff) === code).length;
      if (n > 0) out.push({ kind: "dept", label: `Département ${code}`, value: code });
    }
    for (const c of cityList) {
      if (norm(c.name).includes(q)) out.push({ kind: "city", label: c.name, value: c.name });
      if (out.length >= 8) break;
    }
    return out.slice(0, 8);
  }, [cityQuery, cityList, fastfoods, pick]);

  // Deux blocs pour la vue « Par ville » : dans la ville/dépt + autour.
  const cityBlocks = useMemo(() => {
    if (viewMode !== "city" || !pick) return null;
    const inSet =
      pick.kind === "city"
        ? fastfoods.filter((ff) => cityOf(ff) === pick.value)
        : fastfoods.filter((ff) => deptOf(ff) === pick.value);
    if (inSet.length === 0) return { inSet: [], nearby: [], center: null as null | { lat: number; lng: number } };

    const center = {
      lat: inSet.reduce((s, f) => s + f.location.latitude, 0) / inSet.length,
      lng: inSet.reduce((s, f) => s + f.location.longitude, 0) / inSet.length,
    };
    const inIds = new Set(inSet.map((f) => f.id));
    const nearby = fastfoods
      .filter((ff) => !inIds.has(ff.id))
      .map((ff) => ({ ff, d: distanceKm(center.lat, center.lng, ff.location.latitude, ff.location.longitude) }))
      .filter((x) => x.d <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.d - b.d)
      .slice(0, NEARBY_MAX);

    return {
      inSet: [...inSet].sort((a, b) => b.elo_score - a.elo_score),
      nearby,
      center,
    };
  }, [viewMode, pick, fastfoods]);

  const filtered = useMemo(() => {
    let list = fastfoods;
    if (viewMode === "category" && category !== "all") {
      list = list.filter((ff) => ff.category === category);
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
  }, [searchQuery, category, viewMode, fastfoods, userLocation]);

  const activeCat = FOOD_CATEGORIES.find((c) => c.id === category);

  // Gate engagement : le podium (top 3) est flouté tant que < 3 duels.
  const remaining = Math.max(0, REQUIRED_DUELS - duelsDone);
  const locked = viewMode !== "city" && duelsDone < REQUIRED_DUELS && !searchQuery && filtered.length > 3;

  const pickCity = (s: { kind: "city" | "dept"; label: string; value: string }) => {
    setPick(s);
    setCityQuery(s.label);
  };

  const renderRow = (
    ff: FastFood,
    i: number,
    opt?: { refCoord?: { lat: number; lng: number }; showCity?: boolean },
  ) => {
    const rank = i + 1;
    const cat = FOOD_CATEGORIES.find((c) => c.id === ff.category);
    const refCoord = opt?.refCoord ?? (viewMode === "nearby" ? userLocation : null);
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
            {opt?.showCity ? cityOf(ff) : ff.neighborhood || ff.chain}
            {cat && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-sf border border-bd-subtle px-1 py-px text-[10px]">
                {cat.emoji} {viewMode !== "category" && cat.label}
              </span>
            )}
            {refCoord && (
              <span className="ml-1.5 text-[10px] text-mt/70">
                {distanceKm(refCoord.lat, refCoord.lng, ff.location.latitude, ff.location.longitude).toFixed(1)} km
              </span>
            )}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-mt/40" />
      </button>
    );
  };

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

        {/* Category pills (catégorie) */}
        {viewMode === "category" && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {FOOD_CATEGORIES.map((cat) => (
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
            ))}
          </div>
        )}

        {/* Recherche de ville / département (vue ville) */}
        {viewMode === "city" && (
          <div className="space-y-2">
            <div className="relative max-w-sm">
              <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mt" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => { setCityQuery(e.target.value); setPick(null); }}
                placeholder="Ta ville ou ton département (ex : Créteil, 93)"
                className="w-full rounded-lg border border-bd bg-sf py-2 pl-9 pr-8 text-[13px] text-fg outline-none transition-colors focus:border-mt placeholder:text-mt/50"
              />
              {cityQuery && (
                <button
                  onClick={() => { setCityQuery(""); setPick(null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-mt hover:bg-sf-hover hover:text-fg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-bd bg-bg shadow-xl">
                  {suggestions.map((s) => (
                    <button
                      key={`${s.kind}:${s.value}`}
                      onClick={() => pickCity(s)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-fg hover:bg-sf-hover"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gld" />
                      {s.label}
                      {s.kind === "dept" && <span className="text-[11px] text-mt">département</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!pick && cityList.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {cityList.slice(0, 10).map((c) => (
                  <button
                    key={c.name}
                    onClick={() => pickCity({ kind: "city", label: c.name, value: c.name })}
                    className="category-pill flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap border border-bd text-mt"
                  >
                    <MapPin className="h-3 w-3" /> {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
          {viewMode === "city" && pick && (
            <span className="rounded-md bg-sf border border-bd px-2 py-0.5 text-[11px] text-mt">
              📍 {pick.label}
            </span>
          )}
        </div>
        <p className="text-sm text-mt mb-6">
          {viewMode === "city"
            ? pick
              ? `${cityBlocks?.inSet.length ?? 0} fast-food${(cityBlocks?.inSet.length ?? 0) > 1 ? "s" : ""} à ${pick.label}`
              : "Tape ta ville ou ton département"
            : `${viewMode === "nearby" ? "Trié par distance" : "Classement par score Elo"} · ${filtered.length} fast-food${filtered.length > 1 ? "s" : ""}`}
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
      {viewMode === "city" ? (
        loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-bd py-12 text-mt">
            <Loader2 className="h-6 w-6 mb-2 animate-spin text-mt/50" />
            <p className="text-sm">Chargement du classement...</p>
          </div>
        ) : !pick ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-bd border-dashed py-12 text-mt">
            <MapPin className="h-6 w-6 mb-2 opacity-40" />
            <p className="text-sm">Choisis ta ville (ou ton département) pour voir son classement</p>
            <p className="text-xs mt-1 text-mt/70">…et les fast-foods autour.</p>
          </div>
        ) : !cityBlocks || cityBlocks.inSet.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-bd py-12 text-mt">
            <Trophy className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-sm">Aucun fast-food trouvé pour « {pick.label} »</p>
          </div>
        ) : (
          (() => {
            const q = norm(searchQuery);
            const inSet = q ? cityBlocks.inSet.filter((ff) => norm(ff.name).includes(q) || norm(ff.chain).includes(q)) : cityBlocks.inSet;
            const nearby = q ? cityBlocks.nearby.filter((x) => norm(x.ff.name).includes(q) || norm(x.ff.chain).includes(q)) : cityBlocks.nearby;
            return (
              <>
                <section>
                  <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-fg">
                    🏛️ À {pick.label}
                    <span className="text-[12px] font-normal text-mt">({inSet.length})</span>
                  </h2>
                  <div className="overflow-hidden rounded-xl border border-bd">
                    {inSet.length > 0 ? (
                      inSet.map((ff, i) => renderRow(ff, i))
                    ) : (
                      <p className="px-4 py-6 text-center text-sm text-mt">Aucun résultat pour cette recherche.</p>
                    )}
                  </div>
                </section>

                {nearby.length > 0 && (
                  <section className="mt-6">
                    <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-fg">
                      📍 Autour de {pick.label}
                      <span className="text-[12px] font-normal text-mt">(≤ {NEARBY_RADIUS_KM} km)</span>
                    </h2>
                    <div className="overflow-hidden rounded-xl border border-bd">
                      {nearby.map((x, i) =>
                        renderRow(x.ff, i, { refCoord: cityBlocks.center ?? undefined, showCity: true }),
                      )}
                    </div>
                  </section>
                )}
              </>
            );
          })()
        )
      ) : (
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
          ) : locked ? (
            <>
              {/* Podium flouté à débloquer */}
              <div className="relative">
                <div className="blur-[7px] pointer-events-none select-none" aria-hidden>
                  {filtered.slice(0, 3).map((ff, i) => renderRow(ff, i))}
                </div>
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                  <Lock className="h-6 w-6 text-gld" />
                  <p className="text-sm font-bold">🏆 Débloque le podium</p>
                  <p className="text-xs text-mt">
                    Fais {remaining} duel{remaining > 1 ? "s" : ""} pour révéler le top 3
                  </p>
                  <Link
                    href="/duel"
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-gld px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
                  >
                    <Swords className="h-4 w-4" /> Faire un duel
                  </Link>
                </div>
              </div>
              {filtered.slice(3).map((ff, i) => renderRow(ff, i + 3))}
            </>
          ) : (
            filtered.map((ff, i) => renderRow(ff, i))
          )}
        </div>
      )}
      </div>

      {justUnlocked && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full border border-gld/50 bg-gld/15 px-4 py-2 text-sm font-semibold text-gld shadow-xl backdrop-blur-md animate-fade-in-scale">
            <PartyPopper className="h-4 w-4" /> Podium débloqué !
          </div>
        </div>
      )}

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
