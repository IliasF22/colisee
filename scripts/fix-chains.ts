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

async function fixChains() {
  console.log("Récupération des fast-foods...");
  const snapshot = await getDocs(collection(db, "fastfoods"));

  let fixed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.chain !== data.name) {
      console.log(`  "${data.chain}" → "${data.name}"`);
      await updateDoc(doc(db, "fastfoods", docSnap.id), { chain: data.name });
      fixed++;
    }
  }

  console.log(`\nTerminé ! ${fixed} document(s) corrigé(s) sur ${snapshot.size}.`);
  process.exit(0);
}

fixChains();
