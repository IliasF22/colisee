import type { MetadataRoute } from "next";
import {
  getFastFoods,
  getCityCategoryCombos,
  getPublishableCities,
} from "@/lib/server-data";
import { SITE_URL, SEO_CATEGORIES } from "@/lib/seo";

export const revalidate = 86400; // 24 h

function toDate(ts: unknown): Date {
  const t = ts as { toDate?: () => Date } | undefined;
  try {
    return t?.toDate ? t.toDate() : new Date();
  } catch {
    return new Date();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [all, combos, cities] = await Promise.all([
    getFastFoods(),
    getCityCategoryCombos(),
    getPublishableCities(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/classement`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/duel`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/carte`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/suggestions`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = SEO_CATEGORIES.map((c) => ({
    url: `${SITE_URL}/classement/${c.id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const comboPages: MetadataRoute.Sitemap = combos.map((c) => ({
    url: `${SITE_URL}/classement/${c.category}/${c.citySlug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const cityPages: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${SITE_URL}/ville/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const restaurantPages: MetadataRoute.Sitemap = all.map((f) => ({
    url: `${SITE_URL}/restaurant/${f.slug}`,
    lastModified: toDate(f.updated_at),
    changeFrequency: "weekly",
    priority: 0.5,
    images: f.image_url ? [f.image_url] : undefined,
  }));

  return [...staticPages, ...categoryPages, ...comboPages, ...cityPages, ...restaurantPages];
}
