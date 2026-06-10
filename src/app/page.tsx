import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { SITE_NAME, SITE_URL, SEO_CATEGORIES } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export default function HomePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: "Colisée Food",
      url: SITE_URL,
      inLanguage: "fr-FR",
      description:
        "Le classement des meilleurs fast-foods (restauration rapide) de France, élu en duels par la communauté.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo-noir.png`,
    },
  ];

  return (
    <div className="flex flex-col items-center px-6">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center text-center max-w-xl animate-fade-in">
        <div className="relative mb-8">
          <Image
            src="/images/logo-noir.png"
            alt="Colisée — classement des fast-foods"
            width={256}
            height={256}
            className="h-40 w-auto dark:hidden"
            priority
          />
          <Image
            src="/images/logo-blanc.png"
            alt="Colisée — classement des fast-foods"
            width={256}
            height={256}
            className="hidden h-40 w-auto dark:block"
            priority
          />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-wide font-cinzel">
          Colisée
        </h1>
        <p className="mt-4 text-mt text-lg max-w-md">
          Le classement des meilleurs fast-foods de France. Votez en duels,
          classez la restauration rapide, trouvez le top près de chez vous.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/duel"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-fg px-6 py-2.5 text-sm font-medium text-bg transition-all hover:opacity-90"
          >
            Commencer un duel
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/classement"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-bd px-6 py-2.5 text-sm font-medium text-mt transition-colors hover:text-fg hover:bg-sf-hover"
          >
            Voir le classement
          </Link>
        </div>
      </div>

      {/* Section SEO : contenu indexable + maillage interne */}
      <section className="w-full max-w-2xl pb-16 text-center">
        <h2 className="font-cinzel text-2xl font-bold tracking-wide">
          Le classement de la restauration rapide
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-mt">
          {SITE_NAME} est le grand classement des fast-foods en France : kebab,
          smash burger, tacos, poulet frit, pizza, sandwich… Chaque adresse
          s’affronte en duel et grimpe (ou chute) au classement selon vos votes.
          Pas besoin de compte pour voter — découvrez les meilleurs spots de
          restauration rapide, ville par ville.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SEO_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/classement/${c.id}`}
              className="rounded-full border border-bd px-3.5 py-1.5 text-[13px] text-mt transition-colors hover:bg-sf-hover hover:text-fg"
            >
              {c.emoji} Meilleurs {c.label.toLowerCase()}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
