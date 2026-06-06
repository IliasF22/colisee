/**
 * Repère les VRAIS restaurants (pas des fast-foods) via la nouvelle Google Places API :
 *  - primaryType = cuisine sit-down (français, gastro, brasserie, fruits de mer, steak…)
 *  - OU prix €€€+ (EXPENSIVE / VERY_EXPENSIVE)
 * …sauf si "fast_food_restaurant" figure dans les types (alors c'est un fast-food).
 * Masque via le champ hidden (réversible).
 *
 *   npx tsx scripts/filter-restaurants.ts          # SCAN (lecture seule) → liste + fichier
 *   npx tsx scripts/filter-restaurants.ts --apply  # masque (depuis le fichier)
 */
import { resolve } from "path";
import { getAdminDb, Timestamp, getDocs, setDoc, collection, doc } from "./_admin-db.js";
const db = getAdminDb();
import { readFileSync, writeFileSync, existsSync } from "fs";

const KEY = process.env.GOOGLE_MAPS_API_KEY!;
const APPLY = process.argv.includes("--apply");
const LIST_FILE = resolve(process.cwd(), "scripts/.restaurants-list.json");
const CATEGORIES = ["poulet-frit", "smash-burger", "pizza", "kebab", "sandwich", "crousti", "thai", "asiatique", "tacos"];

// primaryType de cuisines "à table" = pas du fast-food.
const REAL_TYPES = new Set([
  "french_restaurant", "fine_dining_restaurant", "seafood_restaurant", "steak_house",
  "brasserie", "gastropub", "wine_bar", "bar_and_grill", "mediterranean_restaurant",
  "spanish_restaurant", "greek_restaurant", "modern_european_restaurant", "tapas_restaurant",
]);
const EXPENSIVE = new Set(["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"]);

function placeIdFromDocId(id: string): string {
  for (const c of CATEGORIES) if (id.endsWith(`_${c}`)) return id.slice(0, -(c.length + 1));
  return id;
}

async function fetchPlace(placeId: string) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "primaryType,types,priceLevel" },
  });
  if (!r.ok) return null;
  return r.json();
}

async function scan() {
  const snap = await getDocs(collection(db, "fastfoods"));
  const docsArr = snap.docs.filter((d) => !(d.data() as any).hidden);
  console.log(`Scan de ${docsArr.length} restos via la nouvelle API…\n`);

  const flagged: { id: string; name: string; addr: string; reason: string }[] = [];
  let done = 0;

  for (const d of docsArr) {
    const x = d.data() as any;
    try {
      const p = await fetchPlace(placeIdFromDocId(d.id));
      if (p) {
        const types: string[] = p.types || [];
        const isFastFood = types.includes("fast_food_restaurant");
        const realType = REAL_TYPES.has(p.primaryType);
        const pricey = EXPENSIVE.has(p.priceLevel);
        if (!isFastFood && (realType || pricey)) {
          flagged.push({ id: d.id, name: x.name, addr: x.location?.address, reason: `${p.primaryType || "?"}${pricey ? " · " + p.priceLevel : ""}` });
        }
      }
    } catch { /* ignore */ }
    if (++done % 100 === 0) console.log(`  …${done}/${docsArr.length} (repérés: ${flagged.length})`);
    await new Promise((r) => setTimeout(r, 60));
  }

  writeFileSync(LIST_FILE, JSON.stringify(flagged, null, 2));
  console.log(`\n=== ${flagged.length} VRAIS RESTAURANTS repérés ===\n`);
  flagged.forEach((f) => console.log(` - "${f.name}" @ ${f.addr}  [${f.reason}]`));
  console.log(`\nÉcrit dans scripts/.restaurants-list.json · pour masquer : npx tsx scripts/filter-restaurants.ts --apply`);
  process.exit(0);
}

async function apply() {
  if (!existsSync(LIST_FILE)) { console.error("Pas de liste. Lance d'abord le scan."); process.exit(1); }
  const flagged: { id: string; name: string }[] = JSON.parse(readFileSync(LIST_FILE, "utf8"));
  console.log(`Masquage de ${flagged.length} vrais restaurants…\n`);
  for (const f of flagged) {
    await setDoc(doc(db, "fastfoods", f.id), { hidden: true, updated_at: Timestamp.now() }, { merge: true });
    console.log(`   🙈 ${f.name}`);
  }
  console.log(`\n${flagged.length} restaurants masqués (réversible : hidden=true).`);
  process.exit(0);
}

(APPLY ? apply() : scan());
