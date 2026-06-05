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

async function run() {
  const colRef = collection(db, "fastfoods");
  const snapshot = await getDocs(colRef);
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.name.includes("129") || data.name.includes("Good time")) {
      console.log(`Mise à jour de ${data.name} vers sandwich...`);
      await updateDoc(docRef(db, "fastfoods", docSnap.id), { category: "sandwich" });
      updatedCount++;
    }
  }
  console.log(`Terminé, ${updatedCount} documents mis à jour.`);
  process.exit(0);
}

// helper function since updateDoc takes DocumentReference
const docRef = doc;

run();
