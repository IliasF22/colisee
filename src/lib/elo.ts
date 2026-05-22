import { EloResult } from "./types";

/**
 * Calcule les nouveaux scores Elo après un duel.
 *
 * Formule Elo standard :
 * 1. Probabilité attendue : E_a = 1 / (1 + 10^((R_b - R_a) / 400))
 * 2. Nouveau score : R'_a = R_a + K * (S_a - E_a)
 *    où S_a = 1 (victoire), 0 (défaite)
 *
 * @param winnerScore - Score Elo actuel du gagnant
 * @param loserScore  - Score Elo actuel du perdant
 * @param kFactor     - Facteur K (sensibilité). Par défaut 32.
 *                      Plus K est élevé, plus les scores bougent.
 *                      - 32 : standard (bon pour le MVP)
 *                      - 16 : compétitif (mouvements lents)
 *                      - 64 : volatile (mouvements rapides)
 * @returns EloResult avec les nouveaux scores et les deltas
 */
export function calculateElo(
  winnerScore: number,
  loserScore: number,
  kFactor: number = 32
): EloResult {
  // Probabilité attendue de victoire pour chaque joueur
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400));
  const expectedLoser =
    1 / (1 + Math.pow(10, (winnerScore - loserScore) / 400));

  // Calcul des nouveaux scores
  const winnerNewScore = Math.round(
    winnerScore + kFactor * (1 - expectedWinner)
  );
  const loserNewScore = Math.round(
    loserScore + kFactor * (0 - expectedLoser)
  );

  return {
    winnerNewScore,
    loserNewScore,
    winnerDelta: winnerNewScore - winnerScore,
    loserDelta: loserNewScore - loserScore,
  };
}

/**
 * Score Elo initial pour tout nouveau fast-food.
 */
export const INITIAL_ELO = 1500;

/**
 * Facteur K par défaut.
 */
export const DEFAULT_K_FACTOR = 32;
