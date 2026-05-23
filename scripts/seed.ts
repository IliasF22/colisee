import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
console.log("Clé Google Maps chargée (longueur):", GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.length : "NON DÉFINIE");

// Liste des requêtes de spots à insérer
const SPOTS_TO_SEED = [
  // --- SMASH BURGER ---
  { query: "Dumbo Pigalle, Paris", category: "smash-burger" },
  { query: "Dumbo Petites-Écuries, Paris", category: "smash-burger" },
  { query: "Echo, 95 rue d'Aboukir, Paris 2e", category: "smash-burger" },
  { query: "Buns France, Paris 15e", category: "smash-burger" },
  { query: "Buns France, Canal de l'Ourcq, Paris 19e", category: "smash-burger" },
  { query: "Well Done, Paris 19e", category: "smash-burger" },
  { query: "Le 129, Paris", category: "smash-burger" },
  { query: "Blend, Paris", category: "smash-burger" },
  { query: "Pin-Pan, Paris", category: "smash-burger" },
  { query: "Spécimen, Paris 6e", category: "smash-burger" },

  // --- POULET FRIT ---
  { query: "Wingstop Bastille, 61 rue du Faubourg-Saint-Antoine", category: "poulet-frit" },
];

async function fetchGooglePlaceData(query: string) {
  if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY est manquant dans .env.local");

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
  
  const response = await fetch(searchUrl);
  const data = await response.json();

  if (data.status !== "OK" || !data.results || data.results.length === 0) {
    console.warn(`[ATTENTION] Aucun résultat trouvé pour la requête : "${query}" (Status: ${data.status})`);
    return null;
  }

  const result = data.results[0];
  const placeId = result.place_id;
  
  // Générer l'URL de la photo si disponible
  let photoUrl = "";
  if (result.photos && result.photos.length > 0) {
    const photoReference = result.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  } else {
    // URL de fallback si aucune photo
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
  console.log("🚀 Démarrage du script de seed Firebase...");
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("❌ Erreur : Les variables Firebase manquent dans .env.local");
    return;
  }

  let successCount = 0;
  
  for (const spot of SPOTS_TO_SEED) {
    try {
      console.log(`\nRecherche de : ${spot.query}...`);
      const placeData = await fetchGooglePlaceData(spot.query);
      
      if (!placeData) continue;

      // Création de l'objet pour correspondre à notre type 'FastFood' et la demande
      const firestoreData = {
        name: placeData.name,
        chain: spot.query.split(',')[0].split(' ')[0], // Estimation basique de la chaîne
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

      // Insertion dans la collection "fastfoods" en utilisant le place_id comme ID de document
      // pour éviter les doublons si le script est lancé plusieurs fois.
      const docRef = doc(db, "fastfoods", placeData.place_id);
      await setDoc(docRef, firestoreData);
      
      console.log(`✅ Succès : Inséré "${placeData.name}" dans Firebase.`);
      successCount++;
      
      // Petit délai pour ne pas saturer l'API Google
      await new Promise((resolve) => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de "${spot.query}":`, error);
    }
  }

  console.log(`\n🎉 Seed terminé ! ${successCount}/${SPOTS_TO_SEED.length} spots ont été importés dans Firebase.`);
  process.exit(0);
}

seedDatabase();
