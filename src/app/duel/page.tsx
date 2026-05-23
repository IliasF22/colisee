"use client";

import { useState, useCallback, useEffect } from "react";
import { RotateCcw, TrendingUp, TrendingDown, Flame, Loader2 } from "lucide-react";
import { getRandomDuel } from "@/lib/duel-utils";
import { calculateElo } from "@/lib/elo";
import { FastFood } from "@/lib/types";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import { useFastFoods } from "@/lib/hooks";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DuelPage() {
  const { fastfoods, loading } = useFastFoods();
  const [category, setCategory] = useState<FoodCategoryId>("all");
  const [duel, setDuel] = useState<[FastFood, FastFood] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ winnerId: string; delta: number } | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize duel when data loads
  useEffect(() => {
    if (!loading && fastfoods.length >= 2 && !duel) {
      setDuel(getRandomDuel(fastfoods, category));
    }
  }, [loading, fastfoods, duel, category]);

  const handleCategoryChange = (cat: FoodCategoryId) => {
    setCategory(cat);
    if (!loading && fastfoods.length >= 2) {
      setDuel(getRandomDuel(fastfoods, cat));
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
        setDuel(getRandomDuel(fastfoods, category));
      }, 1200);
    },
    [duel, fastfoods, isAnimating, category]
  );

  const handleSkip = useCallback(() => {
    if (isAnimating || !fastfoods.length) return;
    setDuel(getRandomDuel(fastfoods, category));
  }, [fastfoods, isAnimating, category]);

  if (loading || !duel) {
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

      {/* Categories */}
      <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
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
      <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:gap-4">
        <DuelCard
          fastfood={duel[0]}
          isWinner={selectedId === duel[0].id}
          isLoser={selectedId !== null && selectedId !== duel[0].id}
          delta={result?.winnerId === duel[0].id ? result.delta : null}
          onClick={() => handleVote(duel[0].id)}
          side="left"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-bd bg-sf animate-vs-pulse shrink-0">
          <span className="font-mono text-sm font-bold text-mt">VS</span>
        </div>

        <DuelCard
          fastfood={duel[1]}
          isWinner={selectedId === duel[1].id}
          isLoser={selectedId !== null && selectedId !== duel[1].id}
          delta={result?.winnerId === duel[1].id ? result.delta : null}
          onClick={() => handleVote(duel[1].id)}
          side="right"
        />
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
      className={`duel-card w-full flex-1 rounded-xl border bg-sf p-6 text-left ${
        side === "left" ? "animate-slide-left" : "animate-slide-right"
      } ${isWinner ? "winner" : isLoser ? "loser" : "border-bd"}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sf-alt border border-bd-subtle font-mono text-lg font-bold text-mt">
          {fastfood.chain.charAt(0)}
        </div>
        {cat && (
          <span className="text-xs text-mt bg-sf-alt border border-bd-subtle rounded-md px-2 py-0.5">
            {cat.emoji} {cat.label}
          </span>
        )}
      </div>

      <p className="text-[11px] font-mono text-mt uppercase tracking-wider mb-0.5">
        {fastfood.chain}
      </p>
      <h3 className="text-base font-semibold leading-tight">{fastfood.name}</h3>
      <p className="mt-1.5 text-[12px] text-mt truncate">{fastfood.location.address}</p>

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
