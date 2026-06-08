import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getCityCategory,
  getCityCategoryCombos,
  getCity,
  MIN_PER_CITY_CATEGORY,
} from "@/lib/server-data";
import { categoryMeta, isSeoCategory, SITE_NAME, SITE_URL, SEO_CATEGORIES } from "@/lib/seo";
import { FoodCategoryId } from "@/lib/categories";
import { RankList } from "@/components/seo/RankList";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600; // 1 h

type Params = Promise<{ categorie: string; ville: string }>;

export async function generateStaticParams() {
  const combos = await getCityCategoryCombos();
  return combos.map((c) => ({ categorie: c.category, ville: c.citySlug }));
}

async function load(p: Params) {
  const { categorie, ville } = await p;
  if (!isSeoCategory(categorie)) return null;
  const meta = categoryMeta(categorie as FoodCategoryId);
  const res = await getCityCategory(ville, categorie as FoodCategoryId);
  if (!meta || !res || res.items.length < MIN_PER_CITY_CATEGORY) return null;
  return { categorie: categorie as FoodCategoryId, ville, meta, ...res };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Page introuvable" };
  const year = new Date().getFullYear();
  const title = `Top ${data.meta.plural} à ${data.city.name} (${year}) — Classement ${SITE_NAME}`;
  const description = `Le classement des meilleurs ${data.meta.plural} à ${data.city.name} : ${data.items.length} adresses comparées en duels par la communauté ${SITE_NAME}. Découvre le top et vote pour ton préféré.`;
  const url = `${SITE_URL}/classement/${data.categorie}/${data.ville}`;
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

  const { items, city, categorie, meta } = data;
  const year = new Date().getFullYear();
  const url = `${SITE_URL}/classement/${categorie}/${data.ville}`;

  // Autres catégories présentes dans cette ville (maillage interne).
  const cityEntry = await getCity(data.ville);
  const otherCats = SEO_CATEGORIES.filter(
    (c) => c.id !== categorie && cityEntry?.items.some((f) => f.category === c.id),
  );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: city.name, item: `${SITE_URL}/ville/${data.ville}` },
        { "@type": "ListItem", position: 3, name: meta.label, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Meilleurs ${meta.plural} à ${city.name}`,
      numberOfItems: items.length,
      itemListElement: items.slice(0, 20).map((f, i) => ({
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

      {/* Fil d'Ariane */}
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-mt">
        <Link href="/" className="hover:text-fg">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/ville/${data.ville}`} className="hover:text-fg">{city.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-fg">{meta.label}</span>
      </nav>

      <h1 className="font-cinzel text-2xl font-bold tracking-wide sm:text-3xl">
        Les meilleurs {meta.plural} à {city.name}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-mt">
        Classement {year} des {meta.plural} à {city.name}, établi par les duels de la
        communauté {SITE_NAME}. {items.length} adresses de {meta.intro} comparées —
        clique sur une fiche pour les détails, ou lance un duel pour faire bouger le classement.
      </p>

      <div className="mt-5">
        <RankList items={items} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/classement/${categorie}`}
          className="rounded-full border border-bd px-3 py-1.5 text-[13px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
        >
          🇫🇷 Top {meta.plural} en France
        </Link>
        {otherCats.map((c) => (
          <Link
            key={c.id}
            href={`/classement/${c.id}/${data.ville}`}
            className="rounded-full border border-bd px-3 py-1.5 text-[13px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
          >
            {c.emoji} {c.label} à {city.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
