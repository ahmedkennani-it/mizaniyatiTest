# Mizaniyati — Application mobile de budget familial

Application mobile (Expo / React Native / TypeScript) de gestion de budget
familial pour les marchés MENA. **100 % local** : aucune connexion bancaire,
aucune donnée envoyée à un serveur. Saisie manuelle uniquement.

- **Multilingue** : arabe (RTL), français, anglais (`react-i18next`)
- **Persistance locale** : `expo-sqlite` avec migrations versionnées
- **Confidentialité** : les données restent sur l'appareil

## Prérequis

- Node.js 20+
- npm 10+
- [Expo CLI](https://docs.expo.dev/) (via `npx expo`)

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npm run web       # ouvre l'app dans le navigateur (LTR + RTL)
npm run ios       # simulateur iOS
npm run android   # émulateur Android
npm start         # Metro bundler (choix de la cible)
```

## Qualité (portes automatiques)

```bash
npm run typecheck   # TypeScript strict, sans émission
npm run lint        # ESLint + Prettier
npm test            # Jest + @testing-library/react-native
npm run test:ci     # Jest en mode CI (runInBand)
```

## Structure du projet

L'architecture est organisée par domaine métier plutôt qu'en couches
techniques uniques. Les barrels `src/app`, `src/features`, `src/lib` et
`src/types` offrent des points d'entrée conventionnels vers cette structure.

| Dossier | Rôle |
| --- | --- |
| `src/app` | Racine de composition de l'application (navigation) |
| `src/components` | Composants d'UI partagés (kit) |
| `src/features` | Logique métier par domaine (zakat, tontine, catégories…) |
| `src/screens` | Écrans de l'application |
| `src/navigation` | Navigation (React Navigation) |
| `src/i18n` | Internationalisation et bascule LTR/RTL |
| `src/theme` | Tokens de design (couleurs, typo, rayons) |
| `src/lib` | Helpers de formatage (montants, dates, devises) |
| `src/types` | Types partagés des entités du domaine |
| `src/db` | Persistance locale (SQLite, migrations, repositories) |

## Garde-fous

- Aucune API bancaire réelle, aucun scraping, aucun identifiant financier codé en dur
- Aucune chaîne de texte visible en dur : tout passe par i18n (`ar` / `fr` / `en`)
- Aucune couleur, taille ou rayon en dur : tout passe par les tokens de `src/theme`
- Mise en page en propriétés logiques (`start` / `end`) pour rester correcte en RTL
