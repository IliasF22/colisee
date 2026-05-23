import { FastFood } from "./types";
import { FoodCategoryId } from "./categories";

export function getRandomDuel(fastfoods: FastFood[], category?: FoodCategoryId): [FastFood, FastFood] {
  // Filtrer par catégorie si spécifiée
  const pool = category && category !== "all"
    ? fastfoods.filter((ff) => ff.category === category)
    : fastfoods;
    
  // Si on n'a pas au moins 2 restaurants dans la catégorie, on prend dans le pool global
  const list = pool.length >= 2 ? pool : fastfoods;
  
  // Si on n'a toujours pas 2 restaurants, on retourne les mêmes (cas d'erreur)
  if (list.length < 2) {
    return [list[0], list[0]];
  }

  // Mélanger et prendre les deux premiers
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}
