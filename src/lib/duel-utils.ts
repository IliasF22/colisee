import { FastFood } from "./types";
import { FoodCategoryId } from "./categories";
import { UserLocation, distanceKm } from "./geo";
import { getUserZone, getZone } from "./zones";

export type { UserLocation };

// Pondération du score combiné « proche de moi » × « le plus connu ».
const DIST_WEIGHT = 0.6;      // poids de la proximité
const POP_WEIGHT = 0.4;       // poids de la popularité (avis Google)
const DIST_DECAY_KM = 3;      // à ~3 km le bonus de proximité est divisé par e
const CANDIDATE_POOL = 15;    // on tire les 2 duellistes parmi les meilleurs candidats
const MAX_RADIUS_KM = 50;     // garde-fou : jamais de duel au-delà de ce rayon

/**
 * Score combiné d'un resto pour un user géolocalisé.
 * Mélange proximité (décroissance exponentielle sur la distance) et
 * popularité (nb d'avis Google, normalisé en log sur le pool).
 * Les deux composantes sont dans [0, 1].
 */
function combinedScore(dist: number, reviews: number, maxReviews: number): number {
  const distScore = Math.exp(-dist / DIST_DECAY_KM);
  const popScore = maxReviews > 0
    ? Math.log10(reviews + 1) / Math.log10(maxReviews + 1)
    : 0;
  return DIST_WEIGHT * distScore + POP_WEIGHT * popScore;
}

export function getRandomDuel(
  fastfoods: FastFood[],
  category?: FoodCategoryId,
  userLocation?: UserLocation | null,
): [FastFood, FastFood] | null {
  const pool = category && category !== "all"
    ? fastfoods.filter((ff) => ff.category === category)
    : fastfoods;

  if (pool.length < 2) return null;

  if (userLocation) {
    const dist = (ff: FastFood) =>
      distanceKm(userLocation.lat, userLocation.lng, ff.location.latitude, ff.location.longitude);

    // 1) On constitue un ensemble LOCAL : d'abord la zone de l'utilisateur
    //    (sa ville / agglo), sinon un rayon strict autour de lui.
    const userZone = getUserZone(userLocation, fastfoods);
    let local = userZone
      ? pool.filter((ff) => getZone(ff.location.address).id === userZone.id)
      : [];
    if (local.length < 2) {
      local = pool.filter((ff) => dist(ff) <= MAX_RADIUS_KM);
    }

    // 2) Pas assez de restos à proximité (ville de province peu fournie) :
    //    on garantit la localité en prenant simplement les 2 plus proches,
    //    plutôt que de retomber sur des restos populaires mais lointains.
    if (local.length < 2) {
      const byDist = [...pool].sort((a, b) => dist(a) - dist(b));
      return [byDist[0], byDist[1]];
    }

    // 3) À l'intérieur de l'ensemble local, on classe par score combiné
    //    proximité × popularité, puis on tire 2 duellistes parmi les meilleurs.
    const maxReviews = local.reduce((m, ff) => Math.max(m, ff.google_reviews ?? 0), 0);
    const scored = local.map((ff) => ({
      ff,
      score: combinedScore(dist(ff), ff.google_reviews ?? 0, maxReviews),
    }));
    scored.sort((a, b) => b.score - a.score);

    const candidates = scored.slice(0, Math.min(CANDIDATE_POOL, scored.length));
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    return [shuffled[0].ff, shuffled[1].ff];
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}
