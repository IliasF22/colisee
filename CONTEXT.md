# Colisée — Contexte complet du projet

> Document de référence pour comprendre et faire évoluer **colisée.fr**.
> Sert de pré-prompt : tout ce qu'il faut savoir sur le produit, la stack, les données et les conventions.

---

## 1. Concept

**Colisée** est une web-app de **classement de fast-foods (indépendants & franchises) en France** par **duels**.
Principe « hot-or-not » : l'utilisateur vote entre deux fast-foods (« L'Arène »), un **score Elo** se met à jour, et un **classement** en découle.

- Ton : arène / gladiateurs (nom « Colisée », police Cinzel, accents **dorés**).
- Cible : la France, avec un focus **Île-de-France** (zone la plus fournie).
- **Uniquement des fast-foods** : les vrais restaurants (à table, chers), commerces, services, doublons et adresses étrangères sont exclus.
- Pas de connexion requise pour parcourir et voter ; connexion (Google/email) requise pour proposer une adresse ou signaler.

---

## 2. Stack & déploiement

- **Next.js 16.2.6** (App Router, Turbopack) · **React 19** · **TypeScript** · **Tailwind CSS v4**.
- **Firebase** : Auth (Google + email/mot de passe) + **Firestore** (base temps réel via `onSnapshot`).
- **Cartes** : Leaflet / react-leaflet (page Carte).
- **lucide-react** (icônes) · **next-themes** (thème clair/sombre).
- **Google Maps Places API** (legacy *et* new v1) : utilisée par les scripts de données (photos, avis, note, types, niveau de prix).
- **Hébergement** : **Vercel** (déploiement auto sur push `main` du repo GitHub `IliasF22/colisee`). Domaine : **colisée.fr** (punycode `xn--colise-fva.fr`).
- **Firebase project id** : `coliseefood`.

### Variables d'environnement
- Client (`NEXT_PUBLIC_*`) : `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Serveur / scripts : `GOOGLE_MAPS_API_KEY` (Places), `FIREBASE_ADMIN_KEY` (JSON service account sur une ligne — **jamais commité**, présent en local `.env.local` + Vercel prod/dev).

---

## 3. Structure du code

```
src/
  app/
    layout.tsx            Header global (logo, localisation, nav, thème, auth) + providers
    page.tsx              Accueil (logo, CTA duel / classement)
    duel/page.tsx         « L'Arène » : duels + vote + duel vedette
    classement/page.tsx   Classement (liste + popup détail + gate podium)
    carte/page.tsx        Carte Leaflet des fast-foods
    suggestions/page.tsx  Proposer un resto / signaler une adresse
    proposer/page.tsx     Formulaire de proposition (Google Place Picker → submissions)
    login/page.tsx        Connexion (Google / email)
    admin/
      layout.tsx          Garde admin (réservé à thefrejman@gmail.com)
      propositions/page.tsx  Modération des propositions (submissions)
      reports/page.tsx       Modération des signalements (reports)
      photos/page.tsx        Outil admin photos
    api/places/route.ts   Route serveur : photos Google Place (legacy)
    globals.css           Design system (variables couleur, animations)
    icon.svg              Favicon : « C » doré (police Cinzel, fond transparent)
  components/
    HeaderLocation.tsx    Sélecteur de ville (menu) + GPS
    MobileNav.tsx         Menu hamburger mobile (drawer animé + auth)
    ClickRipple.tsx       Onde dorée au clic (global)
    AuthButton.tsx        Bouton connexion / menu utilisateur (desktop)
    ThemeToggle.tsx       Bascule thème
    ThemeProvider.tsx     next-themes
    MapView.tsx           Carte Leaflet (chargée en dynamic, ssr:false)
  lib/
    firebase.ts           Init Firebase client
    types.ts              Modèle FastFood
    hooks.ts              useFastFoods() — lit fastfoods (filtre hidden)
    elo.ts                calculateElo() (K=32, Elo initial 1500)
    duel-utils.ts         getRandomDuel() (zone + score combiné)
    zones.ts              Zones (Paris et sa banlieue / villes), cityFromAddress
    geo.ts                distanceKm(), type UserLocation
    LocationContext.tsx   Contexte localisation (ville/GPS, persistance)
    AuthContext.tsx       Contexte auth Firebase
    categories.ts         Catégories de fast-food
    engagement.ts         Compteur de duels (gate podium, localStorage)
