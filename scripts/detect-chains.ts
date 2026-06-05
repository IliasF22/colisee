import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);
const KEY = process.env.GOOGLE_MAPS_API_KEY;

const WRITE = process.argv.includes("--write"); // sinon dry-run
const MIN_REVIEWS = 20;
const MIN_ADDRESSES = 4; // une "chaîne" = au moins 4 adresses distinctes en France
const CATEGORIES = ["poulet-frit", "smash-burger", "pizza", "kebab", "sandwich", "crousti", "thai", "asiatique", "tacos"];

const CATEGORY_TAGLINES: Record<string, string> = {
  "poulet-frit": "Poulet croustillant et généreux.", "smash-burger": "Smash burgers juteux et savoureux.",
  "pizza": "Pizza artisanale au feu de bois.", "kebab": "Kebab grillé à la flamme.",
  "sandwich": "Sandwichs frais et gourmands.", "crousti": "Crousti craquant et fondant.",
  "thai": "Saveurs thaï authentiques.", "asiatique": "Street food asiatique fusion.", "tacos": "Tacos généreux et bien garnis.",
};

// Mots retirés pour SÉPARER la marque (le nom de chaîne) du reste.
const STOP = new Set(["le", "la", "les", "l", "du", "de", "des", "d", "the", "et", "a", "au", "aux", "restaurant", "resto", "chez", "by", "et"]);
const GENERIC = new Set(["smash", "burger", "burgers", "tacos", "taco", "kebab", "kebap", "doner", "pizza", "pizzeria", "chicken", "poulet", "frit", "frits", "fried", "fries", "wok", "thai", "asiatique", "asia", "sandwich", "sandwicherie", "crousti", "crousty", "tenders", "tender", "naan", "grill", "grillade", "bbq", "halal", "food", "street", "snack", "fast"]);
const FORBIDDEN = ["mcdonald", "mcdo", "burger king", "kfc", "quick", "subway", "domino", "pizza hut", "starbucks", "o tacos", "paul", "brioche doree", "five guys"];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[^a-z0-9]+/g, " ").trim();
}
function isForbidden(name: string): boolean {
  const n = normalize(name);
  return FORBIDDEN.some((c) => n.includes(c));
}
// On ne garde que des lieux de restauration (exclut mosquée, coiffeur, épilation laser…).
const FOOD_TYPES = ["restaurant", "food", "meal_takeaway", "meal_delivery", "cafe", "bakery"];
function isFood(r: any): boolean {
  return Array.isArray(r.types) && r.types.some((t: string) => FOOD_TYPES.includes(t));
}
// Détection POSITIVE : une adresse FR de l'API (region=fr) finit par « <5 chiffres> <Ville> »
// (pas de pays mentionné). Tout le reste (Londres UK, Lahore Pakistan…) est rejeté.
function isFrance(address: string): boolean {
  const segs = address.split(",").map((s) => s.trim()).filter(Boolean);
  const last = segs[segs.length - 1] || "";
  return /^\d{5}\s+\S/.test(last);
}
function placeIdFromDocId(id: string): string {
  for (const c of CATEGORIES) if (id.endsWith(`_${c}`)) return id.slice(0, -(c.length + 1));
  return id;
}
function cityFromAddress(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) { const m = part.match(/^\d{5}\s+(.+)$/); if (m) return m[1].trim(); }
  const meaningful = parts.filter((p) => !/^france$/i.test(p) && !/^\d{4,5}$/.test(p));
  return meaningful[meaningful.length - 1] || parts[0] || "";
}
// Nom débarrassé de sa propre ville/arrondissement (sert de requête de recherche).
function queryName(name: string, address: string): string {
  const cityTok = new Set(normalize(cityFromAddress(address)).split(" ").filter(Boolean));
  return normalize(name).split(" ").filter((t) => t && !cityTok.has(t) && !/^([1-9]|1[0-9]|20)$/.test(t)).join(" ");
}
// Tokens distinctifs de la marque (requête sans stopwords ni mots de catégorie).
function brandTokens(qName: string): string[] {
  return qName.split(" ").filter((t) => t && !STOP.has(t) && !GENERIC.has(t));
}
function isDistinctive(tokens: string[]): boolean {
  if (!tokens.length) return false;
  return tokens.some((t) => /\d/.test(t) || t.length >= 4);
}

