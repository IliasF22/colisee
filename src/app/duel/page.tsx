"use client";

import { useState, useCallback } from "react";
import { RotateCcw, TrendingUp, TrendingDown, Flame } from "lucide-react";
import { MOCK_FASTFOODS, getRandomDuel } from "@/lib/mock-data";
import { calculateElo } from "@/lib/elo";
import { FastFood } from "@/lib/types";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";

export default function DuelPage() {
  const [fastfoods, setFastfoods] = useState<FastFood[]>(MOCK_FASTFOODS);
  const [category, setCategory] = useState<FoodCategoryId>("all");
  const [duel, setDuel] = useState<[FastFood, FastFood]>(() => getRandomDuel(fastfoods));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ winnerId: string; delta: number } | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCategoryChange = (cat: FoodCategoryId) => {
    setCategory(cat);
    setDuel(getRandomDuel(fastfoods, cat));
  };

  const handleVote = useCallback(
    (winnerId: string) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setSelectedId(winnerId);

      const [a, b] = duel;
      const winner = a.id === winnerId ? a : b;
      const loser = a.id === winnerId ? b : a;

      const { winnerNewScore, loserNewScore, winnerDelta } = calculateElo(
        winner.elo_score,
        loser.elo_score
      );

      setFastfoods((prev) =>
        prev.map((ff) => {
          if (ff.id === winner.id)
            return { ...ff, elo_score: winnerNewScore, total_matches: ff.total_matches + 1, wins: ff.wins + 1 };
          if (ff.id === loser.id)
            return { ...ff, elo_score: loserNewScore, total_matches: ff.total_matches + 1, losses: ff.losses + 1 };
          return ff;
        })
      );

      setResult({ winnerId, delta: winnerDelta });
      setTotalVotes((v) => v + 1);

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
    if (isAnimating) return;
    setDuel(getRandomDuel(fastfoods, category));
  }, [fastfoods, isAnimating, category]);

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