scripts/                  Outils data (Admin SDK) — voir §9
firestore.rules           Règles de sécurité Firestore
firebase.json / .firebaserc  Config CLI Firebase (déploiement règles)
```

---

## 4. Modèle de données (Firestore)

### Collection `fastfoods`  (~978 docs, ~909 visibles)
`docId` = `${google_place_id}_${category}`.

```ts
interface FastFood {
  id: string;
  name: string;            // nom Google
  chain: string;           // marque / enseigne
  category: FoodCategoryId;
  image_url: string;       // photo Google (ou fallback Unsplash)
  location: { latitude: number; longitude: number; address: string };
  neighborhood: string;    // quartier / ville
  tagline: string;
  google_reviews?: number; // nb d'avis Google
  google_rating?: number|null;
  price_level?: number|null; // 1=€,2=€€,3=€€€ (Google). Défaut affiché €€
  is_franchise?: boolean;  // enseigne multi-adresses
  franchise_name?: string;
  hidden?: boolean;        // exclu de l'app (non-fast-food, étranger, cher…)
  elo_score: number;       // défaut 1500
  total_matches: number; wins: number; losses: number;
  created_at: Timestamp; updated_at: Timestamp;
}
```
- **Voting** met à jour uniquement `elo_score, total_matches, wins, losses, updated_at`.
- Le filtre `hidden` se fait **côté client** dans `useFastFoods()` (les docs masqués restent en base, réversible).

### Collection `submissions` (propositions utilisateurs)
`{ place_id, name, address, lat, lng, category, status:"pending"|"approved"|"rejected", submitterName/Email, createdAt }`.
Créées via `/proposer` (connexion requise), modérées via `/admin/propositions` (approuver → crée un `fastfoods`).

### Collection `reports` (signalements)
`{ restaurant, reason, message, status:"pending"|"resolved"|"dismissed", submittedBy/Email/Name, createdAt }`.
Créées via `/suggestions` (connexion requise), traitées via `/admin/reports`.

### Catégories (`FoodCategoryId`)
`all`(🏛️ Général) · `poulet-frit`(🍗) · `smash-burger`(🍔) · `pizza`(🍕) · `kebab`(🥙) · `sandwich`(🥪) · `crousti`(🍚) · `thai`(🍜) · `asiatique`(🥢) · `tacos`(🌮).

---

## 5. Fonctionnalités par page

### Accueil `/`
Logo Colisée (noir en clair / blanc en sombre), pitch, CTA « Commencer un duel » + « Voir le classement ».

### L'Arène `/duel`
- Deux cartes (photo, nom, quartier, badges catégorie + Franchise + prix). Clic = vote.
- **Score combiné** quand une localisation est définie : on borne le duel à la **zone** (ville/agglo), puis on classe par proximité × popularité (avis) et on tire 2 candidats parmi les meilleurs. Garde-fou : jamais de duel à >50 km ; si la catégorie est trop rare localement → les 2 plus proches.
- **Duel vedette** (catégorie Général) : à l'ouverture/au retour, une affiche au hasard parmi : Le 129 vs Tasty Crousty · Pepe Chicken vs Tasty Crousty · Pepe Chicken vs Le 129 · Popeyes vs Pepe Chicken. Badge « ⭐ Duel en vedette ». Après vote/skip → duels aléatoires.
- **Animations** : gagnant grossit + halo doré + couronne 👑 ; perdant grisé/réduit ; vibration mobile au vote.
- Toggle « À proximité », pills catégories, « Je ne connais pas ce spot » (ouvre une fiche), « Passer ».

### Classement `/classement`
- Ligne épurée : **rang · badge prix (€€€ doré) · nom · badge Franchise · quartier + catégorie · chevron**. Clic = **popup** (photo, Score Elo / Win% / Votes, prix, adresse, **lien Google Maps**, fermer).
- Vues : Par catégorie (tri Elo) · Par ville · À proximité (tri distance). Recherche.
- **Gate engagement** : le **podium (top 3) est flouté** tant que < 3 duels (localStorage `colisee_duels_done`), avec overlay « Débloque le podium · Fais X duels » + CTA. Toast « 🎉 Podium débloqué ! ». Le reste de la liste reste visible.

### Carte `/carte`
Carte Leaflet des fast-foods (markers), filtre par catégorie, géoloc.

### Suggestions `/suggestions`
Deux cartes : « Proposer un restaurant » (→ `/proposer`) et « Signaler une adresse » (formulaire → `reports`, connexion requise).

### Admin `/admin/*` (réservé `thefrejman@gmail.com`)
Garde dans `admin/layout.tsx` (sinon redirection). Pages : propositions, reports, photos.

---

## 6. Systèmes clés

- **Localisation** (`LocationContext`) : **pas de GPS auto**. L'utilisateur choisit sa **ville** (menu déroulant `HeaderLocation`, recherche + liste) ou active le **GPS** à la demande. Choix mémorisé (localStorage `colisee_city`). Choisir une ville = se positionner au centre des restos de cette ville. Label affiché = ville (ou zone). Pastille dorée quand défini.
- **Zones** (`zones.ts`) : Île-de-France (dépts 75/77/78/91/92/93/94/95) regroupée en « Paris et sa banlieue » ; sinon nom de ville. Sert à borner les duels.
- **Elo** (`elo.ts`) : standard, K=32, Elo initial 1500.
- **Thème** : variables CSS dans `globals.css`. La variante `dark:` de Tailwind suit la **classe `.dark`** (via `@custom-variant dark`) pilotée par next-themes (et NON le `prefers-color-scheme`).
- **Modération « hidden »** : champ `hidden=true` (réversible) pour masquer ce qui n'est pas un fast-food. Filtré côté client.
- **Couleur dorée** : token `--gld` (`text-gld`/`bg-gld`, ~#eab308/#facc15). Touches dorées : localisation, tag Franchise, badge prix, VS, votes, rang 1, ripple, couronne.

---

## 7. Sécurité (Firestore rules)

Déployées (`firestore.rules`) :
- `fastfoods` : **lecture publique** ; **update anonyme limité aux champs Elo** (vote) ; create/delete/update complet = **admin** (`request.auth.token.email == "thefrejman@gmail.com"`).
- `submissions` & `reports` : **create** si authentifié ; **read/update/delete** = admin.
- Les **scripts** contournent les règles via le **Firebase Admin SDK** (service account `FIREBASE_ADMIN_KEY`).
- Le garde admin côté client est cosmétique ; la **vraie** sécurité = les règles (basées sur l'email).

---

## 8. Conventions & pièges

- **Déploiement** = `git push origin main` → Vercel (prod). Les changements de **données Firestore** sont **live immédiatement** (temps réel), sans redéploiement ; seuls les changements de **code** nécessitent un déploiement.
- `scripts/` est **exclu du typecheck Next** (`tsconfig.json` exclude) pour qu'un script de dev ne casse pas le build de prod. Les scripts se lancent avec `npx tsx scripts/xxx.ts`.
- `docId = place_id_category` : changer la catégorie d'un resto se fait en **mettant à jour le champ `category`** (l'app filtre sur le champ, pas sur l'id). L'id garde son ancien suffixe — sans impact.
- **Suppression définitive interdite** par convention de l'assistant → on **masque** (`hidden`) au lieu de supprimer (réversible). Un script de purge existe mais à lancer manuellement.
- Inputs : police ≥ 16px pour éviter le zoom iOS au focus.
- Modales/drawers : rendus via **portal** (`document.body`) pour échapper au `backdrop-blur` du header (sinon `position:fixed` confiné).

---

## 9. Scripts data (`scripts/`, via Admin SDK)

Helper commun : `_admin-db.ts` (init Admin SDK + wrappers façon modular).

| Script | Rôle |
|---|---|
| `seed-france.ts` | Seed initial de fast-foods (Google textsearch, multi-résultats, filtre chaînes interdites + avis min) |
| `detect-chains.ts` | Détecte les chaînes (même nom à ≥N adresses France) et ajoute les antennes manquantes |
| `expand-franchises.ts` | Complète des franchises ciblées (toutes leurs antennes) |
| `tag-franchises.ts` | Marque `is_franchise` (regroupement par marque ≥2 adresses, denylist de mots génériques) |
| `fetch-prices.ts` | Récupère `price_level` (Google) |
| `filter-restaurants.ts` | Repère les **vrais restaurants** via `primaryType` (new Places API) → `hidden` |
| `hide-nonfood.ts` | Masque les non-fast-foods (types Google : grocery/store/services…) |
| `hide-expensive.ts` | Masque les €€€+ |
| `hide-keywords.ts` | Masque par mot-clé de nom (patisserie, buffet…) |
| `purge-nonfood.ts` | (Suppression — à lancer manuellement) |
| `seed-votes.ts` | Classement simulé pour les restos à 0 vote (Elo dérivé note/avis + aléa), préserve les vrais votes |
| `add-pepe-chicken.ts` | A ajouté les antennes Pépé Chicken (poulet-frit) |
| `add-neighborhood.ts`, `fix-chains.ts`, `update-categories.ts`, `seed.ts` | Utilitaires divers |

La plupart ont un mode aperçu (lecture seule) et un mode `--apply` / `--write` / `--confirm`.

---

## 10. État actuel des données (indicatif)

- ~**909 fast-foods visibles** (69 masqués), ~**404** taggés Franchise.
- Répartition catégories (visibles) : kebab 221 · tacos 178 · smash-burger 134 · poulet-frit 101 · pizza 91 · asiatique 78 · crousti 47 · sandwich 40 · thai 19.
- Classement actuellement **simulé** (« pour l'instant ») + vrais votes au fur et à mesure.

---

## 11. Idées / roadmap (non implémenté)

- Rotation hebdo des duels vedette (au lieu d'aléatoire) ; plus d'affiches (Berliner vs Marmaris, Chamas vs Mister Tacos…).
- Détection franchise plus fine (antennes avec suffixe de quartier non rattrapées, ex. « PB Poulet Braisé Nation »).
- Lien « Admin » visible uniquement pour l'admin.
- Reset des votes (repartir de 1500) quand assez de vrais votes.
- Récupération du `price_level` / vedette pour les futurs ajouts via les scripts de seed.
