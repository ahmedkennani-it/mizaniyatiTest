# Mizaniyati Frontend — Instructions Claude Code

## Stack
- Expo (React Native) + TypeScript strict
- expo-router (navigation par onglets + piles d'écrans)
- expo-sqlite (persistance locale) — aucune donnée n'est envoyée à un serveur
- i18n : react-i18next / expo-localization (catalogues `ar`, `fr`, `en`), RTL via `I18nManager`
- Tests : Jest + @testing-library/react-native
- Lint/format : ESLint + Prettier

## Garde-fous obligatoires
- **Aucune connexion bancaire réelle, aucun scraping, aucun identifiant financier** codé en dur ou halluciné. La saisie reste 100% manuelle — ne jamais introduire d'appel à une API bancaire ou d'agrégateur.
- **Abonnement Pro** : modélise l'état (plan, essai, expiration) et l'écran de paywall, mais l'achat réel passe par un mock local du flux d'achat in-app. Ne jamais coder en dur une vraie clé RevenueCat / App Store / Play — ces identifiants viennent uniquement de variables d'environnement, quand ils existeront.
- **Taux de change et nisab (zakat)** : valeurs mockées et paramétrables dans `src/lib/rates` ou équivalent, documentées comme fictives dans un commentaire. Ne jamais appeler une vraie API de change en dur.
- **Données de démonstration** (Famille Benali, Youssef, Salma, etc.) : fictives, à documenter comme telles dans le fichier de seed/mock.
- **Aucune chaîne de texte visible en dur** : tout passe par i18n (`ar`/`fr`/`en`). Une tâche n'est pas terminée s'il reste une chaîne littérale visible.
- **Secrets** (clés API tierces futures) : uniquement via variables d'environnement / app config, jamais en dur dans le code.

## Conventions de code
- Architecture : `src/app` (écrans expo-router) / `src/features/<domaine>` (logique métier) / `src/components` (composants partagés) / `src/theme` (tokens) / `src/i18n` / `src/lib` (formatage, helpers)
- Un test de rendu par composant partagé ; un test unitaire par règle métier non triviale (calcul de solde, répartition par catégorie, plafond, zakat, etc.)
- Tout montant affiché passe par le helper centralisé de `src/lib/format` (devise + séparateurs selon la locale) — jamais d'interpolation manuelle
- Aucune couleur, taille de police ou rayon en dur : tout passe par les tokens de `src/theme`
- Toute mise en page utilise les propriétés logiques (`start`/`end`), jamais `left`/`right`, pour rester correcte en RTL
- Tests colocalisés : `Composant.test.tsx` à côté du composant

## Règles de travail (boucle Ralph)
- Lire `mizaniyati-frontend-prd.json` au début de chaque itération
- Traiter les tâches dans l'ordre des phases, **une seule tâche par itération**
- Implémenter la tâche **complètement**, avec ses tests
- Après implémentation :
  1. `npm run typecheck` — aucune erreur
  2. `npm run lint` — aucune erreur
  3. `npm test` — tous les tests passent
  4. Si une tâche a un rendu visuel, vérifier dans le navigateur (`npm run web`) en LTR **et** en RTL
  5. Si échec à une étape : corriger avant de continuer
- Marquer la tâche `"done": true` dans `mizaniyati-frontend-prd.json`
- `git commit -m "feat(X.Y): description courte"`
- **Pousser immédiatement après chaque commit** : `git push`
  - Si le push échoue (conflit/retard) : `git pull --rebase` puis réessayer
  - Si le push échoue pour une raison d'authentification : documenter dans `progress.md` et s'arrêter pour signaler le blocage
- Ne jamais casser un écran ou un composant déjà terminé et testé
- Ne jamais introduire une des violations listées dans les garde-fous, même partiellement : si une tâche semble l'exiger, laisser `"done": false`, documenter le blocage dans `progress.md` et passer à la tâche suivante

## Critère de fin
Quand **toutes** les tâches des 17 phases de `mizaniyati-frontend-prd.json` sont `done: true`, que `npm run typecheck`, `npm run lint` et `npm test` passent, que chaque écran a été vérifié en LTR et en RTL, et que chaque fonction marquée `"plan": "pro"` est bien verrouillée derrière l'état d'abonnement, écrire exactement :

<promise>SAHTI_FRONTEND_COMPLETE</promise>

N'écris jamais cette phrase tant qu'il reste une tâche `done: false`. S'il reste des tâches et que tu ne peux plus progresser, documente le blocage dans `progress.md` et termine ta réponse normalement.
