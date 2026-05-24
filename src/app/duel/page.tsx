"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RotateCcw, TrendingUp, TrendingDown, Flame, Loader2, ExternalLink, X, HelpCircle, Navigation } from "lucide-react";
import { getRandomDuel, UserLocation } from "@/lib/duel-utils";
import { calculateElo } from "@/lib/elo";
import { FastFood } from "@/lib/types";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import { useFastFoods } from "@/lib/hooks";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DuelPage() {
  const searchParams = useSearchParams();
  const { fastfoods, loading } = useFastFoods();
  const initialCat = (searchParams.get("category") as FoodCategoryId) || "all";
  const [category, setCategory] = useState<FoodCategoryId>(initialCat);
  const [duel, setDuel] = useState<[FastFood, FastFood] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ winnerId: string; delta: number } | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inspectedSpot, setInspectedSpot] = useState<FastFood | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearbyMode(true);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const activeLocation = nearbyMode ? userLocation : null;

  // Initialize duel when data loads
  useEffect(() => {
    if (!loading && fastfoods.length >= 2 && !duel) {
      setDuel(getRandomDuel(fastfoods, category, activeLocation));
    }
  }, [loading, fastfoods, duel, category, activeLocation]);

  const handleCategoryChange = (cat: FoodCategoryId) => {
    setCategory(cat);
    if (!loading && fastfoods.length >= 2) {
      setDuel(getRandomDuel(fastfoods, cat, activeLocation));
    }
  };

  const toggleNearby = () => {
    const next = !nearbyMode;
    setNearbyMode(next);
    if (!loading && fastfoods.length >= 2) {
      setDuel(getRandomDuel(fastfoods, category, next ? userLocation : null));
    }
  };

  const handleVote = useCallback(
    async (winnerId: string) => {
      if (isAnimating || !duel) return;
      setIsAnimating(true);
      setSelectedId(winnerId);

      const [a, b] = duel;
      const winner = a.id === winnerId ? a : b;
      const loser = a.id === winnerId ? b : a;

      const { winnerNewScore, loserNewScore, winnerDelta } = calculateElo(
        winner.elo_score,
        loser.elo_score
      );

      setResult({ winnerId, delta: winnerDelta });
      setTotalVotes((v) => v + 1);

      try {
        const winnerRef = doc(db, "fastfoods", winner.id);
        const loserRef = doc(db, "fastfoods", loser.id);

        await Promise.all([
          updateDoc(winnerRef, {
            elo_score: winnerNewScore,
            total_matches: winner.total_matches + 1,
            wins: winner.wins + 1,
          }),
          updateDoc(loserRef, {
            elo_score: loserNewScore,
            total_matches: loser.total_matches + 1,
            losses: loser.losses + 1,
          }),
        ]);
      } catch (error) {
        console.error("Erreur lors de la mise à jour des scores:", error);
      }

      setTimeout(() => {
        setSelectedId(null);
        setResult(null);
        setIsAnimating(false);
        setDuel(getRandomDuel(fastfoods, category, activeLocation));
      }, 1200);
    },
    [duel, fastfoods, isAnimating, category, activeLocation]
  );

  const handleSkip = useCallback(() => {
    if (isAnimating || !fastfoods.length) return;
    setDuel(getRandomDuel(fastfoods, category, activeLocation));
  }, [fastfoods, isAnimating, category, activeLocation]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-mt">
        <Loader2 className="h-8 w-8 mb-4 animate-spin text-mt/50" />
        <p className="text-sm">Recherche d'adversaires...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold font-cinzel tracking-wide">L&apos;Arène</h1>
          <span className="inline-flex items-center gap-1 rounded-md bg-sf px-2 py-0.5 text-[11px] text-mt border border-bd">
            <Flame className="h-3 w-3" />
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-sm text-mt">Qui mérite la couronne ? Cliquez sur votre favori.</p>
      </div>

      {/* Nearby toggle + Categories */}
      <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
        {userLocation && (
          <button
            onClick={toggleNearby}
            className={`category-pill flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap border border-bd ${
              nearbyMode ? "active" : "text-mt"
            }`}
          >
            <Navigation className="h-3 w-3" />
            À proximité
          </button>
        )}
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`category-pill flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap border border-bd ${
              category === cat.id ? "active" : "text-mt"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Arena */}
      {!duel ? (
        <div className="flex flex-col items-center justify-center h-64 text-mt border border-bd border-dashed rounded-xl bg-sf">
          <RotateCcw className="h-8 w-8 mb-4 opacity-50" />
          <p className="text-sm font-medium">Pas assez de restaurants dans cette catégorie !</p>
          <p className="text-xs mt-1">Il faut au moins 2 restaurants pour faire un duel.</p>
        </div>
      ) : (
        <>
          <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:gap-4">
            <div className="flex flex-col w-full flex-1">
              <DuelCard
                fastfood={duel[0]}
                isWinner={selectedId === duel[0].id}
                isLoser={selectedId !== null && selectedId !== duel[0].id}
                delta={result?.winnerId === duel[0].id ? result.delta : null}
                onClick={() => handleVote(duel[0].id)}
                side="left"
              />
              <button
                onClick={() => setInspectedSpot(duel[0])}
                className="mt-2 self-center flex items-center gap-1 text-[11px] text-mt/60 hover:text-mt transition-colors"
              >
                <HelpCircle className="h-3 w-3" />
                Je ne connais pas ce spot
              </button>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-bd bg-sf animate-vs-pulse shrink-0">
              <span className="font-mono text-sm font-bold text-mt">VS</span>
            </div>

            <div className="flex flex-col w-full flex-1">
              <DuelCard
                fastfood={duel[1]}
                isWinner={selectedId === duel[1].id}
                isLoser={selectedId !== null && selectedId !== duel[1].id}
                delta={result?.winnerId === duel[1].id ? result.delta : null}
                onClick={() => handleVote(duel[1].id)}
                side="right"
              />
              <button
                onClick={() => setInspectedSpot(duel[1])}
                className="mt-2 self-center flex items-center gap-1 text-[11px] text-mt/60 hover:text-mt transition-colors"
              >
                <HelpCircle className="h-3 w-3" />
                Je ne connais pas ce spot
              </button>
            </div>
          </div>

          {/* Skip */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSkip}
              disabled={isAnimating}
              className="inline-flex items-center gap-1.5 rounded-md border border-bd px-4 py-2 text-[13px] text-mt transition-colors hover:text-fg hover:bg-sf-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Passer
            </button>
          </div>
        </>
      )}

      {inspectedSpot && (
        <SpotModal spot={inspectedSpot} onClose={() => setInspectedSpot(null)} />
      )}
    </div>
  );
}

function DuelCard({
  fastfood,
  isWinner,
  isLoser,
  delta,
  onClick,
  side,
}: {
  fastfood: FastFood;
  isWinner: boolean;
  isLoser: boolean;
  delta: number | null;
  onClick: () => void;
  side: "left" | "right";
}) {
  const winRate =
    fastfood.total_matches > 0
      ? Math.round((fastfood.wins / fastfood.total_matches) * 100)
      : 0;

  const cat = FOOD_CATEGORIES.find((c) => c.id === fastfood.category);

  return (
    <button
      onClick={onClick}
      className={`duel-card flex flex-col w-full flex-1 rounded-xl border bg-sf p-5 text-left ${
        side === "left" ? "animate-slide-left" : "animate-slide-right"
      } ${isWinner ? "winner" : isLoser ? "loser" : "border-bd hover:border-mt transition-colors"}`}
    >
      <div className="relative h-48 w-full mb-4 shrink-0 rounded-lg overflow-hidden bg-sf-alt border border-bd-subtle">
        <img 
          src={fastfood.image_url} 
          alt={fastfood.name} 
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" 
        />
        {cat && (
          <span className="absolute top-3 right-3 text-[11px] font-medium text-bg bg-fg/90 backdrop-blur-md rounded-md px-2 py-1 shadow-sm">
            {cat.emoji} {cat.label}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold leading-tight">{fastfood.name}</h3>
      <p className="mt-1 text-[12px] text-mt">
        {fastfood.neighborhood || fastfood.location.address}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: "Elo", value: fastfood.elo_score },
          { label: "Matchs", value: fastfood.total_matches },
          { label: "Win%", value: `${winRate}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-md bg-sf-alt border border-bd-subtle px-2 py-1.5 text-center">
            <span className="block text-sm font-bold font-mono">{s.value}</span>
            <span className="text-[10px] text-mt uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {delta !== null && (
        <div className="mt-3 flex items-center justify-center gap-1 animate-elo-flash">
          <TrendingUp className="h-3.5 w-3.5 text-ok" />
          <span className="font-mono text-xs font-bold text-ok">+{delta}</span>
        </div>
      )}
      {isLoser && (
        <div className="mt-3 flex items-center justify-center gap-1 animate-elo-flash">
          <TrendingDown className="h-3.5 w-3.5 text-err" />
          <span className="font-mono text-xs font-bold text-err">Défaite</span>
        </div>
      )}
    </button>
  );
}

function SpotModal({ spot, onClose }: { spot: FastFood; onClose: () => void }) {
  const cat = FOOD_CATEGORIES.find((c) => c.id === spot.category);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.location.address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-bd bg-bg overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {spot.image_url && (
          <div className="relative h-56 w-full">
            <img src={spot.image_url} alt={spot.name} className="h-full w-full object-cover" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
            {cat && (
              <span className="absolute bottom-3 left-3 text-[11px] font-medium text-bg bg-fg/90 backdrop-blur-md rounded-md px-2 py-1">
                {cat.emoji} {cat.label}
              </span>
            )}
          </div>
        )}
        <div className="p-5 space-y-3">
          <div>
            <h2 className="text-xl font-bold">{spot.name}</h2>
            <p className="text-sm text-mt mt-0.5">{spot.neighborhood}</p>
          </div>
          {spot.tagline && (
            <p className="text-sm text-mt italic">{spot.tagline}</p>
          )}
          <p className="text-[13px] text-mt">{spot.location.address}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir sur Google Maps
          </a>
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-lg border border-bd bg-sf px-4 py-2.5 text-sm font-medium text-fg hover:bg-sf-hover transition-colors"
          >
            Retour au duel
          </button>
        </div>
      </div>
    </div>
  );
}
