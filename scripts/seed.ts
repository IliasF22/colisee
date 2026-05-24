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

const SPOTS_TO_SEED = [
  { query: "Kcrousty Paris", category: "crousti" },
  { query: "Tasty Crousty Paris", category: "crousti" },
  { query: "O'Crousty Paris", category: "crousti" },
  { query: "Crousti Poulet Paris", category: "crousti" },
  { query: "Chiko Crousti Paris", category: "crousti" },
];

async function fetchGooglePlaceData(query: string) {
  if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY est manquant");

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
  
  const response = await fetch(searchUrl);
  const data = await response.json();

  if (data.status !== "OK" || !data.results || data.results.length === 0) {
    console.warn(`[ATTENTION] Aucun résultat pour : "${query}"`);
    return null;
  }

  const result = data.results[0];
  const placeId = result.place_id;
  
  let photoUrl = "";
  if (result.photos && result.photos.length > 0) {
    const photoReference = result.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  } else {
    photoUrl = "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  }

  return {
    place_id: placeId,
    name: result.name,
    address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    photo_url: photoUrl,
  };
}

async function seedDatabase() {
  console.log("🚀 Démarrage du seed pour les Crousti...");
  
  let successCount = 0;
  
  for (const spot of SPOTS_TO_SEED) {
    try {
      const placeData = await fetchGooglePlaceData(spot.query);
      if (!placeData) continue;

      const firestoreData = {
        name: placeData.name,
        chain: placeData.name,
        category: spot.category,
        image_url: placeData.photo_url,
        location: {
          latitude: placeData.lat,
          longitude: placeData.lng,
          address: placeData.address,
        },
        elo_score: 1500,
        total_matches: 0,
        wins: 0,
        losses: 0,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };

      const docId = `${placeData.place_id}_${spot.category}`;
      const docRef = doc(db, "fastfoods", docId);
      
      await setDoc(docRef, firestoreData, { merge: true });
      
      console.log(`✅ Succès : Inséré "${placeData.name}"`);
      successCount++;
      
      await new Promise((resolve) => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`❌ Erreur sur "${spot.query}":`, error);
    }
  }

  console.log(`\n🎉 Seed terminé ! ${successCount}/${SPOTS_TO_SEED.length} nouveaux Crousti.`);
  process.exit(0);
}

seedDatabase();
