import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mentions légales — Colisée",
  description: "Mentions légales du site Colisée.",
  alternates: { canonical: `${SITE_URL}/mentions-legales` },
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "thefrejman@gmail.com";

export default function MentionsLegales() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-cinzel text-2xl font-bold tracking-wide sm:text-3xl">Mentions légales</h1>
      <p className="mt-2 text-[13px] text-mt">Dernière mise à jour : {new Date().getFullYear()}</p>

      <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-mt [&_h2]:font-cinzel [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-fg [&_h2]:tracking-wide [&_a]:text-gld [&_a]:underline">
        <section className="space-y-2">
          <h2>Éditeur du site</h2>
          <p>
            Le site <strong className="text-fg">{SITE_NAME}</strong> ({SITE_URL.replace("https://", "")})
            est édité par un particulier à titre non professionnel. Conformément à
            l’article 6 III 2 de la loi pour la confiance dans l’économie numérique
            (LCEN), l’identité de l’éditeur a été communiquée à l’hébergeur du site.
          </p>
          <p>Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
        </section>

        <section className="space-y-2">
          <h2>Directeur de la publication</h2>
          <p>L’éditeur du site, joignable à l’adresse de contact ci-dessus.</p>
        </section>

        <section className="space-y-2">
          <h2>Hébergeur</h2>
          <p>
            Le site est hébergé par <strong className="text-fg">Vercel Inc.</strong>,
            440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis —{" "}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>.
          </p>
          <p>
            Les données sont stockées via <strong className="text-fg">Google Firebase / Firestore</strong>{" "}
            (Google Ireland Ltd / Google LLC).
          </p>
        </section>

        <section className="space-y-2">
          <h2>Données personnelles</h2>
          <p>
            Le traitement des données personnelles est détaillé dans la{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Propriété intellectuelle</h2>
          <p>
            La marque, le nom « {SITE_NAME} », le logo et l’identité visuelle sont la
            propriété de l’éditeur. Les informations relatives aux établissements
            (noms, adresses, notes, avis, photos) proviennent de l’API Google Places
            et restent la propriété de leurs détenteurs respectifs ; elles sont
            affichées à titre informatif.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Cartographie</h2>
          <p>
            Fonds de carte © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>{" "}
            contributors, tuiles © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Responsabilité</h2>
          <p>
            Les classements résultent de votes d’internautes et de données publiques ;
            ils sont fournis à titre indicatif et ne constituent pas un avis officiel.
            L’éditeur ne saurait être tenu responsable d’une inexactitude. Pour toute
            demande de correction ou de retrait, contactez l’adresse ci-dessus.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-[13px] text-mt underline hover:text-fg">← Retour à l’accueil</Link>
      </div>
    </div>
  );
}
