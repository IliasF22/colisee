import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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

function extractNeighborhood(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  for (const part of parts) {
    const match = part.match(/^(\d{5})\s+(.+)$/);
    if (match) {
      const postal = match[1];
      const city = match[2];
      if (postal.startsWith("75")) {
        const a = parseInt(postal.slice(3));
        return a > 0 ? `${city} ${a}e` : city;
      }
      if (postal.startsWith("69")) {
        const a = parseInt(postal.slice(3));
        return a > 0 ? `Lyon ${a}e` : "Lyon";
      }
      if (postal.startsWith("13")) {
        const a = parseInt(postal.slice(3));
        return a > 0 ? `Marseille ${a}e` : "Marseille";
      }
      return city;
    }
  }
  if (parts.length >= 2) return parts[parts.length - 2].replace(/^\d{4,5}\s*/, "");
  return "";
}

// Chaque recherche ramène jusqu'à RESULTS_PER_QUERY spots indépendants.
// On couvre largement l'Île-de-France (zone principale) puis les grandes villes.
const SPOTS_TO_SEED = [
  // ===== ÎLE-DE-FRANCE — Paris (toutes catégories) =====
  { query: "smash burger Paris", category: "smash-burger" },
  { query: "tacos Paris", category: "tacos" },
  { query: "kebab Paris", category: "kebab" },
  { query: "poulet frit Paris", category: "poulet-frit" },
  { query: "pizza à emporter Paris", category: "pizza" },
  { query: "sandwich Paris", category: "sandwich" },
  { query: "tenders chicken Paris", category: "crousti" },
  { query: "thai street food Paris", category: "thai" },
  { query: "wok asiatique Paris", category: "asiatique" },

  // ===== Paris — arrondissements populaires =====
  { query: "smash burger Paris 11", category: "smash-burger" },
  { query: "smash burger Paris 10", category: "smash-burger" },
  { query: "smash burger Paris 18", category: "smash-burger" },
  { query: "burger Paris 17", category: "smash-burger" },
  { query: "tacos Paris 18", category: "tacos" },
  { query: "tacos Paris 19", category: "tacos" },
  { query: "tacos Paris 20", category: "tacos" },
  { query: "kebab Paris 18", category: "kebab" },
  { query: "kebab Paris 19", category: "kebab" },
  { query: "kebab Paris 13", category: "kebab" },
  { query: "poulet frit Paris 18", category: "poulet-frit" },
  { query: "pizza Paris 11", category: "pizza" },
  { query: "bao asiatique Paris 13", category: "asiatique" },

  // ===== Banlieue (petite + grande couronne) =====
  { query: "smash burger Boulogne-Billancourt", category: "smash-burger" },
  { query: "smash burger Nanterre", category: "smash-burger" },
  { query: "smash burger Versailles", category: "smash-burger" },
  { query: "smash burger Issy-les-Moulineaux", category: "smash-burger" },
  { query: "tacos Saint-Denis", category: "tacos" },
  { query: "tacos Montreuil", category: "tacos" },
  { query: "tacos Créteil", category: "tacos" },
  { query: "tacos Argenteuil", category: "tacos" },
  { query: "tacos Aubervilliers", category: "tacos" },
  { query: "tacos Nanterre", category: "tacos" },
  { query: "kebab Saint-Denis", category: "kebab" },
  { query: "kebab Montreuil", category: "kebab" },
  { query: "kebab Créteil", category: "kebab" },
  { query: "kebab Vitry-sur-Seine", category: "kebab" },
  { query: "kebab Sarcelles", category: "kebab" },
  { query: "poulet frit Saint-Denis", category: "poulet-frit" },
  { query: "pizza Montreuil", category: "pizza" },
  { query: "wok asiatique Boulogne-Billancourt", category: "asiatique" },

  // ===== GRANDES VILLES =====
  // Lyon
  { query: "smash burger Lyon", category: "smash-burger" },
  { query: "tacos Lyon", category: "tacos" },
  { query: "kebab Lyon", category: "kebab" },
  { query: "poulet frit Lyon", category: "poulet-frit" },
  { query: "wok asiatique Lyon", category: "asiatique" },
  // Marseille
  { query: "smash burger Marseille", category: "smash-burger" },
  { query: "tacos Marseille", category: "tacos" },
  { query: "kebab Marseille", category: "kebab" },
  { query: "pizza Marseille", category: "pizza" },
  // Toulouse
  { query: "smash burger Toulouse", category: "smash-burger" },
  { query: "tacos Toulouse", category: "tacos" },
  { query: "kebab Toulouse", category: "kebab" },
  // Lille
  { query: "smash burger Lille", category: "smash-burger" },
  { query: "tacos Lille", category: "tacos" },
  { query: "kebab Lille", category: "kebab" },
  // Bordeaux
  { query: "smash burger Bordeaux", category: "smash-burger" },
  { query: "tacos Bordeaux", category: "tacos" },
  { query: "kebab Bordeaux", category: "kebab" },
  { query: "wok asiatique Bordeaux", category: "asiatique" },
  // Nantes
  { query: "smash burger Nantes", category: "smash-burger" },
  { query: "tacos Nantes", category: "tacos" },
  { query: "kebab Nantes", category: "kebab" },
  // Autres métropoles
  { query: "smash burger Strasbourg", category: "smash-burger" },
  { query: "kebab Strasbourg", category: "kebab" },
  { query: "smash burger Nice", category: "smash-burger" },
  { query: "tacos Nice", category: "tacos" },
  { query: "smash burger Rennes", category: "smash-burger" },
  { query: "tacos Rennes", category: "tacos" },
  { query: "smash burger Montpellier", category: "smash-burger" },
  { query: "tacos Montpellier", category: "tacos" },
];

