/**
 * Génère un classement crédible "pour l'instant" : attribue un Elo + des matchs
 * simulés (dérivés de la note Google, du nb d'avis, + un peu d'aléa) aux restos
 * qui n'ont encore AUCUN vote (total_matches === 0). Préserve les vrais votes.
 *
 *   npx tsx scripts/seed-votes.ts
 */
import { getAdminDb, Timestamp } from "./_admin-db.js";

const db = getAdminDb();

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

(async () => {
  const snap = await db.collection("fastfoods").get();
  const targets = snap.docs.filter((d) => {
    const x = d.data() as any;
    return !x.hidden && (x.total_matches ?? 0) === 0;
  });

  console.log(`${targets.length} restos sans vote → génération…`);

  let batch = db.batch();
  let n = 0;
  let written = 0;

  for (const d of targets) {
    const x = d.data() as any;
    const rating: number = typeof x.google_rating === "number" ? x.google_rating : 4.2;
    const reviews: number = x.google_reviews ?? 0;

    const elo = Math.round(
      clamp(
        1500 +
          (rating - 4.2) * 110 +        // qualité (note)
          Math.log10(reviews + 1) * 25 + // notoriété (avis)
          (Math.random() - 0.5) * 80,    // aléa
        1350,
        1700,
      ),
    );

    const matches = 8 + Math.floor(Math.random() * 50);
    const winRate = clamp((elo - 1500) / 300 + 0.5, 0.15, 0.85);
    const wins = Math.round(matches * winRate);
    const losses = matches - wins;

    batch.set(
      d.ref,
      { elo_score: elo, total_matches: matches, wins, losses, updated_at: Timestamp.now() },
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

  console.log(`\n✅ ${written} restos dotés d'un classement simulé.`);
  process.exit(0);
})();
