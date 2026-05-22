# 🏛️ Colisée — Vision Produit

## Concept
**Colisée** est une application web interactive qui permet aux utilisateurs de comparer, classer et géolocaliser des fast-foods via un système de duels inspiré du classement Elo.

## Objectif
Créer une expérience ludique et addictive où chaque vote compte. Les utilisateurs confrontent deux fast-foods, votent pour leur préféré, et façonnent un classement vivant et communautaire.

## Stack Technique
- **Frontend** : Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend / BDD** : Firebase (Firestore) — temps réel, serverless
- **Cartographie** : Leaflet + react-leaflet (gratuit, open-source, léger)
- **Icônes** : Lucide React
- **Déploiement cible** : Firebase Hosting / Vercel

## Fonctionnalités MVP
1. **L'Arène (Mode Duel)** — Deux fast-foods face à face, l'utilisateur vote, le score Elo est mis à jour en temps réel dans Firestore.
2. **Le Classement** — Leaderboard temps réel trié par score Elo décroissant.
3. **La Carte** — Carte interactive avec géolocalisation utilisateur + pins des fast-foods proches.

## Design
- Style institutionnel/premium
- Palette noir & blanc avec accents subtils
- Typographie Geist (Sans + Mono)
- Animations micro-interactions soignées
- Responsive mobile-first

## Architecture de Données Firestore
Collection `fastfoods` :
```json
{
  "id": "auto-generated",
  "name": "McDonald's Champs-Élysées",
  "chain": "McDonald's",
  "image_url": "https://...",
  "location": {
    "latitude": 48.8698,
    "longitude": 2.3075,
    "address": "140 Av. des Champs-Élysées, 75008 Paris"
  },
  "elo_score": 1500,
  "total_matches": 0,
  "wins": 0,
  "losses": 0,
  "category": "smash_burger",
  "created_at": "Timestamp",
  "updated_at": "Timestamp"
}
```

## Recommandation Cartographie
**Leaflet** est recommandé par rapport à Google Maps car :
- ✅ 100% gratuit et open-source (pas de clé API payante)
- ✅ Excellente intégration React via `react-leaflet`
- ✅ Léger et performant
- ✅ Tiles personnalisables (OpenStreetMap, CartoDB, etc.)
- ✅ Communauté active

## Phases Futures
- Authentification utilisateur (Firebase Auth)
- Historique des votes personnels
- Système de commentaires / avis
- Filtres par chaîne, par ville
- Mode tournoi (bracket elimination)
- PWA pour une expérience mobile native

## Catégories
Le système de filtrage par catégorie est transversal (Arène, Classement, Carte) :
- 🍗 Poulet Frit (`poulet_frit`)
- 🍔 Smash Burger (`smash_burger`)
- 🍕 Pizza (`pizza`)
- 🥙 Kebab (`kebab`)
- 🍜 Thaïlandais (`thai`)
- 🥢 Asiatique (`asiatique`)
