/**
 * Marque les restos appartenant à une franchise (même marque à >= 2 adresses).
 * Met à jour is_franchise + franchise_name (sans toucher aux scores).
 *
 *   npx tsx scripts/tag-franchises.ts            # aperçu
 *   npx tsx scripts/tag-franchises.ts --write    # applique
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);
const WRITE = process.argv.includes("--write");

const STOP = new Set(["le", "la", "les", "l", "du", "de", "des", "d", "the", "et", "a", "au", "aux", "restaurant", "resto", "chez", "by"]);
const GENERIC = new Set(["smash", "burger", "burgers", "tacos", "taco", "kebab", "kebap", "doner", "pizza", "pizzeria", "chicken", "poulet", "frit", "frits", "fried", "fries", "wok", "thai", "asiatique", "asia", "sandwich", "sandwicherie", "crousti", "crousty", "tenders", "tender", "naan", "grill", "grillade", "bbq", "halal", "food", "street", "snack", "fast"]);
const NONFOOD = ["coiffeur", "coiffure", "barber", "epilation", "laser", "mosquee", "camii", "institut", "beaute", "pharmacie", "opticien"];
// Mots communs (à token unique) qui NE sont PAS des franchises : juste des noms de restos répandus.
const DENY = new Set(["royal", "king", "house", "tasty", "master", "must", "casa", "corner", "station", "sultan", "georges", "coco", "ancien", "capri", "pacha", "prince", "palace", "family", "kitchen", "club", "best", "good", "central", "village", "express", "snack", "bistro", "brasserie", "maison", "gourmet", "paradis", "super", "mega", "top", "classic", "premium", "istanbul", "bosphore", "anatolie", "antalya", "marina", "oasis", "soleil", "etoile", "delice", "delices", "saveur", "saveurs", "comptoir"]);

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[^a-z0-9]+/g, " ").trim();
}
function isNonFood(name: string): boolean {
  const n = normalize(name);
  return NONFOOD.some((j) => n.includes(j));
}
function cityFromAddress(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) { const m = part.match(/^\d{5}\s+(.+)$/); if (m) return m[1].trim(); }
  return "";
}
function queryName(name: string, address: string): string {
  const cityTok = new Set(normalize(cityFromAddress(address)).split(" ").filter(Boolean));
  return normalize(name).split(" ").filter((t) => t && !cityTok.has(t) && !/^([1-9]|1[0-9]|20)$/.test(t)).join(" ");
}
function isDistinctive(tokens: string[]): boolean {
  return tokens.length > 0 && tokens.some((t) => /\d/.test(t) || t.length >= 4);
}

/**
 * Clé de marque pour regrouper les franchises.
 * On retire d'abord les mots de catégorie (« crousty », « burger »…). Mais si ça
 * ne laisse rien d'exploitable (vide, ou un seul mot trop commun comme « tasty »),
 * on retombe sur le nom complet (« tasty crousty ») pour rester précis.
 */
function franchiseKey(name: string, address: string): string {
  const qn = queryName(name, address);
  const full = qn.split(" ").filter((t) => t && !STOP.has(t));
  const stripped = full.filter((t) => !GENERIC.has(t));
  const strippedOk = isDistinctive(stripped) && !(stripped.length === 1 && DENY.has(stripped[0]));
  const base = strippedOk ? stripped : full;

  if (base.length >= 2) return base.join(" ");
  if (base.length === 1) {
    const t = base[0];
    if (/\d/.test(t) || (t.length >= 4 && !DENY.has(t))) return t;
  }
  return "";
}
function titleCase(s: string): string {
  return s.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

(async () => {
  const snap = await getDocs(collection(db, "fastfoods"));
  type Row = { id: string; name: string; cur: boolean; key: string; qn: string };
  const rows: Row[] = [];
  const counts = new Map<string, number>();

  snap.forEach((d) => {
    const x = d.data() as any;
    if (!x.location?.address || isNonFood(x.name || "")) {
      rows.push({ id: d.id, name: x.name, cur: !!x.is_franchise, key: "", qn: "" });
      return;
    }
    const key = franchiseKey(x.name || "", x.location.address);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
    rows.push({ id: d.id, name: x.name, cur: !!x.is_franchise, key, qn: titleCase(key) });
  });

  const franchiseKeys = new Set([...counts.entries()].filter(([, n]) => n >= 2).map(([k]) => k));
  console.log(`${snap.size} restos · ${franchiseKeys.size} franchises (>=2 adresses) · mode=${WRITE ? "ÉCRITURE" : "APERÇU"}\n`);

  let changed = 0;
  for (const r of rows) {
    const shouldBe = !!r.key && franchiseKeys.has(r.key);
    if (shouldBe === r.cur && shouldBe) continue;      // déjà taggé correctement
    if (!shouldBe && !r.cur) continue;                  // déjà non-franchise
    changed++;
    if (WRITE) {
      const patch: any = { is_franchise: shouldBe, updated_at: Timestamp.now() };
      if (shouldBe) patch.franchise_name = titleCase(r.qn);
      await updateDoc(doc(db, "fastfoods", r.id), patch);
    }
  }

  const top = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log("Top franchises détectées :");
  top.forEach(([k, n]) => console.log(`  ${n}×  ${titleCase(k)}`));
  console.log(`\n${changed} restos ${WRITE ? "mis à jour" : "à mettre à jour"}.`);
  if (!WRITE) console.log("(Aperçu. Relance avec --write pour appliquer.)");
  process.exit(0);
})();
