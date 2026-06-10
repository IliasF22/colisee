import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Colisée",
  description: "Comment Colisée traite vos données personnelles (RGPD).",
  alternates: { canonical: `${SITE_URL}/confidentialite` },
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "thefrejman@gmail.com";

export default function Confidentialite() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-cinzel text-2xl font-bold tracking-wide sm:text-3xl">
        Politique de confidentialité
      </h1>
      <p className="mt-2 text-[13px] text-mt">Dernière mise à jour : {new Date().getFullYear()}</p>

      <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-mt [&_h2]:font-cinzel [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-fg [&_h2]:tracking-wide [&_a]:text-gld [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-fg">
        <section className="space-y-2">
          <p>
            La présente politique explique quelles données personnelles {SITE_NAME}{" "}
            traite, pourquoi, et quels sont vos droits. Le responsable du traitement
            est l’éditeur du site (voir les{" "}
            <Link href="/mentions-legales">mentions légales</Link>), joignable à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2>1. Données que nous traitons</h2>
          <ul>
            <li><strong>Compte</strong> (si vous vous connectez) : adresse e-mail, nom et photo de profil, via Google Firebase Authentication.</li>
            <li><strong>Propositions et signalements</strong> : nom, e-mail et contenu que vous soumettez.</li>
            <li><strong>Localisation</strong> : votre position GPS, <em>uniquement si vous l’activez</em>, pour afficher les fast-foods proches. La position précise n’est pas conservée ; seule la ville choisie est mémorisée localement sur votre appareil.</li>
            <li><strong>Données techniques</strong> : adresse IP et journaux de connexion, traités par l’hébergeur et le réseau de diffusion.</li>
            <li><strong>Stockage local (localStorage)</strong> : préférences (ville, thème) et votre activité de vote, de façon <strong>anonyme</strong>. Aucun cookie publicitaire.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2>2. Finalités et bases légales</h2>
          <ul>
            <li>Fournir et faire fonctionner le service (duels, classements, carte) — <em>intérêt légitime</em>.</li>
            <li>Gérer l’authentification — <em>mesure pré-contractuelle / consentement</em>.</li>
            <li>Modérer les propositions et signalements, prévenir les abus — <em>intérêt légitime</em>.</li>
            <li>Afficher les fast-foods proches — <em>consentement</em> (activation de la géolocalisation).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2>3. Cookies et traceurs</h2>
          <p>
            {SITE_NAME} <strong>n’utilise aucun cookie publicitaire ni outil de suivi
            statistique</strong> (pas de Google Analytics, pas de pixel publicitaire).
            Seuls des éléments strictement nécessaires au fonctionnement sont utilisés
            (par ex. la session de connexion, le stockage local de vos préférences).
            Aucun bandeau de consentement n’est donc requis.
          </p>
        </section>

        <section className="space-y-2">
          <h2>4. Destinataires et sous-traitants</h2>
          <p>Vos données peuvent être traitées par nos prestataires techniques :</p>
          <ul>
            <li><strong>Google</strong> (Firebase Authentication, Firestore, Google Places) — base de données et identification.</li>
            <li><strong>Vercel Inc.</strong> — hébergement et diffusion du site.</li>
            <li><strong>CARTO</strong> et <strong>OpenStreetMap</strong> — fonds de carte.</li>
          </ul>
          <p>Aucune donnée n’est vendue ni cédée à des fins publicitaires.</p>
        </section>

        <section className="space-y-2">
          <h2>5. Transferts hors Union européenne</h2>
          <p>
            Certains prestataires (Google, Vercel) sont situés aux États-Unis. Ces
            transferts sont encadrés par des garanties appropriées (clauses
            contractuelles types et/ou Data Privacy Framework UE–États-Unis).
          </p>
        </section>

        <section className="space-y-2">
          <h2>6. Durée de conservation</h2>
          <ul>
            <li>Données de compte : tant que le compte est actif.</li>
            <li>Propositions et signalements : le temps nécessaire à leur traitement et au suivi.</li>
            <li>Journaux techniques : durée courte, conformément aux pratiques de l’hébergeur.</li>
            <li>Stockage local : jusqu’à effacement par vos soins (vider les données du navigateur).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2>7. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d’un droit d’accès, de rectification,
            d’effacement, d’opposition, de limitation et de portabilité de vos données.
            Pour les exercer, écrivez à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Vous pouvez également
            introduire une réclamation auprès de la{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2>8. Sécurité</h2>
          <p>
            Les données sont protégées par les mesures techniques de nos prestataires
            (chiffrement en transit, contrôle d’accès). L’accès en écriture à la base
            est restreint par des règles de sécurité.
          </p>
        </section>

        <section className="space-y-2">
          <h2>9. Modifications</h2>
          <p>
            Cette politique peut être mise à jour. La date de dernière révision est
            indiquée en haut de page.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-[13px] text-mt underline hover:text-fg">← Retour à l’accueil</Link>
      </div>
    </div>
  );
}
