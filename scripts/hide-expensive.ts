/**
 * Masque les restos trop chers pour être des fast-foods (price_level >= 3 = €€€+).
 * Réutilise le champ hidden (réversible). Le filtre est déjà déployé.
 *
 *   npx tsx scripts/hide-expensive.ts          # liste (lecture seule)
 *   npx tsx scripts/hide-expensive.ts --apply  # masque
 */

import { getAdminDb, Timestamp, getDocs, setDoc, collection, doc } from "./_admin-db.js";
const db = getAdminDb();
const APPLY = process.argv.includes("--apply");
const THRESHOLD = 3; // €€€ et plus

(async () => {
  const snap = await getDocs(collection(db, "fastfoods"));
  const targets = snap.docs.filter((d) => {
    const x = d.data() as any;
    return !x.hidden && typeof x.price_level === "number" && x.price_level >= THRESHOLD;
  });

  console.log(`${targets.length} restos à €€€+ (price_level >= ${THRESHOLD})${APPLY ? " — MASQUAGE" : " — aperçu"} :\n`);
  for (const d of targets) {
    const x = d.data() as any;
    console.log(` - "${x.name}" · ${"€".repeat(x.price_level)} · ${x.location?.address}`);
  }

  if (!APPLY) {
    console.log(`\nAperçu. Relance avec --apply pour les masquer.`);
    process.exit(0);
  }

  for (const d of targets) {
    await setDoc(doc(db, "fastfoods", d.id), { hidden: true, updated_at: Timestamp.now() }, { merge: true });
  }
  console.log(`\n${targets.length} restos trop chers masqués (réversible : hidden=true).`);
  process.exit(0);
})();
