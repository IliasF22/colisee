/**
 * Ajoute des marques/spots ciblés à la base (via Google Places textsearch),
 * proprement à Elo 1500 / 0 match (le classement simulé est posé ensuite par
 * seed-classement.ts). Filtre France + nom + dédoublonnage + skip si existant.
 *
 *   npx tsx scripts/add-brands.ts            # aperçu (lecture seule)
 *   npx tsx scripts/add-brands.ts --apply    # applique
 */
import { getAdminDb, Timestamp } from "./_admin-db.js";

const db = getAdminDb();
const KEY = process.env.GOOGLE_MAPS_API_KEY!;
const APPLY = process.argv.includes("--apply");

const norm = (s: string) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Brand = {
  queries: string[];
  nameMust: string;   // le nom doit contenir ça (anti faux-positif)
  chain: string;
  category: string;
  franchise: boolean;
  tagline: string;
  max: number;        // garde-fou sur le nb d'antennes ajoutées
};

const BRANDS: Brand[] = [
  { queries: ["Brendy's", "Brendy's smash burger France"], nameMust: "brendy", chain: "Brendy's", category: "smash-burger", franchise: true, tagline: "Smash burgers et sandwichs généreux.", max: 15 },
  { queries: ["Mr Burns burger", "Mister Burns smash burger France"], nameMust: "burns", chain: "Mr Burns", category: "smash-burger", franchise: true, tagline: "Smash burgers maison.", max: 15 },
  { queries: ["La Boule kebab Paris", "La Boule maître kebabier"], nameMust: "boule", chain: "La Boule", category: "kebab", franchise: false, tagline: "Kebab parisien réputé.", max: 3 },
  { queries: ["Maître Kebabier Paris", "Le Maître Kebabier"], nameMust: "kebabier", chain: "Maître Kebabier", category: "kebab", franchise: false, tagline: "Kebab d'exception à Paris.", max: 3 },
];

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
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS")
    console.log(`   ⚠️ Places: ${data.status} ${data.error_message ?? ""}`);
  return data.results || [];
}

(async () => {
  let totalAdd = 0;

  for (const brand of BRANDS) {
    console.log(`\n=== ${brand.chain} [${brand.category}] ===`);
    const results: any[] = [];
    for (const q of brand.queries) results.push(...(await search(q)));

    const seen = new Set<string>();
    const candidates: any[] = [];
    for (const r of results) {
      if (!r.place_id || seen.has(r.place_id)) continue;
      seen.add(r.place_id);
      if (!norm(r.name || "").includes(brand.nameMust)) continue;
      if (!r.geometry?.location || !r.formatted_address || !isFrance(r.formatted_address)) continue;
      if (r.business_status && r.business_status !== "OPERATIONAL") continue;
      candidates.push(r);
    }
    // les plus crédibles d'abord (avis), cap au max
    candidates.sort((a, b) => (b.user_ratings_total ?? 0) - (a.user_ratings_total ?? 0));
    const picked = candidates.slice(0, brand.max);

    for (const r of picked) {
      const docId = `${r.place_id}_${brand.category}`;
      const ref = db.collection("fastfoods").doc(docId);
      const exists = (await ref.get()).exists;
      const tag = exists ? "déjà présent" : "À AJOUTER";
      console.log(`  [${tag}] ${r.name} — ${cityFromAddress(r.formatted_address)} · ${r.user_ratings_total ?? 0} avis · ${r.rating ?? "?"}★`);
      if (exists || !APPLY) continue;

      const reviews = r.user_ratings_total ?? 0;
      const rating = typeof r.rating === "number" ? r.rating : null;
      const photoUrl = r.photos?.length
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${r.photos[0].photo_reference}&key=${KEY}`
        : "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80";

      await ref.set({
        name: r.name,
        chain: brand.chain,
        category: brand.category,
        image_url: photoUrl,
        location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng, address: r.formatted_address },
        neighborhood: cityFromAddress(r.formatted_address),
        tagline: brand.tagline,
        google_reviews: reviews,
        google_rating: rating,
        is_franchise: brand.franchise,
        franchise_name: brand.franchise ? brand.chain : "",
        elo_score: 1500, total_matches: 0, wins: 0, losses: 0,
        created_at: Timestamp.now(), updated_at: Timestamp.now(),
      });
      totalAdd++;
    }
  }

  console.log(APPLY ? `\n✅ ${totalAdd} resto(s) ajouté(s).` : `\n(aperçu) Relance avec --apply pour ajouter ce qui est marqué "À AJOUTER".`);
  process.exit(0);
})();
