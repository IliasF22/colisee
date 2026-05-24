import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
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

const SPOTS_TO_SEED = [
  // === TACOS ===
  { query: "La Marinade Villeurbanne Lyon", category: "tacos" },
  { query: "Le Banger Villepinte", category: "tacos" },
  { query: "Tacos Avenue Paris", category: "tacos" },
  { query: "Fresh Tacos Lyon", category: "tacos" },
  { query: "Tacos King Marseille", category: "tacos" },
  { query: "Galaxy Tacos Paris", category: "tacos" },
  { query: "Chamas Tacos Lyon", category: "tacos" },
  { query: "Tacos de Lyon", category: "tacos" },
  { query: "Royal Tacos Bordeaux", category: "tacos" },
  { query: "French Tacos Factory Lille", category: "tacos" },

  // === SMASH BURGER - hors Paris ===
  { query: "Music Burger Lyon", category: "smash-burger" },
  { query: "Le Camion Qui Fume Bordeaux", category: "smash-burger" },
  { query: "Smash Club Marseille", category: "smash-burger" },
  { query: "Burger & Wells Lille", category: "smash-burger" },
  { query: "Le Berliner Toulouse", category: "smash-burger" },
  { query: "Holy Cow Nantes", category: "smash-burger" },
  { query: "Mamie Burger Lyon", category: "smash-burger" },
  { query: "Le Réfectoire Lyon", category: "smash-burger" },

  // === POULET FRIT - hors Paris ===
  { query: "Poulet Braisé Lyon", category: "poulet-frit" },
  { query: "Crispy House Marseille", category: "poulet-frit" },
  { query: "Soul Chicken Bordeaux", category: "poulet-frit" },
  { query: "Chicken Nation Toulouse", category: "poulet-frit" },
  { query: "Rooster Lille", category: "poulet-frit" },

  // === PIZZA - hors Paris ===
  { query: "Nona Pizza Lyon", category: "pizza" },
  { query: "Faggio Marseille pizza", category: "pizza" },
  { query: "Mama Shelter Bordeaux pizza", category: "pizza" },
  { query: "Sodo Pizza Nantes", category: "pizza" },

  // === KEBAB - hors Paris ===
  { query: "Kebab Royal Lyon", category: "kebab" },
  { query: "Le Roi du Kebab Marseille", category: "kebab" },
  { query: "Istanbul Kebab Bordeaux", category: "kebab" },
  { query: "German Döner Kebab Lille", category: "kebab" },
  { query: "Pacha Kebab Toulouse", category: "kebab" },

  // === ASIATIQUE - hors Paris ===
  { query: "Pho Bida Lyon", category: "asiatique" },
  { query: "Bao Family Lyon", category: "asiatique" },
  { query: "Woko Marseille", category: "asiatique" },
  { query: "Pitaya Bordeaux", category: "asiatique" },

  // === THAI - hors Paris ===
  { query: "Pad Thai Lyon", category: "thai" },
  { query: "Thaï Street Marseille", category: "thai" },

  // === SANDWICH - hors Paris ===
  { query: "Chez Aline Lyon sandwich", category: "sandwich" },
  { query: "Le Casse Croute Marseille", category: "sandwich" },

  // === CROUSTI - hors Paris ===
  { query: "Crousti Poulet Lyon", category: "crousti" },
  { query: "Crousti Chicken Marseille", category: "crousti" },
];

async function fetchGooglePlaceData(query: string) {
  if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY manquant");

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&region=fr&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(searchUrl);
  const data = await response.json();

  if (data.status !== "OK" || !data.results?.length) {
    console.warn(`  [SKIP] Aucun résultat pour "${query}"`);
    return null;
  }

  const result = data.results[0];
  let photoUrl = "";
  if (result.photos?.length) {
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${result.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`;
  } else {
    photoUrl = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80";
  }

  return {
    place_id: result.place_id,
    name: result.name,
    address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    photo_url: photoUrl,
  };
}

async function seedDatabase() {
  console.log(`Seed France : ${SPOTS_TO_SEED.length} spots à traiter...\n`);

  let success = 0;
  let skipped = 0;

  for (const spot of SPOTS_TO_SEED) {
    try {
      const place = await fetchGooglePlaceData(spot.query);
      if (!place) { skipped++; continue; }

      const neighborhood = extractNeighborhood(place.address);
      const tagline = CATEGORY_TAGLINES[spot.category] || "Un spot à découvrir.";

      const docId = `${place.place_id}_${spot.category}`;
      await setDoc(doc(db, "fastfoods", docId), {
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
        elo_score: 1500,
        total_matches: 0,
        wins: 0,
        losses: 0,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      }, { merge: true });

      console.log(`  ✅ ${place.name} (${neighborhood}) [${spot.category}]`);
      success++;

      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.error(`  ❌ "${spot.query}":`, err);
    }
  }

  console.log(`\nTerminé ! ${success} ajoutés, ${skipped} ignorés sur ${SPOTS_TO_SEED.length}.`);
  process.exit(0);
}

seedDatabase();
