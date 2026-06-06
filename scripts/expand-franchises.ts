
import { getAdminDb, Timestamp, getDocs, setDoc, collection, doc } from "./_admin-db.js";
const db = getAdminDb();
const KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const CATEGORIES = ["poulet-frit", "smash-burger", "pizza", "kebab", "sandwich", "crousti", "thai", "asiatique", "tacos"];
const MIN_REVIEWS = 20;

const CATEGORY_TAGLINES: Record<string, string> = {
  "poulet-frit": "Poulet croustillant et généreux.",
  "smash-burger": "Smash burgers juteux et savoureux.",
  "pizza": "Pizza artisanale au feu de bois.",
  "kebab": "Kebab grillé à la flamme.",
  "sandwich": "Sandwichs frais et gourmands.",
  "crousti": "Crousti craquant et fondant.",
  "thai": "Saveurs thaï authentiques.",
  "asiatique": "Street food asiatique fusion.",
  "tacos": "Tacos généreux et bien garnis.",
};

// Liste de franchises (multi-adresses) à compléter.
//  - query : la recherche Google
//  - match : token normalisé que le nom DOIT contenir (anti faux-positifs)
//  - category : catégorie attribuée à toutes les antennes
const FRANCHISES: Array<{ query: string; match: string; category: string }> = [
  { query: "Le 129", match: "129", category: "sandwich" },
  { query: "Maïga Smash Eats", match: "maiga", category: "smash-burger" },
  { query: "Chamas Tacos", match: "chamas", category: "tacos" },
  { query: "Berliner Das Original", match: "berliner das original", category: "kebab" },
  { query: "Tacozh", match: "tacozh", category: "tacos" },
  { query: "Enjoy Tacos", match: "enjoy tacos", category: "tacos" },
];

const FORBIDDEN_CHAINS = [
  "mcdonald", "mcdo", "burger king", "kfc", "quick", "subway",
  "domino", "pizza hut", "starbucks", "paul", "brioche doree", "five guys",
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // accents combinants
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isForbidden(name: string): boolean {
  const n = normalize(name);
  return FORBIDDEN_CHAINS.some((c) => n.includes(c));
}

function placeIdFromDocId(id: string): string {
  for (const c of CATEGORIES) if (id.endsWith(`_${c}`)) return id.slice(0, -(c.length + 1));
  return id;
}

const FOOD_TYPES = ["restaurant", "food", "meal_takeaway", "meal_delivery", "cafe", "bakery"];
function isFood(r: any): boolean {
  return Array.isArray(r.types) && r.types.some((t: string) => FOOD_TYPES.includes(t));
}
function isFrance(address: string): boolean {
  const segs = address.split(",").map((s) => s.trim()).filter(Boolean);
  return /^\d{5}\s+\S/.test(segs[segs.length - 1] || "");
}

function cityFromAddress(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^\d{5}\s+(.+)$/);
    if (m) return m[1].trim();
  }
  const meaningful = parts.filter((p) => !/^france$/i.test(p) && !/^\d{4,5}$/.test(p));
  return meaningful[meaningful.length - 1] || parts[0] || "";
}

async function run() {
  // Place_ids déjà présents (toutes catégories) → on ne duplique jamais une adresse.
  const snap = await getDocs(collection(db, "fastfoods"));
  const existing = new Set<string>();
  snap.forEach((d) => existing.add(placeIdFromDocId(d.id)));
  console.log(`${existing.size} restos déjà en base.\n`);

  let added = 0;

  for (const fr of FRANCHISES) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fr.query)}&region=fr&key=${GOOGLE_MAPS_API_KEY}`;
    const data = await (await fetch(url)).json();
    const results = data.results || [];

    const branches = results.filter((r: any) =>
      normalize(r.name || "").includes(fr.match) &&
      r.geometry?.location && r.formatted_address &&
      isFrance(r.formatted_address) &&
      isFood(r) &&
      (!r.business_status || r.business_status === "OPERATIONAL") &&
      !isForbidden(r.name || "") &&
      (r.user_ratings_total ?? 0) >= MIN_REVIEWS,
    );

    console.log(`▸ ${fr.query} : ${branches.length} antennes trouvées`);

    for (const r of branches) {
      if (existing.has(r.place_id)) {
        console.log(`    = déjà présent : ${r.name} (${cityFromAddress(r.formatted_address)})`);
        continue;
      }
      existing.add(r.place_id);

      const photoUrl = r.photos?.length
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${r.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
        : "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80";

      await setDoc(doc(db, "fastfoods", `${r.place_id}_${fr.category}`), {
        name: r.name,
        chain: fr.query,
        category: fr.category,
        image_url: photoUrl,
        location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng, address: r.formatted_address },
        neighborhood: cityFromAddress(r.formatted_address),
        tagline: CATEGORY_TAGLINES[fr.category] || "Un spot à découvrir.",
        google_reviews: r.user_ratings_total ?? 0,
        google_rating: r.rating ?? null,
        elo_score: 1500,
        total_matches: 0,
        wins: 0,
        losses: 0,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      console.log(`    ✅ ${r.name} (${cityFromAddress(r.formatted_address)}) · ${r.user_ratings_total} avis`);
      added++;
    }
    await new Promise((res) => setTimeout(res, 200));
  }

  console.log(`\nTerminé ! ${added} antennes de franchises ajoutées.`);
  process.exit(0);
}

run();
