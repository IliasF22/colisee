import { FastFood } from "./types";
import { FoodCategoryId } from "./categories";
import { Timestamp } from "firebase/firestore";

const now = Timestamp.now();

export const MOCK_FASTFOODS: FastFood[] = [
  // --- SMASH BURGER ---
  {
    id: "1", name: "Dumbo Pigalle", chain: "Dumbo", category: "smash-burger",
    image_url: "/images/dumbo.svg", location: { latitude: 48.8824, longitude: 2.3364, address: "64 Rue Jean-Baptiste Pigalle, 75009 Paris" },
    elo_score: 1650, total_matches: 45, wins: 32, losses: 13, created_at: now, updated_at: now,
  },
  {
    id: "2", name: "Echo", chain: "Echo", category: "smash-burger",
    image_url: "/images/echo.svg", location: { latitude: 48.8687, longitude: 2.3456, address: "95 Rue d'Aboukir, 75002 Paris" },
    elo_score: 1620, total_matches: 38, wins: 25, losses: 13, created_at: now, updated_at: now,
  },
  {
    id: "3", name: "Buns France", chain: "Buns France", category: "smash-burger",
    image_url: "/images/bunsfrance.svg", location: { latitude: 48.8890, longitude: 2.3831, address: "Canal de l'Ourcq, 75019 Paris" },
    elo_score: 1580, total_matches: 22, wins: 15, losses: 7, created_at: now, updated_at: now,
  },
  {
    id: "4", name: "Well Done", chain: "Well Done", category: "smash-burger",
    image_url: "/images/welldone.svg", location: { latitude: 48.8820, longitude: 2.3860, address: "Paris 19e" },
    elo_score: 1590, total_matches: 30, wins: 18, losses: 12, created_at: now, updated_at: now,
  },
  {
    id: "5", name: "Le 129", chain: "Le 129", category: "smash-burger",
    image_url: "/images/le129.svg", location: { latitude: 48.8710, longitude: 2.3900, address: "Saint-Denis" },
    elo_score: 1550, total_matches: 40, wins: 20, losses: 20, created_at: now, updated_at: now,
  },
  {
    id: "6", name: "Blend", chain: "Blend", category: "smash-burger",
    image_url: "/images/blend.svg", location: { latitude: 48.8670, longitude: 2.3460, address: "Paris 2e" },
    elo_score: 1540, total_matches: 35, wins: 19, losses: 16, created_at: now, updated_at: now,
  },
  {
    id: "7", name: "Pin-Pan", chain: "Pin-Pan", category: "smash-burger",
    image_url: "/images/pinpan.svg", location: { latitude: 48.8750, longitude: 2.3400, address: "Paris" },
    elo_score: 1510, total_matches: 15, wins: 8, losses: 7, created_at: now, updated_at: now,
  },
  {
    id: "8", name: "Spécimen", chain: "Spécimen", category: "smash-burger",
    image_url: "/images/specimen.svg", location: { latitude: 48.8520, longitude: 2.3330, address: "Paris 6e" },
    elo_score: 1575, total_matches: 25, wins: 15, losses: 10, created_at: now, updated_at: now,
  },

  // --- POULET FRIT ---
  {
    id: "9", name: "Wingstop Bastille", chain: "Wingstop", category: "poulet-frit",
    image_url: "/images/wingstop.svg", location: { latitude: 48.8528, longitude: 2.3734, address: "Rue du Faubourg-Saint-Antoine, 75011 Paris" },
    elo_score: 1605, total_matches: 50, wins: 30, losses: 20, created_at: now, updated_at: now,
  },
  {
    id: "10", name: "Bonchon", chain: "Bonchon", category: "poulet-frit",
    image_url: "/images/bonchon.svg", location: { latitude: 48.8680, longitude: 2.3480, address: "Paris 2e" },
    elo_score: 1560, total_matches: 28, wins: 16, losses: 12, created_at: now, updated_at: now,
  },
  {
    id: "11", name: "Winner's Chicken", chain: "Winner's Chicken", category: "poulet-frit",
    image_url: "/images/winners.svg", location: { latitude: 48.8690, longitude: 2.3430, address: "Paris 2e" },
    elo_score: 1520, total_matches: 12, wins: 7, losses: 5, created_at: now, updated_at: now,
  },
  {
    id: "12", name: "Chik'Chill", chain: "Chik'Chill", category: "poulet-frit",
    image_url: "/images/chikchill.svg", location: { latitude: 48.8500, longitude: 2.3500, address: "Région Parisienne" },
    elo_score: 1500, total_matches: 10, wins: 5, losses: 5, created_at: now, updated_at: now,
  },
  {
    id: "13", name: "Dogma", chain: "Dogma", category: "poulet-frit",
    image_url: "/images/dogma.svg", location: { latitude: 48.8765, longitude: 2.3540, address: "Paris 10e" },
    elo_score: 1595, total_matches: 32, wins: 20, losses: 12, created_at: now, updated_at: now,
  },
  {
    id: "14", name: "Popeyes Grands Boulevards", chain: "Popeyes", category: "poulet-frit",
    image_url: "/images/popeyes.svg", location: { latitude: 48.8714, longitude: 2.3450, address: "32 Bd de Bonne Nouvelle, 75010 Paris" },
    elo_score: 1545, total_matches: 25, wins: 17, losses: 8, created_at: now, updated_at: now,
  },
  {
    id: "15", name: "Chicken Street", chain: "Chicken Street", category: "poulet-frit",
    image_url: "/images/chickenstreet.svg", location: { latitude: 48.8730, longitude: 2.3550, address: "Paris 10e" },
    elo_score: 1480, total_matches: 40, wins: 18, losses: 22, created_at: now, updated_at: now,
  },
  {
    id: "16", name: "Chicking Saint-Michel", chain: "Chicking", category: "poulet-frit",
    image_url: "/images/chicking.svg", location: { latitude: 48.8534, longitude: 2.3443, address: "Bd Saint-Michel, 75005 Paris" },
    elo_score: 1475, total_matches: 15, wins: 9, losses: 6, created_at: now, updated_at: now,
  },
  {
    id: "17", name: "Tasty Crousti", chain: "Tasty Crousti", category: "poulet-frit",
    image_url: "/images/tastycrousti.svg", location: { latitude: 48.8600, longitude: 2.3800, address: "Paris" },
    elo_score: 1460, total_matches: 20, wins: 9, losses: 11, created_at: now, updated_at: now,
  },
  {
    id: "18", name: "Cocoricains", chain: "Cocoricains", category: "poulet-frit",
    image_url: "/images/cocoricains.svg", location: { latitude: 48.8715, longitude: 2.3440, address: "Grands Boulevards, Paris" },
    elo_score: 1565, total_matches: 28, wins: 16, losses: 12, created_at: now, updated_at: now,
  },

  // --- KEBAB ---
  {
    id: "19", name: "Streaters", chain: "Streaters", category: "kebab",
    image_url: "/images/streaters.svg", location: { latitude: 48.8640, longitude: 2.3980, address: "Rue des Pyrénées, 75020 Paris" },
    elo_score: 1680, total_matches: 60, wins: 45, losses: 15, created_at: now, updated_at: now,
  },
  {
    id: "20", name: "Les Frères Batignolles", chain: "Les Frères Batignolles", category: "kebab",
    image_url: "/images/batignolles.svg", location: { latitude: 48.8833, longitude: 2.3167, address: "Batignolles, Paris" },
    elo_score: 1610, total_matches: 42, wins: 28, losses: 14, created_at: now, updated_at: now,
  },
  {
    id: "21", name: "German Döner Kebab République", chain: "German Döner Kebab", category: "kebab",
    image_url: "/images/kebab.svg", location: { latitude: 48.8675, longitude: 2.3636, address: "Pl. de la République, 75003 Paris" },
    elo_score: 1505, total_matches: 20, wins: 12, losses: 8, created_at: now, updated_at: now,
  },
  {
    id: "22", name: "La Boule Maître Kebabier", chain: "La Boule", category: "kebab",
    image_url: "/images/laboule.svg", location: { latitude: 48.8685, longitude: 2.3450, address: "Paris 2e" },
    elo_score: 1640, total_matches: 55, wins: 38, losses: 17, created_at: now, updated_at: now,
  },
  {
    id: "23", name: "Sauce.", chain: "Sauce.", category: "kebab",
    image_url: "/images/sauce.svg", location: { latitude: 48.8735, longitude: 2.3440, address: "Rue du Faubourg Montmartre, Paris" },
    elo_score: 1585, total_matches: 18, wins: 12, losses: 6, created_at: now, updated_at: now,
  },

  // --- THAI / ASIATIQUE ---
  {
    id: "24", name: "Pitaya Oberkampf", chain: "Pitaya", category: "asiatique",
    image_url: "/images/pitaya.svg", location: { latitude: 48.8647, longitude: 2.3783, address: "Rue Oberkampf, 75011 Paris" },
    elo_score: 1530, total_matches: 22, wins: 14, losses: 8, created_at: now, updated_at: now,
  },
  {
    id: "25", name: "Nobi Nobi", chain: "Nobi Nobi", category: "asiatique",
    image_url: "/images/nobinobi.svg", location: { latitude: 48.8650, longitude: 2.3400, address: "Paris" },
    elo_score: 1515, total_matches: 16, wins: 9, losses: 7, created_at: now, updated_at: now,
  },
  {
    id: "26", name: "Wok to Walk Châtelet", chain: "Wok to Walk", category: "asiatique",
    image_url: "/images/woktowalk.svg", location: { latitude: 48.8584, longitude: 2.3474, address: "Les Halles, 75001 Paris" },
    elo_score: 1490, total_matches: 18, wins: 10, losses: 8, created_at: now, updated_at: now,
  },
];

export function getRandomDuel(fastfoods: FastFood[], category?: FoodCategoryId): [FastFood, FastFood] {
  const pool = category && category !== "all"
    ? fastfoods.filter((ff) => ff.category === category)
    : fastfoods;
  const list = pool.length >= 2 ? pool : fastfoods;
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}
