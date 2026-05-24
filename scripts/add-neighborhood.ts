import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
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

const CATEGORY_TAGLINES: Record<string, string> = {
  "poulet-frit": "Poulet croustillant et généreux.",
  "smash-burger": "Smash burgers juteux et savoureux.",
  "pizza": "Pizza artisanale au feu de bois.",
  "kebab": "Kebab grillé à la flamme.",
  "sandwich": "Sandwichs frais et gourmands.",
  "crousti": "Crousti craquant et fondant.",
  "thai": "Saveurs thaï authentiques.",
  "asiatique": "Street food asiatique fusion.",
};

function extractNeighborhood(address: string): string {
  const parts = address.split(",").map((s) => s.trim());

  // "28 Av. de Saint-Ouen, 75018 Paris, France"
  // -> extract "75018 Paris" -> "Paris 18e"
  for (const part of parts) {
    const match = part.match(/^(\d{5})\s+(.+)$/);
    if (match) {
      const postalCode = match[1];
      const city = match[2];
      if (postalCode.startsWith("75")) {
        const arrond = parseInt(postalCode.slice(3));
        if (arrond > 0) return `${city} ${arrond}e`;
        return city;
      }
      if (postalCode.startsWith("69")) {
        const arrond = parseInt(postalCode.slice(3));
        if (arrond > 0) return `Lyon ${arrond}e`;
        return "Lyon";
      }
      if (postalCode.startsWith("13")) {
        const arrond = parseInt(postalCode.slice(3));
        if (arrond > 0) return `Marseille ${arrond}e`;
        return "Marseille";
      }
      return city;
    }
  }

  // Fallback: second-to-last part
  if (parts.length >= 2) {
    return parts[parts.length - 2].replace(/^\d{4,5}\s*/, "");
  }
  return "";
}

async function addNeighborhoods() {
  console.log("Ajout des quartiers et taglines...\n");
  const snapshot = await getDocs(collection(db, "fastfoods"));

  let updated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const neighborhood = extractNeighborhood(data.location?.address || "");
    const tagline = CATEGORY_TAGLINES[data.category] || "Un spot à découvrir.";

    const updates: Record<string, string> = {};
    if (!data.neighborhood) updates.neighborhood = neighborhood;
    if (!data.tagline) updates.tagline = tagline;

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, "fastfoods", docSnap.id), updates);
      console.log(`  ${data.name} → ${neighborhood}`);
      updated++;
    }
  }

  console.log(`\nTerminé ! ${updated}/${snapshot.size} documents mis à jour.`);
  process.exit(0);
}

addNeighborhoods();
