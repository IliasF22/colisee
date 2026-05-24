/**
 * Catégories de fast-food pour le filtrage.
 */
export const FOOD_CATEGORIES = [
  { id: "all", label: "Général", emoji: "🏛️" },
  { id: "poulet-frit", label: "Poulet Frit", emoji: "🍗" },
  { id: "smash-burger", label: "Smash Burger", emoji: "🍔" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "kebab", label: "Kebab", emoji: "🥙" },
  { id: "sandwich", label: "Sandwich", emoji: "🥪" },
  { id: "crousti", label: "Crousti", emoji: "🍚" },
  { id: "thai", label: "Thaïlandais", emoji: "🍜" },
  { id: "asiatique", label: "Asiatique", emoji: "🥢" },
  { id: "tacos", label: "Tacos", emoji: "🌮" },
] as const;

export type FoodCategoryId = (typeof FOOD_CATEGORIES)[number]["id"];
