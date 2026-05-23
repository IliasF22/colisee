import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { FastFood } from "./types";

export function useFastFoods() {
  const [fastfoods, setFastfoods] = useState<FastFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Requête pour récupérer les fast-foods triés par score Elo décroissant
    const q = query(collection(db, "fastfoods"), orderBy("elo_score", "desc"));

    // onSnapshot écoute les changements en temps réel
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: FastFood[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as FastFood);
        });
        setFastfoods(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur lors de la récupération des fast-foods :", err);
        setError(err);
        setLoading(false);
      }
    );

    // Nettoyage de l'écouteur quand le composant est démonté
    return () => unsubscribe();
  }, []);

  return { fastfoods, loading, error };
}
