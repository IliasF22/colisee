/**
 * Supprime les entrées parasites ajoutées par erreur :
 *  - hors métropole (Pakistan, UK, Suisse, USA, Côte d'Ivoire, Réunion…)
 *  - non-restaurants (coiffeur, barber, épilation laser, mosquée…)
 * Ciblage strict par marqueur → Amiens et les vrais restos sont conservés.
 *
 *   npx tsx scripts/cleanup-foreign.ts            # aperçu (ne supprime rien)
 *   npx tsx scripts/cleanup-foreign.ts --confirm  # supprime réellement
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);
const CONFIRM = process.argv.includes("--confirm");

// Marqueurs de pays / DOM étrangers (normalisés). Amiens (France) n'en contient aucun → conservé.
const FOREIGN_MARKERS = ["pakistan", "switzerland", "suisse", "usa", "united states", "ivoire", "reunion"];
// Marqueurs (dans le NOM) de lieux qui ne sont pas des restaurants.
const NONFOOD_MARKERS = ["coiffeur", "coiffure", "barber", "epilation", "laser", "mosquee", "camii", "institut de beaute", "pharmacie", "opticien"];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[^a-z0-9]+/g, " ").trim();
}

(async () => {
  const snap = await getDocs(collection(db, "fastfoods"));
  const targets: { id: string; name: string; addr: string }[] = [];

  snap.forEach((d) => {
    const x = d.data() as any;
    const addr = (x.location?.address || "");
    const an = normalize(addr);
    const nameN = normalize(x.name || "");
    const foreign = FOREIGN_MARKERS.some((m) => new RegExp(`\\b${m}\\b`).test(an)) || /\buk\b/.test(an);
    const nonFood = NONFOOD_MARKERS.some((m) => nameN.includes(m));
    if (foreign || nonFood) targets.push({ id: d.id, name: x.name, addr });
  });

  console.log(`${snap.size} restos en base · ${targets.length} hors métropole ciblés${CONFIRM ? " (SUPPRESSION)" : " (aperçu)"} :\n`);
  for (const t of targets) console.log(` - "${t.name}" @ ${t.addr}`);

  if (!CONFIRM) {
    console.log(`\nAperçu seulement. Relance avec --confirm pour supprimer ces ${targets.length} entrées.`);
    process.exit(0);
  }

  for (const t of targets) {
    await deleteDoc(doc(db, "fastfoods", t.id));
    console.log(`   🗑️  supprimé : ${t.name}`);
  }
  console.log(`\n${targets.length} entrées supprimées.`);
  process.exit(0);
})();
