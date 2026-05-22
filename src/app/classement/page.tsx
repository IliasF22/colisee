"use client";

import { useState, useMemo } from "react";
import { Trophy, Search, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { MOCK_FASTFOODS } from "@/lib/mock-data";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";

export default function ClassementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<FoodCategoryId>("all");

  const filtered = useMemo(() => {
    let list = MOCK_FASTFOODS;
    if (category !== "all") list = list.filter((ff) => ff.category === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((ff) => ff.name.toLowerCase().includes(q) || ff.chain.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => b.elo_score - a.elo_score);
  }, [searchQuery, category]);

  const activeCat = FOOD_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Categories Sticky Sub-header */}
      <div className="sticky top-14 z-40 flex items-center gap-1.5 overflow-x-auto border-b border-bd bg-bg/95 backdrop-blur-md px-5 py-2.5">
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

      <div className="px-5 py-6">
        {/* Header */}
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold font-cinzel tracking-wide">Classement</h1>
          {activeCat && (
            <span className="rounded-md bg-sf border border-bd px-2 py-0.5 text-[11px] text-mt">
              {activeCat.emoji} {activeCat.label}
            </span>
          )}
        </div>
        <p className="text-sm text-mt mb-6">
          Classement par score Elo · {filtered.length} fast-food{filtered.length > 1 ? "s" : ""}
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

        {filtered.map((ff, i) => {
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
                    {ff.chain}
                    {cat && <span className="ml-1.5">{cat.emoji}</span>}
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
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-mt">
            <Trophy className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-sm">Aucun résultat</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
