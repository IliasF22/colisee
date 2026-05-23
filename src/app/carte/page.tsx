"use client";

import { useState } from "react";
import { Locate, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { FOOD_CATEGORIES, FoodCategoryId } from "@/lib/categories";
import { useFastFoods } from "@/lib/hooks";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-sf">
      <span className="text-sm text-mt animate-pulse">Chargement de la carte…</span>
    </div>
  ),
});

export default function CartePage() {
  const { fastfoods, loading } = useFastFoods();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [category, setCategory] = useState<FoodCategoryId>("all");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Géolocalisation non supportée.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      (err) => {
        setLocationError(err.code === 1 ? "Accès refusé." : "Position indisponible.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const center: [number, number] = userLocation || [48.8566, 2.3522];
  const visibleFastfoods = category === "all" ? fastfoods : fastfoods.filter((ff) => ff.category === category);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-2.5rem)]">
      <div className="flex items-center justify-between border-b border-bd px-5 py-3">
        <div>
          <h1 className="text-base font-semibold">Carte</h1>
          <p className="text-[11px] text-mt">{visibleFastfoods.length} fast-foods</p>
        </div>
        <button
          onClick={requestLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-fg px-3 py-1.5 text-[13px] font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50"
        >
          <Locate className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "…" : userLocation ? "Recentrer" : "Me localiser"}
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-bd overflow-x-auto">
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`category-pill flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium whitespace-nowrap border border-bd ${
              category === cat.id ? "active" : "text-mt"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {locationError && (
        <div className="flex items-center gap-2 border-b border-err/20 bg-err/5 px-5 py-2 text-[12px] text-err">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {locationError}
        </div>
      )}

      <div className="flex-1 relative">
        <MapView center={center} zoom={userLocation ? 14 : 12} fastfoods={visibleFastfoods} userLocation={userLocation} />
      </div>
    </div>
  );
}