async function textsearch(q: string): Promise<any[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&region=fr&key=${KEY}`;
  const data = await (await fetch(url)).json();
  return data.results || [];
}

async function run() {
  const snap = await getDocs(collection(db, "fastfoods"));
  const existing = new Set<string>();
  type Grp = { query: string; tokens: string[]; category: Record<string, number>; ourCount: number };
  const groups = new Map<string, Grp>();

  snap.forEach((d) => {
    const x = d.data() as any;
    existing.add(placeIdFromDocId(d.id));
    if (!x.location?.address) return;
    const qn = queryName(x.name || "", x.location.address);
    const tokens = brandTokens(qn);
    if (!isDistinctive(tokens)) return;
    const key = tokens.join(" ");
    const g = groups.get(key) || { query: qn, tokens, category: {}, ourCount: 0 };
    if (qn.length < g.query.length || g.ourCount === 0) g.query = qn; // requête la plus courte = marque la plus nette
    g.category[x.category] = (g.category[x.category] || 0) + 1;
    g.ourCount++;
    groups.set(key, g);
  });

  console.log(`${existing.size} restos en base · ${groups.size} marques distinctives à sonder · mode=${WRITE ? "ÉCRITURE" : "DRY-RUN"}\n`);

  const chains: Array<{ name: string; tokens: string[]; cat: string; total: number; toAdd: any[]; cities: string[] }> = [];

  for (const g of groups.values()) {
    let results: any[];
    try { results = await textsearch(g.query); } catch { continue; }
    await new Promise((r) => setTimeout(r, 150));

    const branches = results.filter((r: any) => {
      if (!r.geometry?.location || !r.formatted_address) return false;
      if (!isFrance(r.formatted_address)) return false; // France uniquement
      if (!isFood(r)) return false; // restaurants uniquement
      if (r.business_status && r.business_status !== "OPERATIONAL") return false;
      if (isForbidden(r.name || "")) return false;
      if ((r.user_ratings_total ?? 0) < MIN_REVIEWS) return false;
      const rn = normalize(r.name || "");
      return g.tokens.every((t) => new RegExp(`(^| )${t}( |$)`).test(rn)); // tous les tokens de marque présents
    });

    const distinct = new Map<string, any>();
    branches.forEach((r: any) => distinct.set(r.place_id, r));
    if (distinct.size < MIN_ADDRESSES) continue; // pas assez d'adresses → pas une chaîne confirmée

    const cat = Object.entries(g.category).sort((a, b) => b[1] - a[1])[0][0];
    const toAdd = [...distinct.values()].filter((r) => !existing.has(r.place_id));
    chains.push({
      name: g.query, tokens: g.tokens, cat, total: distinct.size, toAdd,
      cities: [...distinct.values()].map((r) => cityFromAddress(r.formatted_address)),
    });
  }

  chains.sort((a, b) => b.toAdd.length - a.toAdd.length);

  let totalNew = 0;
  console.log("=== CHAÎNES DÉTECTÉES (nom · adresses Google · nouvelles à ajouter) ===\n");
  for (const c of chains) {
    totalNew += c.toAdd.length;
    const flag = c.toAdd.length === 0 ? "  " : "+ ";
    console.log(`${flag}"${c.name}" [${c.cat}] · ${c.total} adresses · +${c.toAdd.length} → ${[...new Set(c.cities)].slice(0, 8).join(", ")}`);
  }
  console.log(`\n${chains.length} chaînes · ${totalNew} antennes nouvelles potentielles.`);

  if (!WRITE) { console.log("\n(DRY-RUN : rien écrit. Relancer avec --write pour ajouter.)"); process.exit(0); }

  let added = 0;
  for (const c of chains) {
    for (const r of c.toAdd) {
      if (existing.has(r.place_id)) continue;
      existing.add(r.place_id);
      const photoUrl = r.photos?.length
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${r.photos[0].photo_reference}&key=${KEY}`
        : "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80";
      await setDoc(doc(db, "fastfoods", `${r.place_id}_${c.cat}`), {
        name: r.name, chain: c.name, category: c.cat, image_url: photoUrl,
        location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng, address: r.formatted_address },
        neighborhood: cityFromAddress(r.formatted_address),
        tagline: CATEGORY_TAGLINES[c.cat] || "Un spot à découvrir.",
        google_reviews: r.user_ratings_total ?? 0, google_rating: r.rating ?? null,
        elo_score: 1500, total_matches: 0, wins: 0, losses: 0,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      });
      added++;
    }
  }
  console.log(`\nÉCRITURE terminée : ${added} antennes ajoutées.`);
  process.exit(0);
}

run();
