/**
 * Remet TOUT le classement à zéro : elo_score=1500, total_matches=0, wins=0,
 * losses=0 sur tous les fastfoods. Efface le classement simulé (seed-votes) ET
 * les éventuels vrais votes — ils sont indissociables dans le modèle de données.
 *
 *   npx tsx scripts/reset-votes.ts            # aperçu (lecture seule)
 *   npx tsx scripts/reset-votes.ts --apply    # applique
 */
import { getAdminDb, Timestamp } from "./_admin-db.js";

const db = getAdminDb();
const APPLY = process.argv.includes("--apply");

(async () => {
  const snap = await db.collection("fastfoods").get();
  const docs = snap.docs;

  // Ce qui a un classement non vierge aujourd'hui
  const nonVierge = docs.filter((d) => {
    const x = d.data() as any;
    return (x.total_matches ?? 0) !== 0 || (x.elo_score ?? 1500) !== 1500;
  });

  console.log(`${docs.length} fastfoods au total.`);
  console.log(`${nonVierge.length} avec un classement à remettre à 0.\n`);

  // Échantillon avant
  console.log("Échantillon (avant) :");
  for (const d of nonVierge.slice(0, 5)) {
    const x = d.data() as any;
    console.log(
      `  ${x.name?.slice(0, 30).padEnd(30)} elo=${x.elo_score} matchs=${x.total_matches} (${x.wins}W/${x.losses}L)`,
    );
  }

  if (!APPLY) {
    console.log(`\n(aperçu) Relance avec --apply pour remettre les ${docs.length} docs à 1500 / 0 / 0 / 0.`);
    process.exit(0);
  }

  let batch = db.batch();
  let n = 0;
  let written = 0;

  for (const d of docs) {
    batch.set(
      d.ref,
      { elo_score: 1500, total_matches: 0, wins: 0, losses: 0, updated_at: Timestamp.now() },
      { merge: true },
    );
    if (++n >= 400) {
      await batch.commit();
      written += n;
      console.log(`  …${written}`);
      batch = db.batch();
      n = 0;
    }
  }
  if (n > 0) { await batch.commit(); written += n; }

  console.log(`\n✅ ${written} fastfoods remis à zéro (Elo 1500, aucun match).`);
  process.exit(0);
})();
