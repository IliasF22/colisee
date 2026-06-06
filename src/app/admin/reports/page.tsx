"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { Check, X, Loader2, Flag, Search, ExternalLink } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  "pas-fastfood": "Pas un fast-food",
  ferme: "Fermé",
  adresse: "Mauvaise adresse / doublon",
  autre: "Autre",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "reports"), where("status", "==", "pending"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setReports(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les signalements (vérifie les règles Firestore de la collection « reports »).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const resolve = async (id: string, status: "resolved" | "dismissed") => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, "reports", id), { status, updatedAt: Timestamp.now() });
      setReports((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-cinzel tracking-wide mb-2">Signalements</h1>
        <p className="text-mt">Adresses signalées par la communauté (pas un fast-food, fermé, doublon…).</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-mt/50" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-err/20 bg-err/5 p-6 text-sm text-err">{error}</div>
      ) : reports.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-bd border-dashed bg-sf text-mt">
          <Flag className="h-8 w-8 mb-3 opacity-50" />
          <p>Aucun signalement en attente.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <div key={r.id} className="flex flex-col justify-between rounded-xl border border-bd bg-sf p-5">
              <div>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-err/10 border border-err/30 px-2.5 py-1 text-xs font-medium text-err">
                    <Flag className="h-3 w-3" /> {REASON_LABELS[r.reason] || r.reason || "Signalement"}
                  </span>
                  <span className="text-[11px] text-mt">{r.submitterName || r.submitterEmail || "Anonyme"}</span>
                </div>

                <h3 className="text-lg font-semibold">{r.restaurant || "—"}</h3>
                {r.message && <p className="mt-1.5 text-sm text-mt">{r.message}</p>}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.restaurant || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-mt hover:text-fg"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Voir sur Google Maps
                </a>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => resolve(r.id, "dismissed")}
                  disabled={processingId !== null}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-bd px-4 py-2 text-sm font-medium text-mt transition-colors hover:bg-sf-hover disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Ignorer
                </button>
                <button
                  onClick={() => resolve(r.id, "resolved")}
                  disabled={processingId !== null}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ok/30 bg-ok/10 px-4 py-2 text-sm font-medium text-ok transition-colors hover:bg-ok/20 disabled:opacity-50"
                >
                  {processingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Traité
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
