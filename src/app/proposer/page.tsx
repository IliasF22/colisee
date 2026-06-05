"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { MapPin, AlertTriangle, CheckCircle2, Loader2, Star } from "lucide-react";

const FORBIDDEN_CHAINS = [
  "mcdonald's", "mcdonalds", "mcdo", "burger king", "kfc",
  "quick", "subway", "o'tacos", "domino's", "pizza hut", "starbucks",
  "paul", "brioche dorée", "korean fried chicken", "five guys"
];

export default function ProposerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listenerAttached = useRef(false);

  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [placePhoto, setPlacePhoto] = useState<string | null>(null);
  const [placeRating, setPlaceRating] = useState<number | null>(null);
  const [placeReviews, setPlaceReviews] = useState<number | null>(null);
  const [category, setCategory] = useState<FoodCategoryId>("smash-burger");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const getPicker = useCallback(() => {
    return containerRef.current?.querySelector("gmpx-place-picker") as any;
  }, []);

  const handlePlaceChange = useCallback(() => {
    const picker = getPicker();
    if (!picker) return;

    const place = picker.value;
    if (!place) {
      setSelectedPlace(null);
      setPlacePhoto(null);
      setPlaceRating(null);
      setPlaceReviews(null);
      return;
    }

    const name = place.displayName || place.name;
    if (name) {
      const lowerName = name.toLowerCase();
      const isForbidden = FORBIDDEN_CHAINS.some(chain => lowerName.includes(chain));

      if (isForbidden) {
        setError(`Les grandes chaînes comme "${name}" ne sont pas autorisées dans le Colisée. L'arène est réservée aux vrais challengers !`);
        setSelectedPlace(null);
        setPlacePhoto(null);
        return;
      }
    }

    setError(null);

    let photoUrl: string | null = null;
    if (place.photos && place.photos.length > 0) {
      try {
        photoUrl = place.photos[0].getURI({ maxWidth: 600 });
      } catch {
        photoUrl = null;
      }
    }
    setPlacePhoto(photoUrl);
    setPlaceRating(place.rating ?? null);
    setPlaceReviews(place.userRatingCount ?? place.user_ratings_total ?? null);

    setSelectedPlace({
      place_id: place.id,
      name: place.displayName || place.name,
      address: place.formattedAddress,
      lat: place.location?.lat(),
      lng: place.location?.lng(),
      google_reviews: place.userRatingCount ?? place.user_ratings_total ?? 0,
      google_rating: place.rating ?? null,
    });
  }, [getPicker]);

  useEffect(() => {
    if (!scriptLoaded || listenerAttached.current) return;

    const attach = () => {
      const picker = getPicker();
      if (picker) {
        picker.addEventListener("gmpx-placechange", handlePlaceChange);
        listenerAttached.current = true;
        return true;
      }
      return false;
    };

    if (!attach()) {
      const interval = setInterval(() => {
        if (attach()) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }

    return () => {
      const picker = getPicker();
      picker?.removeEventListener("gmpx-placechange", handlePlaceChange);
    };
  }, [scriptLoaded, handlePlaceChange, getPicker]);

  const handleSubmit = async () => {
    if (!selectedPlace || !user) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "submissions"), {
        ...selectedPlace,
        category,
        status: "pending",
        submittedBy: user.uid,
        submitterEmail: user.email,
        submitterName: user.displayName,
        createdAt: Timestamp.now(),
      });
      setIsSuccess(true);
      setSelectedPlace(null);
      setPlacePhoto(null);
      const picker = getPicker();
      if (picker) picker.value = null;
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la soumission. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mt/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-cinzel mb-2">Proposer un Challenger</h1>
        <p className="text-mt">
          Trouvez un fast-food indépendant qui mérite d&apos;entrer dans l&apos;Arène. Les grandes chaînes industrielles seront automatiquement refusées.
        </p>
      </div>

      {isSuccess ? (
        <div className="rounded-xl border border-ok/20 bg-ok/5 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-ok" />
          <h2 className="text-xl font-bold mb-2">C&apos;est dans la boîte !</h2>
          <p className="text-mt mb-6">
            Votre proposition a été envoyée aux administrateurs. Si le restaurant valide nos critères, il fera bientôt son entrée dans le Colisée.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="rounded-lg bg-bg border border-bd px-4 py-2 text-sm font-medium hover:bg-sf transition-colors"
          >
            Proposer un autre restaurant
          </button>
        </div>
      ) : (
        <div className="space-y-6 rounded-xl border border-bd bg-sf p-6 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium">
              1. Recherchez le restaurant sur Google Maps
            </label>
            <div
              className="w-full"
              suppressHydrationWarning
              ref={(el) => {
                if (!el) return;
                containerRef.current = el;
                if (el.querySelector("gmpx-api-loader")) return;
                const loader = document.createElement("gmpx-api-loader");
                loader.setAttribute("key", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "");
                loader.setAttribute("solution-channel", "GMP_GE_placepicker_v2");
                el.prepend(loader);
              }}
            >
              {/* @ts-ignore */}
              <gmpx-place-picker
                type="restaurant"
                country="fr"
                placeholder="Rechercher un restaurant en France..."
                style={{ width: '100%' }}
              ></gmpx-place-picker>
            </div>
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-md bg-err/10 p-3 text-sm text-err border border-err/20">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {selectedPlace && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-bd bg-bg">
                {placePhoto && (
                  <div className="relative h-48 w-full">
                    <img
                      src={placePhoto}
                      alt={selectedPlace.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-fg">{selectedPlace.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-mt">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {selectedPlace.address}
                  </p>
                  {placeRating != null && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-md bg-sf border border-bd px-2 py-0.5">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-semibold">{placeRating.toFixed(1)}</span>
                      </div>
                      {placeReviews != null && (
                        <span className="text-xs text-mt">({placeReviews.toLocaleString()} avis Google)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  2. Choisissez sa catégorie
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FOOD_CATEGORIES.filter(c => c.id !== "all").map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id as FoodCategoryId)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-all ${
                        category === cat.id
                          ? "border-fg bg-sf shadow-sm scale-[1.02]"
                          : "border-bd bg-bg hover:border-mt"
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-fg px-4 py-3 text-sm font-medium text-bg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Soumettre ce restaurant"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
