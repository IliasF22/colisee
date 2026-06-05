/**
 * Garantit que la base ne contient QUE des fast-foods.
 * Re-vérifie chaque entrée via Google Place Details (types) et repère :
 *   - les lieux qui ne sont pas de la restauration (mosquée, coiffeur, laser…)
 *   - les lieux définitivement fermés
 *   - (secours) les noms manifestement non-restaurant / adresses étrangères
 *
 *   npx tsx scripts/purge-nonfood.ts            # SCAN (lecture seule) → écrit la liste + l'affiche
 *   npx tsx scripts/purge-nonfood.ts --delete   # supprime les entrées de la liste
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);
const KEY = process.env.GOOGLE_MAPS_API_KEY;
const DELETE = process.argv.includes("--delete");
const LIST_FILE = resolve(process.cwd(), "scripts/.purge-list.json");

const CATEGORIES = ["poulet-frit", "smash-burger", "pizza", "kebab", "sandwich", "crousti", "thai", "asiatique", "tacos"];
const FOOD_TYPES = ["restaurant", "food", "meal_takeaway", "meal_delivery", "cafe", "bakery"];
const NONFOOD_NAME = ["coiffeur", "coiffure", "barber", "epilation", "laser", "mosquee", "mosque", "camii", "eglise", "temple", "synagogue", "institut", "beaute", "pharmacie", "opticien", "optique", "tabac", "presse", "banque", "assurance", "immobil", "agence", "auto ecole", "garage", "clinique", "dentaire", "veterinaire", "fitness", "gym ", "spa", "manucure", "ongle", "tattoo", "tatouage", "pressing", "laverie", "supermarche", "hotel", "mairie", "ecole"];
const FOREIGN = ["pakistan", "switzerland", "suisse", "germany", "deutschland", "spain", "espagne", "italy", "italia", "belgium", "belgique", "morocco", "maroc", "algeria", "algerie", "tunisia", "norway", "ivoire", "reunion", "united states", "united kingdom"];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[^a-z0-9]+/g, " ").trim();
}
function placeIdFromDocId(id: string): string {
  for (const c of CATEGORIES) if (id.endsWith(`_${c}`)) return id.slice(0, -(c.length + 1));
  return id;
}
function nameIsNonFood(name: string): boolean {
  const n = ` ${normalize(name)} `;
  return NONFOOD_NAME.some((k) => n.includes(` ${k}`.replace(/\s+$/, "")) || n.includes(k));
}
function addrIsForeign(addr: string): boolean {
  const n = normalize(addr);
  return FOREIGN.some((c) => new RegExp(`\\b${c}\\b`).test(n)) || /\buk\b/.test(n);
}

async function fetchTypes(placeId: string): Promise<{ types: string[]; status?: string; biz?: string }> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=types,business_status&key=${KEY}`;
  const data = await (await fetch(url)).json();
  return { types: data.result?.types || [], status: data.status, biz: data.result?.business_status };
}

async function scan() {
  const snap = await getDocs(collection(db, "fastfoods"));
  const docsArr = snap.docs;
  console.log(`Scan de ${docsArr.length} entrées via Google…\n`);

  const flagged: { id: string; name: string; addr: string; reason: string }[] = [];
  let checked = 0;

  for (const d of docsArr) {
    const x = d.data() as any;
    const name = x.name || "";
    const addr = x.location?.address || "";

    // Filtres locaux instantanés (pas d'API).
    if (nameIsNonFood(name)) { flagged.push({ id: d.id, name, addr, reason: "nom non-restaurant" }); continue; }
    if (addrIsForeign(addr)) { flagged.push({ id: d.id, name, addr, reason: "hors France" }); continue; }

    // Vérification Google des types.
    try {
      const { types, status, biz } = await fetchTypes(placeIdFromDocId(d.id));
      if (status === "OK") {
        if (biz === "CLOSED_PERMANENTLY") { flagged.push({ id: d.id, name, addr, reason: "fermé définitivement" }); }
        else if (types.length && !types.some((t) => FOOD_TYPES.includes(t))) {
          flagged.push({ id: d.id, name, addr, reason: `non-restaurant (${types.slice(0, 3).join(",")})` });
        }
      }
    } catch { /* on n'enlève pas sur erreur API */ }

    checked++;
    if (checked % 100 === 0) console.log(`  …${checked}/${docsArr.length}`);
    await new Promise((r) => setTimeout(r, 80));
  }

  writeFileSync(LIST_FILE, JSON.stringify(flagged, null, 2));
  console.log(`\n=== ${flagged.length} entrées NON-restaurant détectées ===\n`);
  flagged.forEach((f) => console.log(` - "${f.name}" @ ${f.addr}  [${f.reason}]`));
  console.log(`\nListe écrite dans scripts/.purge-list.json`);
  console.log(`Pour supprimer ces ${flagged.length} entrées : npx tsx scripts/purge-nonfood.ts --delete`);
  process.exit(0);
}

async function purge() {
  if (!existsSync(LIST_FILE)) { console.error("Aucune liste. Lance d'abord le scan (sans --delete)."); process.exit(1); }
  const flagged: { id: string; name: string }[] = JSON.parse(readFileSync(LIST_FILE, "utf8"));
  console.log(`Suppression de ${flagged.length} entrées…\n`);
  for (const f of flagged) {
    await deleteDoc(doc(db, "fastfoods", f.id));
    console.log(`   🗑️  ${f.name}`);
  }
  console.log(`\n${flagged.length} entrées supprimées.`);
  process.exit(0);
}

(DELETE ? purge() : scan());