const RESULTS_PER_QUERY = 5;   // nb de spots gardés par recherche
const MIN_REVIEWS = 20;        // seuil pour ne garder que des spots un minimum connus

// Grandes chaînes industrielles exclues de l'Arène (cf. page Proposer).
const FORBIDDEN_CHAINS = [
  "mcdonald", "mcdo", "burger king", "kfc", "quick", "subway",
  "o'tacos", "o tacos", "domino", "pizza hut", "starbucks", "paul",
  "brioche dorée", "five guys", "g la dalle", "factory & co", "speed rabbit",
];

function isForbidden(name: string): boolean {
  const n = name.toLowerCase();
  return FORBIDDEN_CHAINS.some((c) => n.includes(c));
}

async function fetchGooglePlaces(query: string) {
  if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY manquant");

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&region=fr&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(searchUrl);
  const data = await response.json();

  if (data.status !== "OK" || !data.results?.length) return [];

  const places: Array<{
    place_id: string; name: string; address: string; lat: number; lng: number;
    photo_url: string; google_reviews: number; google_rating: number | null;
  }> = [];

  for (const result of data.results) {
    if (places.length >= RESULTS_PER_QUERY) break;
    if (result.business_status && result.business_status !== "OPERATIONAL") continue;
    if (!result.geometry?.location || !result.formatted_address) continue;
    if (isForbidden(result.name || "")) continue;
    if ((result.user_ratings_total ?? 0) < MIN_REVIEWS) continue;

    const photoUrl = result.photos?.length
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${result.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
      : "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80";

    places.push({
      place_id: result.place_id,
      name: result.name,
      address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      photo_url: photoUrl,
      google_reviews: result.user_ratings_total ?? 0,
      google_rating: result.rating ?? null,
    });
  }

  return places;
}

async function seedDatabase() {
  console.log(`Seed France : ${SPOTS_TO_SEED.length} recherches à traiter (jusqu'à ${RESULTS_PER_QUERY} spots chacune)...\n`);

  let created = 0;
  let existing = 0;
  let empty = 0;
  const seen = new Set<string>();

  for (const spot of SPOTS_TO_SEED) {
    try {
      const places = await fetchGooglePlaces(spot.query);
      if (!places.length) {
        empty++;
        console.warn(`  [VIDE] "${spot.query}"`);
      }

      for (const place of places) {
        const docId = `${place.place_id}_${spot.category}`;
        if (seen.has(docId)) continue;
        seen.add(docId);

        const ref = doc(db, "fastfoods", docId);

        // On ne touche jamais à un resto déjà dans l'Arène (scores Elo / votes préservés).
        const snap = await getDoc(ref);
        if (snap.exists()) {
          existing++;
          continue;
        }

        const neighborhood = extractNeighborhood(place.address);
        const tagline = CATEGORY_TAGLINES[spot.category] || "Un spot à découvrir.";

        await setDoc(ref, {
          name: place.name,
          chain: place.name,
          category: spot.category,
          image_url: place.photo_url,
          location: {
            latitude: place.lat,
            longitude: place.lng,
            address: place.address,
          },
          neighborhood,
          tagline,
          google_reviews: place.google_reviews,
          google_rating: place.google_rating,
          elo_score: 1500,
          total_matches: 0,
          wins: 0,
          losses: 0,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        console.log(`  ✅ ${place.name} (${neighborhood}) [${spot.category}] · ${place.google_reviews} avis`);
        created++;
      }

      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`  ❌ "${spot.query}":`, err);
    }
  }

  console.log(`\nTerminé ! ${created} nouveaux restos ajoutés, ${existing} déjà présents (intacts), ${empty} recherches sans résultat.`);
  process.exit(0);
}

seedDatabase();
