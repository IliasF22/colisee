/**
 * Lecture Firestore CÔTÉ SERVEUR pour les pages SEO (SSR/ISR).
 *
 * - SDK client Firebase (les règles autorisent la lecture publique de `fastfoods`).
 * - Mémoïsation au niveau module avec TTL : la collection n'est lue qu'une fois
 *   par instance toutes les TTL_MS → coût Firestore maîtrisé même sous crawl.
 * - Données dérivées : slugs déterministes, index ville et ville×catégorie.
 *
 * Ne JAMAIS importer ce module dans un composant client (server-only par usage).
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { FastFood } from "./types";
import { FoodCategoryId } from "./categories";
import { cityFromAddress } from "./zones";
import { slugify, isSeoCategory } from "./seo";

// Init Firebase dédiée (Firestore seul, pas d'Auth côté serveur).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/** Resto enrichi pour le SEO (slug + ville normalisée). */
export interface SeoFastFood extends FastFood {
  slug: string;
  citySlug: string;
  cityName: string;
}

/** Minimum de restos pour publier une page (anti thin-content / doorway). */
export const MIN_PER_CITY_CATEGORY = 3;
export const MIN_PER_CITY = 5;

// ── Mémoïsation module ────────────────────────────────────────────
const TTL_MS = 5 * 60 * 1000;
let _memo: { at: number; data: SeoFastFood[] } | null = null;
let _inflight: Promise<SeoFastFood[]> | null = null;

async function fetchEnriched(): Promise<SeoFastFood[]> {
  const snap = await getDocs(collection(db, "fastfoods"));
  const raw: FastFood[] = [];
  snap.forEach((d) => {
    const ff = { id: d.id, ...d.data() } as FastFood;
    if (!ff.hidden) raw.push(ff);
  });

  // Tri déterministe (id) pour des slugs stables, puis attribution de slug unique.
  raw.sort((a, b) => a.id.localeCompare(b.id));
  const used = new Set<string>();
  const enriched: SeoFastFood[] = raw.map((ff) => {
    const cityName = cityFromAddress(ff.location.address);
    const citySlug = slugify(cityName) || "france";
    let slug = `${slugify(ff.name)}-${citySlug}`.replace(/^-+|-+$/g, "");
    if (!slug) slug = citySlug;
    let candidate = slug;
    let i = 2;
    while (used.has(candidate)) candidate = `${slug}-${i++}`;
    used.add(candidate);
    return { ...ff, slug: candidate, citySlug, cityName };
  });

  return enriched;
}

/** Tous les fast-foods visibles, enrichis, mémoïsés. */
export async function getFastFoods(): Promise<SeoFastFood[]> {
  const now = Date.now();
  if (_memo && now - _memo.at < TTL_MS) return _memo.data;
  if (_inflight) return _inflight;
  _inflight = fetchEnriched()
    .then((data) => {
      _memo = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      _inflight = null;
    });
  return _inflight;
}

// ── Accès dérivés ─────────────────────────────────────────────────

const byElo = (a: SeoFastFood, b: SeoFastFood) => b.elo_score - a.elo_score;

export async function getRestaurantBySlug(slug: string): Promise<SeoFastFood | null> {
  const all = await getFastFoods();
  return all.find((f) => f.slug === slug) ?? null;
}

export async function getByCategory(cat: FoodCategoryId): Promise<SeoFastFood[]> {
  const all = await getFastFoods();
  return all.filter((f) => f.category === cat).sort(byElo);
}

export interface CityEntry {
  slug: string;
  name: string;
  items: SeoFastFood[];
}

/** Index ville → restos (triés Elo). */
export async function getCityIndex(): Promise<Map<string, CityEntry>> {
  const all = await getFastFoods();
  const map = new Map<string, CityEntry>();
  for (const f of all) {
    let e = map.get(f.citySlug);
    if (!e) {
      e = { slug: f.citySlug, name: f.cityName, items: [] };
      map.set(f.citySlug, e);
    }
    e.items.push(f);
  }
  for (const e of map.values()) e.items.sort(byElo);
  return map;
}

export async function getCity(citySlug: string): Promise<CityEntry | null> {
  return (await getCityIndex()).get(citySlug) ?? null;
}

/** Restos d'une catégorie dans une ville (triés Elo). */
export async function getCityCategory(
  citySlug: string,
  cat: FoodCategoryId,
): Promise<{ city: CityEntry; items: SeoFastFood[] } | null> {
  const city = await getCity(citySlug);
  if (!city) return null;
  const items = city.items.filter((f) => f.category === cat).sort(byElo);
  return { city, items };
}

/** Combos ville×catégorie publiables (≥ seuil) — pour sitemap & params. */
export async function getCityCategoryCombos(): Promise<
  { citySlug: string; cityName: string; category: FoodCategoryId; count: number }[]
> {
  const idx = await getCityIndex();
  const out: { citySlug: string; cityName: string; category: FoodCategoryId; count: number }[] = [];
  for (const city of idx.values()) {
    const counts = new Map<string, number>();
    for (const f of city.items) {
      if (!isSeoCategory(f.category)) continue;
      counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
    }
    for (const [category, count] of counts) {
      if (count >= MIN_PER_CITY_CATEGORY)
        out.push({ citySlug: city.slug, cityName: city.name, category: category as FoodCategoryId, count });
    }
  }
  return out;
}

/** Villes publiables comme hub (≥ seuil) — pour sitemap & params. */
export async function getPublishableCities(): Promise<CityEntry[]> {
  const idx = await getCityIndex();
  return [...idx.values()].filter((c) => c.items.length >= MIN_PER_CITY);
}
