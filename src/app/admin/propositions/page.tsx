"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { Check, X, Loader2, MapPin, Search } from "lucide-react";
import { FOOD_CATEGORIES } from "@/lib/categories";

export default function AdminPropositionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "submissions"), where("status", "==", "pending"));
      const snapshot = await getDocs(q);
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(subs.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleApprove = async (sub: any) => {
    setProcessingId(sub.id);
    try {
      // 1. Fetch photo reference
      const res = await fetch(`/api/places?placeId=${sub.place_id}`);
      const data = await res.json();
      
      let photoUrl = "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
      
      if (data.photos && data.photos.length > 0) {
        const photoRef = data.photos[0].photo_reference;
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${apiKey}`;
      }

      // 2. Create FastFood document
      const docId = `${sub.place_id}_${sub.category}`;
      await setDoc(doc(db, "fastfoods", docId), {
        name: sub.name,
        chain: sub.name.split(' ')[0], 
        category: sub.category,
        image_url: photoUrl,
        location: {
          latitude: sub.lat,
          longitude: sub.lng,
          address: sub.address,
        },
        google_reviews: sub.google_reviews ?? 0,
        google_rating: sub.google_rating ?? null,
        elo_score: 1500,
        total_matches: 0,
        wins: 0,
        losses: 0,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      }, { merge: true });

      // 3. Update submission status
      await updateDoc(doc(db, "submissions", sub.id), {
        status: "approved",
        fastfoodId: docId,
        updatedAt: Timestamp.now()
      });

      // Remove from UI
      setSubmissions(s => s.filter(x => x.id !== sub.id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'approbation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (subId: string) => {
    setProcessingId(subId);
    try {
      await updateDoc(doc(db, "submissions", subId), {
        status: "rejected",
        updatedAt: Timestamp.now()
      });
      setSubmissions(s => s.filter(x => x.id !== subId));
    } catch (err) {
      console.error(err);
      alert("Erreur lors du rejet.");
    } finally {
      setProcessingId(null);
    }
  };

  const getCategoryLabel = (catId: string) => {
    const cat = FOOD_CATEGORIES.find(c => c.id === catId);
    return cat ? `${cat.emoji} ${cat.label}` : catId;
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold font-cinzel tracking-wide mb-2">Propositions en attente</h1>
          <p className="text-mt">Vérifiez et validez les restaurants proposés par la communauté.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-mt/50" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-bd border-dashed bg-sf text-mt">
          <Search className="h-8 w-8 mb-3 opacity-50" />
          <p>Aucune proposition en attente.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {submissions.map((sub) => (
            <div key={sub.id} className="flex flex-col justify-between rounded-xl border border-bd bg-sf p-5">
              <div>
                <div className="mb-3 flex items-start justify-between">
                  <span className="inline-flex items-center rounded-md bg-bg border border-bd px-2.5 py-1 text-xs font-medium">
                    {getCategoryLabel(sub.category)}
                  </span>
                  <span className="text-[11px] text-mt">
                    Par: {sub.submitterName || sub.submitterEmail || "Anonyme"}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold">{sub.name}</h3>
                
                <div className="mt-2 flex items-start gap-2 text-mt">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-sm">{sub.address}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => handleReject(sub.id)}
                  disabled={processingId !== null}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-err/30 bg-err/10 px-4 py-2 text-sm font-medium text-err transition-colors hover:bg-err/20 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Refuser
                </button>
                <button
                  onClick={() => handleApprove(sub)}
                  disabled={processingId !== null}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ok/30 bg-ok/10 px-4 py-2 text-sm font-medium text-ok transition-colors hover:bg-ok/20 disabled:opacity-50"
                >
                  {processingId === sub.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Approuver
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
