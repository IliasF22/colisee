import { FastFood } from "./types";
import { UserLocation, distanceKm } from "./geo";

/**
 * Une « zone de recherche » : soit l'agglomération parisienne regroupée,
 * soit une ville de province. Sert à éviter qu'un duel oppose deux restos
 * de villes très éloignées (ex : Nantes vs Bordeaux).
 */
export interface Zone {
  id: string;
  label: string;
}

// Départements d'Île-de-France → regroupés sous « Paris et sa banlieue ».
const IDF_DEPARTMENTS = ["75", "77", "78", "91", "92", "93", "94", "95"];

function postalFromAddress(address: string): string | null {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

/** Extrait le nom de la ville depuis une adresse Google (« 19 Rue …, 33000 Bordeaux, France »). */
export function cityFromAddress(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  // Cas standard : un segment « 33000 Bordeaux » (code postal + ville).
  for (const part of parts) {
    const m = part.match(/^\d{5}\s+(.+)$/);
    if (m) return m[1].trim();
  }
  // Sinon : dernier segment qui n'est ni le pays ni un code postal seul.
  const meaningful = parts.filter((p) => !/^france$/i.test(p) && !/^\d{4,5}$/.test(p));
  return meaningful[meaningful.length - 1] || parts[0] || "Inconnu";
}

/** Détermine la zone de recherche d'un resto à partir de son adresse. */
export function getZone(address: string): Zone {
  const postal = postalFromAddress(address);
  if (postal && IDF_DEPARTMENTS.includes(postal.slice(0, 2))) {
    return { id: "idf", label: "Paris et sa banlieue" };
  }
  const city = cityFromAddress(address);
  return { id: `city:${city.toLowerCase()}`, label: city };
}

/**
 * Zone de l'utilisateur = zone du resto le plus proche de sa position.
 * Évite d'appeler une API de géocodage : on s'appuie sur les restos déjà chargés.
 */
export function getUserZone(loc: UserLocation, fastfoods: FastFood[]): Zone | null {
  let nearest: FastFood | null = null;
  let best = Infinity;
  for (const ff of fastfoods) {
    const d = distanceKm(loc.lat, loc.lng, ff.location.latitude, ff.location.longitude);
    if (d < best) {
      best = d;
      nearest = ff;
    }
  }
  return nearest ? getZone(nearest.location.address) : null;
}
