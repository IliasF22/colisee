/**
 * Marque (hidden=true) toutes les entrées qui ne sont pas des fast-foods,
 * pour qu'elles disparaissent de l'app — SANS suppression (réversible).
 * Règle stricte : il faut un vrai type "restaurant" Google, et on exclut
 * les épiceries/supermarchés/magasins/services (même typés "food").
 *
 *   npx tsx scripts/hide-nonfood.ts          # SCAN (lecture seule) → liste + fichier
 *   npx tsx scripts/hide-nonfood.ts --apply  # applique hidden=true (depuis le fichier)
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, Timestamp } from "firebase/firestore";
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
const APPLY = process.argv.includes("--apply");
const LIST_FILE = resolve(process.cwd(), "scripts/.hide-list.json");

const CATEGORIES = ["poulet-frit", "smash-burger", "pizza", "kebab", "sandwich", "crousti", "thai", "asiatique", "tacos"];

// Vrais types "restauration".
const RESTO = ["restaurant", "meal_takeaway", "meal_delivery"];
// Signaux "nourriture" larges (le type "food" inclut les épiceries → pas suffisant seul).
const FOODISH = [...RESTO, "cafe", "bakery", "food"];
// Types qui disqualifient (commerce / service / lieu non-restauration).
const BAD = ["grocery_or_supermarket", "supermarket", "convenience_store", "liquor_store", "store", "shopping_mall", "department_store", "clothing_store", "electronics_store", "furniture_store", "home_goods_store", "shoe_store", "jewelry_store", "book_store", "hardware_store", "pet_store", "florist", "lodging", "hair_care", "beauty_salon", "spa", "gym", "health", "doctor", "dentist", "hospital", "pharmacy", "drugstore", "physiotherapist", "lawyer", "accounting", "finance", "bank", "atm", "insurance_agency", "real_estate_agency", "travel_agency", "car_repair", "car_rental", "car_dealer", "car_wash", "gas_station", "parking", "transit_station", "place_of_worship", "mosque", "church", "hindu_temple", "synagogue", "cemetery", "school", "university", "primary_school", "secondary_school", "library", "night_club", "casino", "movie_theater", "bowling_alley", "laundry", "locksmith", "moving_company", "storage", "veterinary_care", "tourist_attraction", "amusement_park", "aquarium", "zoo", "park", "stadium"];

const NONFOOD_NAME = ["coiffeur", "coiffure", "barber", "epilation", "laser", "mosquee", "mosque", "camii", "eglise", "temple", "synagogue", "institut", "pharmacie", "opticien", "tabac", "marche", "supermarche", "epicerie", "carcasas", "avocat", "dentiste", "docteur", "garage", "hotel", "pneus", "telecom", "immobilier", "banque", "assurance"];
const FOREIGN = ["pakistan", "switzerland", "suisse", "germany", "spain", "espagne", "italy", "italia", "belgium", "belgique", "morocco", "maroc", "algeria", "algerie", "tunisia", "norway", "ivoire", "reunion", "united states", "united kingdom"];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[^a-z0-9]+/g, " ").trim();
}
function placeIdFromDocId(id: string): string {
  for (const c of CATEGORIES) if (id.endsWith(`_${c}`)) return id.slice(0, -(c.length + 1));
  return id;
}
function nameNonFood(name: string): boolean {
  const n = ` ${normalize(name)} `;
  return NONFOOD_NAME.some((k) => n.includes(` ${k} `) || n.includes(` ${k}`) || n.includes(`${k} `));
}
function addrForeign(addr: string): boolean {
  const n = normalize(addr);
  return FOREIGN.some((c) => new RegExp(`\\b${c}\\b`).test(n)) || /\buk\b/.test(n);
}

async function fetchTypes(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=types,business_status&key=${KEY}`;
  const data = await (await fetch(url)).json();
  return { types: (data.result?.types || []) as string[], status: data.status as string };
}

async function scan() {
  const snap = await getDocs(collection(db, "fastfoods"));
  console.log(`Scan strict de ${snap.docs.length} entrées via Google…\n`);
  const flagged: { id: string; name: string; addr: string; reason: string }[] = [];
  let done = 0;

  for (const d of snap.docs) {
    const x = d.data() as any;
    const name = x.name || "";
    const addr = x.location?.address || "";

    if (nameNonFood(name)) { flagged.push({ id: d.id, name, addr, reason: "nom non-restaurant" }); continue; }
    if (addrForeign(addr)) { flagged.push({ id: d.id, name, addr, reason: "hors France" }); continue; }

    try {
      const { types, status } = await fetchTypes(placeIdFromDocId(d.id));
      if (status === "OK" && types.length) {
        const hasFoodish = types.some((t) => FOODISH.includes(t));
        const hasResto = types.some((t) => RESTO.includes(t));
        const hasBad = types.some((t) => BAD.includes(t));
        if (!hasFoodish || (hasBad && !hasResto)) {
          flagged.push({ id: d.id, name, addr, reason: `non-restaurant (${types.slice(0, 3).join(",")})` });
        }
      }
    } catch { /* on ne masque pas sur erreur API */ }

    if (++done % 100 === 0) console.log(`  …${done}/${snap.docs.length}`);
    await new Promise((r) => setTimeout(r, 80));
  }

  writeFileSync(LIST_FILE, JSON.stringify(flagged, null, 2));
  console.log(`\n=== ${flagged.length} entrées NON-fast-food ===\n`);
  flagged.forEach((f) => console.log(` - "${f.name}" @ ${f.addr}  [${f.reason}]`));
  console.log(`\nÉcrit dans scripts/.hide-list.json · pour masquer : npx tsx scripts/hide-nonfood.ts --apply`);
  process.exit(0);
}

async function apply() {
  if (!existsSync(LIST_FILE)) { console.error("Pas de liste. Lance d'abord le scan."); process.exit(1); }
  const flagged: { id: string; name: string }[] = JSON.parse(readFileSync(LIST_FILE, "utf8"));
  console.log(`Masquage de ${flagged.length} entrées…\n`);
  for (const f of flagged) {
    await setDoc(doc(db, "fastfoods", f.id), { hidden: true, updated_at: Timestamp.now() }, { merge: true });
    console.log(`   🙈 ${f.name}`);
  }
  console.log(`\n${flagged.length} entrées masquées (réversible : champ hidden=true).`);
  process.exit(0);
}

(APPLY ? apply() : scan());
