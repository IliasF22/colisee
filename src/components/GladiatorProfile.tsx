"use client";

import { useEffect, useState } from "react";
import { X, Share2, Check, Swords } from "lucide-react";
import { getVoteStats, type VoteStats } from "@/lib/votes";
import { FOOD_CATEGORIES } from "@/lib/categories";

const SHARE_URL = "https://xn--colise-fva.fr/duel";

export function GladiatorProfile({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStats(getVoteStats());
  }, []);

  if (!stats) return null;

  const { persona, total, agreementRate, upsets, topCategoryId } = stats;
  const topCat = topCategoryId ? FOOD_CATEGORIES.find((c) => c.id === topCategoryId) : null;
  const revealed = total >= 5;

  const shareText = revealed
    ? `Je suis un gladiateur « ${persona.label} » sur Colisée ${persona.emoji} — d'accord avec l'arène ${agreementRate}% du temps. Et toi, t'as quel palais ? ⚔️`
    : `Je classe les fast-foods en duels sur Colisée ⚔️ Viens défier mes choix !`;

  const share = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Colisée — Mon profil de gladiateur", text: shareText, url: SHARE_URL });
        return;
      }
    } catch {
      /* annulé */
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${SHARE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-bd bg-bg overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-bd px-5 py-3">
          <h2 className="font-cinzel text-lg font-bold tracking-wide">Ton profil de gladiateur</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-mt hover:bg-sf-hover hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Persona */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gld/40 bg-gld/10 text-4xl">
              {persona.emoji}
            </div>
            <h3 className="mt-3 font-cinzel text-xl font-bold text-gld">{persona.label}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-mt">{persona.desc}</p>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: "Votes", value: total },
              { label: "Accord arène", value: revealed ? `${agreementRate}%` : "—" },
              { label: "Outsiders", value: revealed ? upsets : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-bd bg-sf px-2 py-3 text-center">
                <span className="block font-mono text-lg font-bold">{s.value}</span>
                <span className="text-[10px] uppercase tracking-wider text-mt">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Jauge accord vs foule */}
          {revealed && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-mt">
                <span>🔥 Rebelle</span>
                <span>Consensuel 🏛️</span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-sf border border-bd">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gld transition-all"
                  style={{ width: `${agreementRate}%` }}
                />
              </div>
              {topCat && (
                <p className="mt-3 text-center text-[13px] text-mt">
                  Ta catégorie de prédilection : <span className="text-fg">{topCat.emoji} {topCat.label}</span>
                </p>
              )}
            </div>
          )}

          {!revealed && (
            <p className="mt-4 rounded-xl border border-bd bg-sf px-3 py-3 text-center text-[13px] text-mt">
              <Swords className="mr-1 inline h-3.5 w-3.5 text-gld" />
              Encore {5 - total} vote{5 - total > 1 ? "s" : ""} pour révéler ton profil complet.
            </p>
          )}

          {/* Partage */}
          <button
            onClick={share}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gld px-4 py-3 text-[14px] font-semibold text-black transition-opacity hover:opacity-90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copié !" : "Partager mon profil"}
          </button>
        </div>
      </div>
    </div>
  );
}
