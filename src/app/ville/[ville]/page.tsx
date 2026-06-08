import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getCity,
  getPublishableCities,
  MIN_PER_CITY,
  MIN_PER_CITY_CATEGORY,
} from "@/lib/server-data";
import { SITE_NAME, SITE_URL, SEO_CATEGORIES } from "@/lib/seo";
import { RankList } from "@/components/seo/RankList";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 3600; // 1 h

type Params = Promise<{ ville: string }>;
const TOP_N = 20;

export async function generateStaticParams() {
  const cities = await getPublishableCities();
  return cities.map((c) => ({ ville: c.slug }));
}

async function load(p: Params) {
  const { ville } = await p;
  const city = await getCity(ville);
  if (!city || city.items.length < MIN_PER_CITY) return null;
  return { ville, city };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Page introuvable" };
  const year = new Date().getFullYear();
  const title = `Meilleurs fast-foods à ${data.city.name} (${year}) — ${SITE_NAME}`;
  const description = `Le classement des meilleurs fast-foods à ${data.city.name} : ${data.city.items.length} adresses (kebab, smash burger, tacos, poulet frit…) comparées en duels par la communauté ${SITE_NAME}.`;
  const url = `${SITE_URL}/ville/${data.ville}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [data.city.items[0].image_url] },
  };
}

export default async function Page({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();

  const { city, ville } = data;
  const year = new Date().getFullYear();
  const url = `${SITE_URL}/ville/${ville}`;
  const top = city.items.slice(0, TOP_N);

  // Catégories présentes dans la ville avec assez d'adresses pour une page dédiée.
  const cats = SEO_CATEGORIES.map((c) => ({
    ...c,
    count: city.items.filter((f) => f.category === c.id).length,
  })).filter((c) => c.count >= MIN_PER_CITY_CATEGORY);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: city.name, item: url },
    ],
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <JsonLd data={jsonLd} />

      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-mt">
        <Link href="/" className="hover:text-fg">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-fg">{city.name}</span>
      </nav>

      <h1 className="font-cinzel text-2xl font-bold tracking-wide sm:text-3xl">
        Les meilleurs fast-foods à {city.name}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-mt">
        Classement {year} des fast-foods à {city.name} : {city.items.length} adresses
        comparées en duels par la communauté {SITE_NAME}. Filtre par type ci-dessous.
      </p>

      {cats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/classement/${c.id}/${ville}`}
              className="rounded-full border border-bd px-3 py-1.5 text-[13px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
            >
              {c.emoji} {c.label} <span className="text-mt/60">({c.count})</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5">
        <RankList items={top} showCategory />
      </div>
    </div>
  );
}
