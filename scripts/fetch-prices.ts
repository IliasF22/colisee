/**
 * Récupère le niveau de prix Google (price_level 1..4) de chaque resto
 * et le stocke dans le champ price_level. Mise à jour de champ (réversible).
 *
 *   npx tsx scripts/fetch-prices.ts
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, Timestamp } from "firebase/firestore";
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
const CATEGORIES = ["poulet-frit", "smash-burger", "pizza", "kebab", "sandwich", "crousti", "thai", "asiatique", "tacos"];

function placeIdFromDocId(id: string): string {
  for (const c of CATEGORIES) if (id.endsWith(`_${c}`)) return id.slice(0, -(c.length + 1));
  return id;
}

(async () => {
  const snap = await getDocs(collection(db, "fastfoods"));
  const docsArr = snap.docs.filter((d) => !(d.data() as any).hidden); // on ignore les masqués
  console.log(`Récupération du prix pour ${docsArr.length} restos…\n`);

  let withPrice = 0, without = 0, done = 0;

  for (const d of docsArr) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeIdFromDocId(d.id)}&fields=price_level&key=${KEY}`;
      const data = await (await fetch(url)).json();
      const lvl = data.result?.price_level;
      if (typeof lvl === "number") {
        await setDoc(doc(db, "fastfoods", d.id), { price_level: lvl, updated_at: Timestamp.now() }, { merge: true });
        withPrice++;
      } else {
        without++; // Google ne l'indique pas → l'app affichera €€ par défaut
      }
    } catch { /* on ignore les erreurs ponctuelles */ }

    if (++done % 100 === 0) console.log(`  …${done}/${docsArr.length} (prix connus: ${withPrice})`);
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`\nTerminé : ${withPrice} prix récupérés, ${without} sans prix Google (→ €€ par défaut).`);
  process.exit(0);
})();
