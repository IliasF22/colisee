/**
 * Suivi de l'engagement (localStorage, sans compte) :
 * le podium du classement se débloque après REQUIRED_DUELS votes.
 */
export const REQUIRED_DUELS = 3;

const KEY = "colisee_duels_done";
const FLAG = "colisee_podium_just_unlocked";

export function getDuelsDone(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY) || "0", 10) || 0;
}

export function incrementDuelsDone(): number {
  if (typeof window === "undefined") return 0;
  const n = getDuelsDone() + 1;
  localStorage.setItem(KEY, String(n));
  // Marque le moment exact du déblocage pour l'animation côté classement.
  if (n === REQUIRED_DUELS) localStorage.setItem(FLAG, "1");
  return n;
}

/** Renvoie true une seule fois, juste après le déblocage (puis consomme le flag). */
export function consumeJustUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const v = localStorage.getItem(FLAG) === "1";
  if (v) localStorage.removeItem(FLAG);
  return v;
}
