/**
 * Ajoute les antennes "Pépé Chicken" (FastGoodCuisine) en catégorie poulet-frit,
 * avec avis/note Google + un Elo simulé (cohérent avec seed-votes).
 *   npx tsx scripts/add-pepe-chicken.ts
 */
import { getAdminDb, Timestamp } from "./_admin-db.js";

const db = getAdminDb();
const KEY = process.env.GOOGLE_MAPS_API_KEY!;
const CAT = "poulet-frit";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function isFrance(addr: string): boolean {
  const segs = addr.split(",").map((s) => s.trim()).filter(Boolean);
  return /^\d{5}\s+\S/.test(segs[segs.length - 1] || "");
}
function cityFromAddress(address: string): string {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  for (const p of parts) { const m = p.match(/^\d{5}\s+(.+)$/); if (m) return m[1].trim(); }
  return parts[0] || "";
}

async function search(q: string): Promise<any[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&region=fr&key=${KEY}`;
  const data = await (await fetch(url)).json();
  return data.results || [];
}

(async () => {
  const results = [...(await search("Pépé Chicken")), ...(await search("Pepe Chicken FastGoodCuisine"))];
  const seen = new Set<string>();
  let added = 0, skipped = 0;

  for (const r of results) {
    if (!r.place_id || seen.has(r.place_id)) continue;
    seen.add(r.place_id);
    if (!norm(r.name || "").includes("pepe chicken")) { continue; }
    if (!r.geometry?.location || !r.formatted_address || !isFrance(r.formatted_address)) continue;
    if (r.business_status && r.business_status !== "OPERATIONAL") continue;

    const docId = `${r.place_id}_${CAT}`;
    const ref = db.collection("fastfoods").doc(docId);
    if ((await ref.get()).exists) { skipped++; continue; }

    const reviews = r.user_ratings_total ?? 0;
    const rating = typeof r.rating === "number" ? r.rating : 4.2;
    const elo = Math.round(clamp(1500 + (rating - 4.2) * 110 + Math.log10(reviews + 1) * 25 + (Math.random() - 0.5) * 80, 1350, 1700));
    const matches = 8 + Math.floor(Math.random() * 50);
    const winRate = clamp((elo - 1500) / 300 + 0.5, 0.15, 0.85);
    const wins = Math.round(matches * winRate);

    const photoUrl = r.photos?.length
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${r.photos[0].photo_reference}&key=${KEY}`
      : "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80";

    await ref.set({
      name: r.name,
      chain: "Pépé Chicken",
      category: CAT,
      image_url: photoUrl,
      location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng, address: r.formatted_address },
      neighborhood: cityFromAddress(r.formatted_address),
      tagline: "Poulet croustillant et généreux.",
      google_reviews: reviews,
      google_rating: rating,
      is_franchise: true,
      franchise_name: "Pépé Chicken",
      elo_score: elo,
      total_matches: matches,
      wins,
      losses: matches - wins,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    console.log(`  ✅ ${r.name} (${cityFromAddress(r.formatted_address)}) · ${reviews} avis`);
    added++;
  }

  console.log(`\nTerminé : ${added} antennes Pépé Chicken ajoutées, ${skipped} déjà présentes.`);
  process.exit(0);
})();
