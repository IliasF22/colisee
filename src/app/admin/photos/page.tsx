"use client";

import { useState } from "react";
import { useFastFoods } from "@/lib/hooks";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Check, Search, Image as ImageIcon } from "lucide-react";

export default function AdminPhotosPage() {
  const { fastfoods, loading } = useFastFoods();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [updatingPhotoUrl, setUpdatingPhotoUrl] = useState<string | null>(null);

  const fetchPhotos = async (documentId: string) => {
    setSelectedSpotId(documentId);
    setIsLoadingPhotos(true);
    setPhotos([]);

    // Extraire le vrai place_id en retirant la catégorie à la fin,
    // car les place_id de Google Maps contiennent eux-mêmes des underscores !
    const placeId = documentId.replace(/_(poulet-frit|smash-burger|pizza|kebab|sandwich|crousti|thai|asiatique)$/, '');

    try {
      const res = await fetch(`/api/places?placeId=${placeId}`);
      const data = await res.json();
      if (data.photos) {
        setPhotos(data.photos);
      } else {
        alert("Erreur ou aucune photo trouvée.");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la récupération des photos.");
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const updateImage = async (placeId: string, photoUrl: string) => {
    setUpdatingPhotoUrl(photoUrl);
    try {
      await updateDoc(doc(db, "fastfoods", placeId), {
        image_url: photoUrl,
      });
      alert("Image mise à jour avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setUpdatingPhotoUrl(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mt/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-cinzel">Sélecteur de Photos (Admin)</h1>
        <p className="text-sm text-mt mt-1">
          Choisissez la meilleure photo pour chaque restaurant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colonne de gauche : Liste des restaurants */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mt mb-2">
            Restaurants ({fastfoods.length})
          </h2>
          {fastfoods.map((ff) => (
            <div
              key={ff.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedSpotId === ff.id ? "border-fg bg-sf" : "border-bd bg-bg hover:border-mt"
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={ff.image_url}
                  alt={ff.name}
                  className="h-10 w-10 rounded-md object-cover bg-sf-alt"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{ff.name}</p>
                    <span className="text-[10px] font-mono text-mt bg-sf-alt border border-bd-subtle px-1.5 py-0.5 rounded uppercase">
                      {ff.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-mt">{ff.chain}</p>
                </div>
              </div>
              <button
                onClick={() => fetchPhotos(ff.id)}
                className="flex items-center gap-1.5 rounded-md bg-sf-alt border border-bd px-3 py-1.5 text-xs font-medium hover:bg-sf-hover"
              >
                <Search className="h-3.5 w-3.5" />
                Photos
              </button>
            </div>
          ))}
        </div>

        {/* Colonne de droite : Grille de photos */}
        <div className="rounded-xl border border-bd bg-sf p-5 min-h-[500px]">
          {selectedSpotId ? (
            <>
              <h2 className="text-sm font-semibold mb-4">
                Photos disponibles (Google Maps)
              </h2>
              {isLoadingPhotos ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-mt/50" />
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative cursor-pointer overflow-hidden rounded-lg border border-bd"
                      onClick={() => updateImage(selectedSpotId, url)}
                    >
                      <img
                        src={url}
                        alt={`Photo ${idx}`}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-bg/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm">
                        {updatingPhotoUrl === url ? (
                          <Loader2 className="h-6 w-6 animate-spin text-fg" />
                        ) : (
                          <span className="text-sm font-bold text-fg bg-bg px-3 py-1 rounded-md border border-bd">
                            Choisir
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-mt text-center py-10">Aucune photo trouvée.</p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-mt opacity-50">
              <ImageIcon className="h-10 w-10 mb-3" />
              <p className="text-sm">Sélectionnez un restaurant à gauche</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
