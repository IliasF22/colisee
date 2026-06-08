import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getByCategory,
  getCityCategoryCombos,
} from "@/lib/server-data";
import { categoryMeta, isSeoCategory, SITE_NAME, SITE_URL, SEO_CATEGORIES } from "@/lib/seo";
import { FoodCategoryId } from "@/lib/categories";
import { RankList } from "@/components/seo/RankList";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600; // 1 h

type Params = Promise<{ categorie: string }>;
const TOP_N = 50;

export async function generateStaticParams() {
  return SEO_CATEGORIES.map((c) => ({ categorie: c.id }));
}

async function load(p: Params) {
  const { categorie } = await p;
  if (!isSeoCategory(categorie)) return null;
  const meta = categoryMeta(categorie as FoodCategoryId);
  const items = await getByCategory(categorie as FoodCategoryId);
  if (!meta || items.length === 0) return null;
  return { categorie: categorie as FoodCategoryId, meta, items };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Page introuvable" };
  const year = new Date().getFullYear();
  const title = `Top ${data.meta.plural} en France (${year}) — Classement ${SITE_NAME}`;
  const description = `Le classement national des meilleurs ${data.meta.plural} en France, élu en duels par la communauté ${SITE_NAME}. ${data.items.length} adresses comparées.`;
  const url = `${SITE_URL}/classement/${data.categorie}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [data.items[0].image_url] },
  };
}

export default async function Page({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();

  const { items, categorie, meta } = data;
  const year = new Date().getFullYear();
  const url = `${SITE_URL}/classement/${categorie}`;
  const top = items.slice(0, TOP_N);

  // Villes phares pour cette catégorie (maillage interne), triées par densité.
  const combos = (await getCityCategoryCombos())
    .filter((c) => c.category === categorie)
    .sort((a, b) => b.count - a.count)
    .slice(0, 18);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: `Top ${meta.label}`, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Meilleurs ${meta.plural} en France`,
      numberOfItems: top.length,
      itemListElement: top.slice(0, 20).map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/restaurant/${f.slug}`,
        name: f.name,
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <JsonLd data={jsonLd} />

      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-mt">
        <Link href="/" className="hover:text-fg">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-fg">Top {meta.label}</span>
      </nav>

      <h1 className="font-cinzel text-2xl font-bold tracking-wide sm:text-3xl">
        Les meilleurs {meta.plural} de France
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-mt">
        Classement {year} des {meta.plural} en France, élu par les duels de la communauté{" "}
        {SITE_NAME}. {items.length} adresses de {meta.intro} comparées. Affine par ville
        ci-dessous, ou lance un duel pour faire bouger le classement.
      </p>

      <div className="mt-5">
        <RankList items={top} showCity />
      </div>

      {combos.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-fg">
            {meta.plural.charAt(0).toUpperCase() + meta.plural.slice(1)} par ville
          </h2>
          <div className="flex flex-wrap gap-2">
            {combos.map((c) => (
              <Link
                key={c.citySlug}
                href={`/classement/${categorie}/${c.citySlug}`}
                className="rounded-full border border-bd px-3 py-1.5 text-[13px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
              >
                {c.cityName} <span className="text-mt/60">({c.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-fg">Autres catégories</h2>
        <div className="flex flex-wrap gap-2">
          {SEO_CATEGORIES.filter((c) => c.id !== categorie).map((c) => (
            <Link
              key={c.id}
              href={`/classement/${c.id}`}
              className="rounded-full border border-bd px-3 py-1.5 text-[13px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
            >
              {c.emoji} {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
