import { FastFood } from "./types";
import { FoodCategoryId } from "./categories";

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export function getRandomDuel(
  fastfoods: FastFood[],
  category?: FoodCategoryId,
  userLocation?: UserLocation | null,
): [FastFood, FastFood] | null {
  let pool = category && category !== "all"
    ? fastfoods.filter((ff) => ff.category === category)
    : fastfoods;

  if (pool.length < 2) return null;

  if (userLocation) {
    const withDist = pool.map((ff) => ({
      ff,
      dist: distanceKm(userLocation.lat, userLocation.lng, ff.location.latitude, ff.location.longitude),
    }));
    withDist.sort((a, b) => a.dist - b.dist);

    // Take the closest 20 (or all if fewer), then pick 2 randomly from those
    const nearby = withDist.slice(0, Math.min(20, withDist.length));
    const shuffled = nearby.sort(() => Math.random() - 0.5);
    return [shuffled[0].ff, shuffled[1].ff];
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}
