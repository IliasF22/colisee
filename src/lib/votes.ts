/**
 * Suivi local et anonyme des votes (localStorage, sans compte, zéro Firestore).
 * Sert au hook « tes votes vs la foule » : pour chaque duel on retient si
 * l'utilisateur a suivi le favori de l'arène (Elo le plus haut) ou l'outsider.
 */
const KEY = "colisee_votes";
const CAP = 1000; // borne la taille stockée

/** f = a suivi le favori (1) ou non (0) ; d = écart Elo (gagnant - perdant) ; c = catégorie. */
interface VoteRecord {
  f: 0 | 1;
  d: number;
  c: string;
}

function read(): VoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VoteRecord[]) : [];
  } catch {
    return [];
  }
}

/** Enregistre un vote. À appeler avec les Elo AU MOMENT du duel. */
export function recordVote(winnerElo: number, loserElo: number, category: string): void {
  if (typeof window === "undefined") return;
  const arr = read();
  arr.push({ f: winnerElo >= loserElo ? 1 : 0, d: winnerElo - loserElo, c: category });
  if (arr.length > CAP) arr.splice(0, arr.length - CAP);
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    /* quota — on ignore */
  }
}

/** Classe un vote instantanément pour le feedback (le « hook »). */
export interface VoteFeedback {
  consensus: boolean;
  emoji: string;
  title: string;
  sub: string;
}
export function classifyVote(winnerElo: number, loserElo: number): VoteFeedback {
  const d = winnerElo - loserElo;
  if (d >= 0)
    return { consensus: true, emoji: "⚔️", title: "Choix consensuel", sub: "Tu as suivi le favori de l’arène" };
  if (d > -40)
    return { consensus: false, emoji: "🔥", title: "Choix audacieux", sub: "Tu as préféré l’outsider" };
  return { consensus: false, emoji: "🐉", title: "Renversement !", sub: "Tu as sacré le moins coté" };
}

export interface Persona {
  key: "apprenti" | "rebelle" | "equilibre" | "consensuel";
  label: string;
  emoji: string;
  desc: string;
}
export interface VoteStats {
  total: number;
  agreementRate: number; // % d'accord avec l'arène
  upsets: number; // nb de fois où il a choisi l'outsider
  persona: Persona;
  topCategoryId: string | null;
}

function personaFor(total: number, rate: number): Persona {
  if (total < 5)
    return { key: "apprenti", label: "Apprenti gladiateur", emoji: "🛡️", desc: "Vote encore un peu pour révéler ton vrai profil." };
  if (rate < 40)
    return { key: "rebelle", label: "Le Rebelle", emoji: "🔥", desc: "Tu adores les outsiders et tu votes à contre-courant de l’arène." };
  if (rate <= 65)
    return { key: "equilibre", label: "L’Équilibré", emoji: "⚖️", desc: "Un pied dans le consensus, un pied dans la surprise." };
  return { key: "consensuel", label: "Le Consensuel", emoji: "🏛️", desc: "Ton palais est en phase avec la foule de l’arène." };
}

export function getVoteStats(): VoteStats {
  const arr = read();
  const total = arr.length;
  const agreed = arr.reduce((n, v) => n + v.f, 0);
  const agreementRate = total ? Math.round((agreed / total) * 100) : 0;
  const upsets = total - agreed;

  // Catégorie la plus jouée (hors « all »).
  const counts = new Map<string, number>();
  for (const v of arr) if (v.c && v.c !== "all") counts.set(v.c, (counts.get(v.c) ?? 0) + 1);
  let topCategoryId: string | null = null;
  let best = 0;
  for (const [c, n] of counts) if (n > best) { best = n; topCategoryId = c; }

  return { total, agreementRate, upsets, persona: personaFor(total, agreementRate), topCategoryId };
}
