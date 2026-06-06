"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Plus, Flag, ArrowRight, CheckCircle2, Loader2, AlertTriangle, LogIn, Send } from "lucide-react";

const REASONS = [
  { id: "pas-fastfood", label: "Pas un fast-food" },
  { id: "ferme", label: "Fermé" },
  { id: "adresse", label: "Mauvaise adresse / doublon" },
  { id: "autre", label: "Autre" },
] as const;

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState("");
  const [reason, setReason] = useState<string>(REASONS[0].id);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!restaurant.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, "reports"), {
        restaurant: restaurant.trim(),
        reason,
        message: message.trim(),
        status: "pending",
        submittedBy: user?.uid || null,
        submitterEmail: user?.email || null,
        submitterName: user?.displayName || null,
        createdAt: Timestamp.now(),
      });
      setDone(true);
      setRestaurant("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setError("Impossible d'envoyer le signalement pour le moment. Réessaie plus tard.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-cinzel mb-2">Suggestions</h1>
        <p className="text-mt">
          Aide-nous à garder le Colisée propre : propose un bon fast-food, ou signale une adresse qui n&apos;a rien à y faire.
        </p>
      </div>

      <div className="space-y-5">
        {/* Proposer un restaurant */}
        <div className="rounded-xl border border-bd bg-sf p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gld/10 border border-gld/40">
              <Plus className="h-5 w-5 text-gld" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Proposer un restaurant</h2>
              <p className="mt-1 text-sm text-mt">
                Un bon fast-food indépendant manque à l&apos;arène ? Ajoute-le (les grandes chaînes sont refusées).
              </p>
              <Link
                href="/proposer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg transition-transform hover:scale-[1.02]"
              >
                Proposer une adresse
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Signaler une adresse */}
        <div className="rounded-xl border border-bd bg-sf p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-err/10 border border-err/30">
              <Flag className="h-5 w-5 text-err" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Signaler une adresse</h2>
              <p className="mt-1 text-sm text-mt">
                Une entrée qui n&apos;est pas un fast-food, fermée, ou en double ? Dis-le nous.
              </p>

              {done ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/5 p-3 text-sm text-ok">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Merci ! Ton signalement a bien été envoyé.
                  <button onClick={() => setDone(false)} className="ml-auto text-mt underline hover:text-fg">
                    En signaler un autre
                  </button>
                </div>
              ) : !user ? (
                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-bd px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-sf-hover"
                >
                  <LogIn className="h-4 w-4" />
                  Connecte-toi pour signaler
                </Link>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={restaurant}
                    onChange={(e) => setRestaurant(e.target.value)}
                    placeholder="Nom du restaurant concerné"
                    className="w-full rounded-lg border border-bd bg-bg px-3 py-2 text-sm outline-none transition-colors focus:border-mt placeholder:text-mt/50"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {REASONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setReason(r.id)}
                        className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                          reason === r.id ? "border-fg bg-fg text-bg" : "border-bd text-mt hover:bg-sf-hover"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Détail (optionnel) : ville, adresse, précision…"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-bd bg-bg px-3 py-2 text-sm outline-none transition-colors focus:border-mt placeholder:text-mt/50"
                  />
                  {error && (
                    <div className="flex items-start gap-2 rounded-md border border-err/20 bg-err/10 p-2.5 text-[13px] text-err">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}
                  <button
                    onClick={submit}
                    disabled={submitting || !restaurant.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Envoyer le signalement
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
