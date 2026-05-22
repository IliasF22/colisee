# 📜 Changelog — Colisée

Toutes les modifications notables du projet sont documentées ici.

---

## [0.2.0] — 2026-05-22

### 🌑 Refonte Dark Mode
- Passage complet au dark mode (#1a1a1a) inspiré de LMArena
- Nouvelle palette de couleurs : surfaces (#242424), bordures (#333), texte muted (#888)
- Tiles CartoDB dark_all sur la carte Leaflet
- Popups de carte stylisées en dark
- Scrollbar custom (fine, discrète)

### 🍗 Système de Catégories
- Ajout de `src/lib/categories.ts` avec 6 types : Poulet Frit, Smash Burger, Pizza, Kebab, Thaïlandais, Asiatique
- Filtrage par catégorie intégré dans : L'Arène, Le Classement, La Carte
- Pills de catégories avec emojis et état actif/inactif
- Ajout du champ `category` (FoodCategoryId) au modèle `FastFood`

### 🎨 Design & UI
- Header compact (56px) avec logo, nav inline, hover subtils
- Footer minimal avec version
- Category pills : fond dark, état actif inversé (blanc sur noir)
- Duel cards : hover lift, winner glow vert, loser fade
- Leaderboard : rows avec hover, médailles or/argent/bronze, trend indicators
- Animations : fade-in, slide-left/right, VS pulse, Elo flash

### 📦 Données
- 12 mock fast-foods diversifiés avec catégories assignées
- Fonction `getRandomDuel()` supportant le filtrage par catégorie

---

## [0.1.0] — 2026-05-22

### 🎉 Initialisation du Projet
- Création du projet Next.js 15 avec TypeScript et App Router
- Installation et configuration de Tailwind CSS v4
- Installation de Firebase SDK (Firestore)
- Installation de Leaflet + react-leaflet pour la cartographie
- Installation de Lucide React pour les icônes

### 🏗️ Architecture
- Mise en place de la structure `src/` avec App Router
- Création du fichier de configuration Firebase (`src/lib/firebase.ts`) avec variables d'environnement
- Création du modèle de types TypeScript (`src/lib/types.ts`)
- Création de la fonction utilitaire Elo (`src/lib/elo.ts`)

### 🎨 Design & UI
- Design premium noir & blanc institutionnel avec Tailwind CSS
- Navigation responsive avec barre latérale et header
- Typographie Geist Sans + Geist Mono

### 📄 Pages
- **Page d'accueil** : Landing page avec hero section et présentation des fonctionnalités
- **L'Arène (Duel)** : Interface de duel entre deux fast-foods avec animation de vote
- **Le Classement** : Leaderboard avec scores Elo et statistiques
- **La Carte** : Carte interactive Leaflet avec géolocalisation utilisateur

### 📋 Documentation
- Création du fichier `vision.MD` (document de référence produit)
- Création du fichier `changelog.md`
- Création du fichier `.env.local.example` pour les variables Firebase
