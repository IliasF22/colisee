/**
 * Classement simulé "soft" : tout le monde quasi à égalité autour de 1500, peu
 * de votes, et un léger boost pour QUELQUES têtes d'affiche (max 3 antennes par
 * marque, les plus crédibles en avis). Chaque doc touché est marqué
 * `simulated: true` → on pourra tout nettoyer plus tard par ce tag.
 *
 *   npx tsx scripts/seed-classement.ts            # aperçu (lecture seule)
 *   npx tsx scripts/seed-classement.ts --apply    # applique
 */
import { getAdminDb, Timestamp } from "./_admin-db.js";

const db = getAdminDb();
const APPLY = process.argv.includes("--apply");

const norm = (s: string) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Têtes d'affiche (motifs de nom). Max N antennes boostées par motif.
const TOP_BRANDS = ["129", "tasty crous", "popeyes", "pepe chicken", "brendy", "burns", "la boule", "kebabier"];
const MAX_PER_BRAND = 3;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

(async () => {
  const snap = await db.collection("fastfoods").get();
  const visible = snap.docs.filter((d) => !(d.data() as any).hidden);

  // Sélectionne, pour chaque marque, les <=3 antennes les plus crédibles (avis).
  const boosted = new Set<string>();
  for (const b of TOP_BRANDS) {
    const matches = visible
      .filter((d) => norm((d.data() as any).name).includes(b))
      .sort((a, z) => ((z.data() as any).google_reviews ?? 0) - ((a.data() as any).google_reviews ?? 0))
      .slice(0, MAX_PER_BRAND);
    for (const d of matches) boosted.add(d.id);
  }

  const tops = visible.filter((d) => boosted.has(d.id));
  const masse = visible.filter((d) => !boosted.has(d.id));

  console.log(`${visible.length} fast-foods visibles.`);
  console.log(`${tops.length} têtes d'affiche boostées (max ${MAX_PER_BRAND}/marque) :`);
  for (const d of tops) {
    const x = d.data() as any;
    console.log(`  ↑ ${x.name}  (${x.google_reviews ?? 0} avis)`);
  }
  console.log(`${masse.length} restos "masse" (quasi égalité autour de 1500).`);

  if (!APPLY) {
    console.log(`\n(aperçu) Relance avec --apply pour injecter les votes simulés (tag simulated:true).`);
    process.exit(0);
  }

  let batch = db.batch();
  let n = 0;
  let written = 0;

  const write = (ref: FirebaseFirestore.DocumentReference, elo: number, matches: number) => {
    const winRate = clamp((elo - 1500) / 300 + 0.5, 0.2, 0.8);
    const wins = Math.round(matches * winRate);
    batch.set(ref, {
      elo_score: elo, total_matches: matches, wins, losses: matches - wins,
      simulated: true, updated_at: Timestamp.now(),
    }, { merge: true });
  };

  for (const d of masse) {
    write(d.ref, 1500 + Math.round((Math.random() - 0.5) * 24), rint(2, 5)); // ~1488..1512
    if (++n >= 400) { await batch.commit(); written += n; batch = db.batch(); n = 0; }
  }
  for (const d of tops) {
    write(d.ref, rint(1535, 1565), rint(4, 8));                              // un cran au-dessus
    if (++n >= 400) { await batch.commit(); written += n; batch = db.batch(); n = 0; }
  }
  if (n > 0) { await batch.commit(); written += n; }

  console.log(`\n✅ ${written} fast-foods dotés d'un classement simulé (tag simulated:true).`);
  process.exit(0);
})();
