/**
 * Modèle de données Firestore pour un fast-food.
 *
 * Collection: "fastfoods"
 *
 * Structure JSON dans Firestore :
 * {
 *   "name": "McDonald's Champs-Élysées",
 *   "chain": "McDonald's",
 *   "image_url": "https://...",
 *   "location": {
 *     "latitude": 48.8698,
 *     "longitude": 2.3075,
 *     "address": "140 Av. des Champs-Élysées, 75008 Paris"
 *   },
 *   "elo_score": 1500,
 *   "total_matches": 0,
 *   "wins": 0,
 *   "losses": 0,
 *   "created_at": Timestamp,
 *   "updated_at": Timestamp
 * }
 */

import { Timestamp } from "firebase/firestore";
import { FoodCategoryId } from "./categories";

export interface FastFoodLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface FastFood {
  id: string;
  name: string;
  chain: string;
  category: FoodCategoryId;
  image_url: string;
  location: FastFoodLocation;
  elo_score: number;
  total_matches: number;
  wins: number;
  losses: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Résultat d'un calcul Elo après un duel.
 */
export interface EloResult {
  winnerNewScore: number;
  loserNewScore: number;
  winnerDelta: number;
  loserDelta: number;
}

/**
 * Données d'un duel pour l'affichage.
 */
export interface Duel {
  contestant1: FastFood;
  contestant2: FastFood;
}
