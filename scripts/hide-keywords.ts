/**
 * Masque (hidden=true) les restos dont le NOM contient un mot-clé non-fast-food.
 *   npx tsx scripts/hide-keywords.ts          # aperçu
 *   npx tsx scripts/hide-keywords.ts --apply  # masque
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
const APPLY = process.argv.includes("--apply");

const KEYWORDS = ["patisserie", "buffet", "mami louise"];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[^a-z0-9]+/g, " ").trim();
}

(async () => {
  const snap = await getDocs(collection(db, "fastfoods"));
  const targets = snap.docs.filter((d) => {
    const x = d.data() as any;
    if (x.hidden) return false;
    const n = normalize(x.name || "");
    return KEYWORDS.some((k) => n.includes(k));
  });

  console.log(`${targets.length} restos avec un mot-clé [${KEYWORDS.join(", ")}]${APPLY ? " — MASQUAGE" : " — aperçu"} :\n`);
  targets.forEach((d) => { const x = d.data() as any; console.log(` - "${x.name}" @ ${x.location?.address}`); });

  if (!APPLY) { console.log(`\nAperçu. --apply pour masquer.`); process.exit(0); }
  for (const d of targets) {
    await setDoc(doc(db, "fastfoods", d.id), { hidden: true, updated_at: Timestamp.now() }, { merge: true });
  }
  console.log(`\n${targets.length} masqués (réversible).`);
  process.exit(0);
})();
