import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Star, Swords } from "lucide-react";
import {
  getFastFoods,
  getRestaurantBySlug,
  getCity,
  MIN_PER_CITY,
} from "@/lib/server-data";
import { categoryMeta, priceLabel, SITE_NAME, SITE_URL } from "@/lib/seo";
import { FOOD_CATEGORIES } from "@/lib/categories";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 86400; // 24 h

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const all = await getFastFoods();
  return all.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const f = await getRestaurantBySlug(slug);
  if (!f) return { title: "Restaurant introuvable" };
  const cat = FOOD_CATEGORIES.find((c) => c.id === f.category);
  const title = `${f.name} à ${f.cityName} — Avis & classement | ${SITE_NAME}`;
  const ratingTxt =
    typeof f.google_rating === "number"
      ? ` Noté ${f.google_rating.toFixed(1)}/5 (${f.google_reviews ?? 0} avis).`
      : "";
  const description = `${f.name}${cat ? `, ${cat.label.toLowerCase()}` : ""} à ${f.cityName}.${ratingTxt} Découvre son classement ${SITE_NAME} et vote en duel.`;
  const url = `${SITE_URL}/restaurant/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [f.image_url] },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const f = await getRestaurantBySlug(slug);
  if (!f) notFound();

  const meta = categoryMeta(f.category);
  const cat = FOOD_CATEGORIES.find((c) => c.id === f.category);
  const url = `${SITE_URL}/restaurant/${slug}`;
  const hasRating = typeof f.google_rating === "number" && (f.google_reviews ?? 0) > 0;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${f.location.latitude},${f.location.longitude}`;

  const city = await getCity(f.citySlug);
  const cityHasHub = (city?.items.length ?? 0) >= MIN_PER_CITY;

  const restaurantLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: f.name,
    image: f.image_url,
    url,
    servesCuisine: cat?.label ?? "Fast food",
    priceRange: priceLabel(f.price_level),
    address: {
      "@type": "PostalAddress",
      streetAddress: f.location.address,
      addressLocality: f.cityName,
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: f.location.latitude,
      longitude: f.location.longitude,
    },
  };
  if (hasRating) {
    restaurantLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: f.google_rating,
      reviewCount: f.google_reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: f.cityName, item: `${SITE_URL}/ville/${f.citySlug}` },
      { "@type": "ListItem", position: 3, name: f.name, item: url },
    ],
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <JsonLd data={[restaurantLd, breadcrumbLd]} />

      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-mt">
        <Link href="/" className="hover:text-fg">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/ville/${f.citySlug}`} className="hover:text-fg">{f.cityName}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-fg">{f.name}</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-bd bg-sf">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={f.image_url}
          alt={`${f.name} — ${cat?.label ?? "fast-food"} à ${f.cityName}`}
          className="h-52 w-full object-cover sm:h-64"
          loading="eager"
        />
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {cat && (
              <span className="rounded-full bg-bg px-2.5 py-1 text-[12px] text-mt">
                {cat.emoji} {cat.label}
              </span>
            )}
            {f.is_franchise && f.franchise_name && (
              <span className="rounded-full bg-gld/15 px-2.5 py-1 text-[12px] text-gld">
                {f.franchise_name}
              </span>
            )}
            <span className="rounded-full bg-bg px-2.5 py-1 text-[12px] text-gld">
              {priceLabel(f.price_level)}
            </span>
          </div>

          <h1 className="mt-3 font-cinzel text-2xl font-bold tracking-wide sm:text-3xl">
            {f.name}
          </h1>

          {hasRating && (
            <p className="mt-1 flex items-center gap-1.5 text-[15px] text-mt">
              <Star className="h-4 w-4 fill-gld text-gld" />
              <span className="font-semibold text-fg">{f.google_rating!.toFixed(1)}</span>
              <span>/ 5 · {f.google_reviews} avis Google</span>
            </p>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-start gap-2 text-[14px] text-mt transition-colors hover:text-fg"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gld" />
            <span>{f.location.address}</span>
          </a>
        </div>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-mt">
        {f.name} est {cat ? `un spot de ${meta?.intro ?? cat.label.toLowerCase()}` : "un fast-food"} à{" "}
        {f.cityName}. {hasRating ? `Noté ${f.google_rating!.toFixed(1)}/5 sur Google (${f.google_reviews} avis), il` : "Il"}{" "}
        fait partie du classement {SITE_NAME} : affronte-le en duel pour faire bouger sa place.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/duel"
          className="flex items-center gap-1.5 rounded-full bg-gld px-4 py-2 text-[14px] font-semibold text-black transition-opacity hover:opacity-90"
        >
          <Swords className="h-4 w-4" /> Lancer un duel
        </Link>
        {meta && (
          <Link
            href={`/classement/${f.category}`}
            className="rounded-full border border-bd px-4 py-2 text-[14px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
          >
            Top {meta.plural} en France
          </Link>
        )}
        {cityHasHub && (
          <Link
            href={`/ville/${f.citySlug}`}
            className="rounded-full border border-bd px-4 py-2 text-[14px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
          >
            Fast-foods à {f.cityName}
          </Link>
        )}
      </div>
    </div>
  );
}
