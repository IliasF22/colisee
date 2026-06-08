/**
 * Helpers SEO : URL du site, slugs, libellés de catégories, formatage.
 * Partagé entre les pages SSR, le sitemap et les liens internes.
 */
import { FOOD_CATEGORIES, FoodCategoryId } from "./categories";

/** URL canonique de production (punycode = forme ASCII sûre pour URLs/sitemaps). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xn--colise-fva.fr"
).replace(/\/$/, "");

export const SITE_NAME = "Colisée";

/** Slugifie un texte : minuscules, sans accents, tirets. */
export function slugify(input: string): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/&/g, " et ")
    .replace(/['’`]/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Libellés SEO par catégorie (pluriel pour des titres naturels).
 * On exclut « all » des pages SEO.
 */
export const CATEGORY_SEO: Record<string, { plural: string; intro: string }> = {
  "poulet-frit": { plural: "poulets frits", intro: "poulet frit croustillant" },
  "smash-burger": { plural: "smash burgers", intro: "smash burgers" },
  pizza: { plural: "pizzerias", intro: "pizzas" },
  kebab: { plural: "kebabs", intro: "kebabs" },
  sandwich: { plural: "sandwicheries", intro: "sandwichs" },
  crousti: { plural: "restos crousti", intro: "crousti (riz croustillant)" },
  thai: { plural: "restaurants thaï", intro: "cuisine thaïlandaise" },
  asiatique: { plural: "restaurants asiatiques", intro: "cuisine asiatique" },
  tacos: { plural: "tacos", intro: "tacos français" },
};

/** Catégories éligibles au SEO (toutes sauf « all »). */
export const SEO_CATEGORIES = FOOD_CATEGORIES.filter(
  (c) => c.id !== "all",
) as ReadonlyArray<{ id: FoodCategoryId; label: string; emoji: string }>;

export function isSeoCategory(id: string): id is FoodCategoryId {
  return id !== "all" && SEO_CATEGORIES.some((c) => c.id === id);
}

export function categoryMeta(id: FoodCategoryId) {
  const base = SEO_CATEGORIES.find((c) => c.id === id);
  const seo = CATEGORY_SEO[id];
  return base && seo ? { ...base, ...seo } : null;
}

/** « €€ » par défaut, sinon selon price_level (1=€,2=€€,3=€€€). */
export function priceLabel(level?: number | null): string {
  const n = level && level >= 1 && level <= 4 ? level : 2;
  return "€".repeat(n);
}
