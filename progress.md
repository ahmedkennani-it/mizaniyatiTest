# Progress — Boucle Ralph

Suivi des itérations sur `mizaniyati-frontend-prd.json`. Portée initiale : phase 1
seule ; étendue au développement des US (phases 2+) à partir de l'itération 8.

## État des tâches Phase 1

**6 / 7 tâches `done: true`.** La phase 1 n'est pas close : la 1.7 reste ouverte.

| Tâche | Titre | Statut |
| --- | --- | --- |
| 1.1 | Scaffolder le projet Expo + TypeScript | ✅ done |
| 1.2 | Porte qualité (lint, typecheck, tests, CI) | ✅ done |
| 1.3 | Modèle de données et persistance locale | ✅ done |
| 1.4 | Infrastructure i18n et bascule LTR/RTL | ✅ done |
| 1.5 | Miroir RTL des composants de base | ✅ done |
| 1.6 | Formats locaux nombres/dates/devises | ✅ done |
| 1.7 | Stockage local des données | ⚠️ `done: false` — 3/4 critères, bloqué sur le chiffrement |

Porte qualité au 2026-07-16 : `npm run typecheck` ✅ · `npm run lint` ✅ ·
`npx jest` **712/712, 87 suites — suite entièrement verte**.

### Ce qui bloque la clôture de la phase 1

1. **Chiffrement de la base au repos (1.7)** — `expo-sqlite` n'expose aucune clé de
   chiffrement. Les données financières sont aujourd'hui **en clair** dans
   `mizaniyati.db`. Décision d'architecture en attente (chiffrement OS /
   op-sqlite+SQLCipher / colonnes chiffrées). Détail : itération 7 ci-dessous.
2. **Vérification navigateur LTR + RTL (1.4, 1.5, 1.6)** — exigée par les critères
   d'acceptation, **jamais effectuée** : la skill `dev-browser` n'existe pas dans
   l'environnement d'exécution de la boucle. À faire à la main via `npm run web`.
   La couverture RTL repose entre-temps sur les tests de rendu dans les deux
   directions.
3. **Commits non poussés** — voir la section « Blocage `git push` » plus bas.

## État des tâches Phase 2 (Design system & accessibilité) — ✅ 5/5

| Tâche | Titre | Statut |
| --- | --- | --- |
| 2.1 | Design tokens et palette | ✅ done |
| 2.2 | Composants de base : Header, Bouton, Tag, Card | ✅ done |
| 2.3 | Composants financiers : Montant, Progression, Anneau, Ligne, Avatar | ✅ done |
| 2.4 | Contraste et mise à l'échelle des textes | ✅ done |
| 2.5 | Libellés pour lecteurs d'écran | ✅ done |

## État des tâches Phase 3 (Shell de navigation)

| Tâche | Titre | Statut |
| --- | --- | --- |
| 3.1 | Navigation et shell applicatif | ⚠️ `done: false` — exige expo-router, absent du projet |
| 3.2 | Barre de navigation principale | ✅ done |

## État des tâches Phase 4 (Onboarding & configuration initiale)

| Tâche | Titre | Statut |
| --- | --- | --- |
| 4.1 | Écran de bienvenue | ✅ done |
| 4.2 | Choix de la langue | ✅ done |
| 4.3 | Choix du pays / marché et devise | ✅ done |
| 4.4 | Écran de confidentialité | ✅ done |
| 4.5 | Création du foyer | ✅ done |
| 4.6 | Connexion à un compte existant | 🚨 `done: false` — bloquée par des dépendances de phase 17 |

## État des tâches Phase 5 (Dashboard — Solde du mois) — ✅ 8/8

| Tâche | Titre | Statut |
| --- | --- | --- |
| 5.1 | Hero solde du mois restant | ✅ done |
| 5.2 | Sélecteur de mois | ✅ done |
| 5.3 | Anneau de répartition par catégorie | ✅ done |
| 5.4 | Dernières transactions | ✅ done |
| 5.5 | État vide du dashboard | ✅ done |
| 5.6 | Chip de confiance « saisie manuelle » | ✅ done |
| 5.7 | Aperçu des objectifs | ✅ done |
| 5.8 | Bandeau de découverte vocale | ✅ done |

## État des tâches Phase 6 (Saisie des opérations)

| Tâche | Titre | Statut |
| --- | --- | --- |
| 6.1 | Saisie rapide au pavé numérique | ✅ done |
| 6.2 | Sélection de catégorie par chips | ✅ done |
| 6.3 | Capture audio et état d'écoute (Pro) | ✅ done |
| 6.4 | Transcription vocale multilingue (Pro) | ✅ done |
| 6.5 | Extraction du montant depuis la dictée (Pro) | ✅ done |
| 6.6 | Déduction catégorie/libellé et confirmation (Pro) | ✅ done |
| 6.7 | Confirmation d'ajout | ✅ done |
| 6.8 | Saisie d'un revenu | ✅ done |
| 6.9 | Modification et suppression | ⚠️ `done: false` — 3/4 critères, bloqué sur « membre Lecture seule » |
| 6.10 | Attribution à un membre | ✅ done |
| 6.11 | Choix de la date | ✅ done |

## État des tâches Phase 7 (Catégories, plafonds & alertes) — ✅ 7/7

| Tâche | Titre | Statut |
| --- | --- | --- |
| 7.1 | Liste des catégories avec plafonds mensuels | ✅ done |
| 7.2 | Alerte de dépassement de plafond | ✅ done |
| 7.3 | Détail d'une catégorie | ✅ done |
| 7.4 | Édition du plafond mensuel avec presets | ✅ done |
| 7.5 | Limite de 3 catégories en plan Gratuit | ✅ done |
| 7.6 | Seuil d'alerte configurable par catégorie | ✅ done |
| 7.7 | Report du reste au mois suivant (rollover, Pro) | ✅ done |

## État des tâches Phase 8 (Objectifs & coffres) — ✅ 4/4

| Tâche | Titre | Statut |
| --- | --- | --- |
| 8.1 | Liste des objectifs & coffres | ✅ done |
| 8.2 | Création d'un objectif d'épargne | ✅ done |
| 8.3 | Détail d'un objectif avec versement suggéré | ✅ done |
| 8.4 | Versements sur un objectif et historique | ✅ done |

## État des tâches Phase 9 (Tontine / daret) — ✅ 5/5

| Tâche | Titre | Statut |
| --- | --- | --- |
| 9.1 | Vue d'ensemble d'une tontine (daret) | ✅ done |
| 9.2 | Création et paramétrage d'une tontine | ✅ done |
| 9.3 | Mise en avant de mon tour | ✅ done |
| 9.4 | Suivi des paiements du tour en cours | ✅ done |
| 9.5 | Calendrier des tours | ✅ done |

## État des tâches Phase 10 (Zakat & mode Ramadan) — ✅ 4/4

| Tâche | Titre | Statut |
| --- | --- | --- |
| 10.1 | Mode Ramadan (thème saisonnier) | ✅ done |
| 10.2 | Calculateur de Zakat | ✅ done |
| 10.3 | Catégorie Zakat & dons avec plafond | ✅ done |
| 10.4 | Enregistrement et planification du don de Zakat | ✅ done |

## Journal

### Itération 1 — Tâche 1.1 (Scaffold Expo + TypeScript) ✅
- Vérifié : Expo SDK 54 + TypeScript strict (`tsconfig.json` `strict: true`),
  `npm run typecheck` passe.
- Ajout d'un `README.md` (lancement app + tests, structure, garde-fous).
- Création des points d'entrée structurels manquants : `src/app`, `src/features`,
  `src/lib`, `src/types` (barrels réels vers l'architecture par domaine existante,
  pas des dossiers vides).
- `npm run typecheck` ✅ et `eslint` ✅ sur les nouveaux fichiers.

### Itération 2 — Tâche 1.2 (Porte qualité) ✅
- Scripts npm présents : `typecheck`, `lint`, `test`, `test:ci`.
- ESLint + Prettier configurés et passants (`eslint.config.js` avec globals Jest).
- Jest + `@testing-library/react-native` configurés (preset `jest-expo`), tests
  témoins passants (ex. `kit.smoke.test.tsx`).
- Ajout du workflow GitHub Actions `.github/workflows/ci.yml` : typecheck + lint
  + tests sur chaque push et PR.
- Note : la CI restera rouge tant que les tests de phases ultérieures (US-021/
  023/025/028) échouent — c'est le comportement attendu, hors périmètre Phase 1.

### Itération 3 — Tâche 1.3 (Modèle de données et persistance locale) ✅
- Couche `src/db` existante : `expo-sqlite`, migrations versionnées (0001→0014),
  un repository par entité avec tests unitaires, aucun appel réseau.
- Entités déjà présentes : Member, Transaction, Category, Tontine(+Round),
  Zakat (ZakatAssessment ← « ZakatCalculation »), Settings (UserSettings) ;
  Goal/GoalDeposit sont modélisés comme Vault/VaultContribution.
- Ajout des entités manquantes du critère : **Household**, **Debt**, **Transfer**
  - migration `0015_household_debt_transfer.ts` (tables + CHECK + FK membres),
  - types + repositories CRUD (`householdRepository`, `debtRepository`,
    `transferRepository`),
  - tests unitaires (31 tests), FK `transfers → members` ajoutée au moteur de
    test `createFakeDatabase`.
- `npm run typecheck` ✅, `eslint src/db` ✅, suite `src/db` : 136 tests ✅.

### Itération 4 — Tâche 1.4 (Infrastructure i18n et bascule LTR/RTL) ✅
- **Régression corrigée** : le commit `1a6dabf` (« fix ») a ajouté le catalogue
  `en` à `SUPPORTED_LANGUAGES`. La détection de langue device (`i18n.ts`)
  résolvait donc vers `en` sous jest (machine en-US) et **28 suites / 140 tests**
  échouaient parce qu'ils affirment des libellés français. Ajout de
  `jest/setupTests.js` qui épingle `expo-localization` sur `fr-MA` : les tests ne
  dépendent plus de la locale de la machine. → 140 échecs ramenés à 14.
- Tests de contexte réparés (`useLanguage`/`useEntitlements`/`useSubscription`/
  `useAppLock` hors provider) : `render()` lève de façon **synchrone** avec RNTL
  v13, le pattern `await expect(render(...)).rejects.toThrow()` n'attrapait rien.
- Chaîne en dur supprimée du shell : le FAB de `FloatingTabBar` portait
  `accessibilityLabel="add-transaction"` → clé `nav.addTransaction` (ar/fr/en).
- Nouveau test `src/navigation/__tests__/shellStrings.test.tsx` : rend le shell en
  fr puis en ar et vérifie qu'aucun libellé littéral/français ne subsiste en ar
  (vérifié par mutation : réintroduire le littéral fait bien échouer le test).
- Nouveau test `src/theme/__tests__/useAppFont.test.tsx` : IBM Plex Sans Arabic en
  `ar`, Outfit en `fr`/`en`.
- Test `i18n.test.ts` mis à jour : les 3 catalogues (ar/fr/en) sont comparés sur
  leurs clés **feuilles** (dotted paths), pas seulement les clés de premier niveau.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : 490/499 tests ✅.

### Itération 5 — Tâche 1.5 (Miroir RTL des composants de base) ✅
- Bords physiques → propriétés logiques : badge de `ScreenHeader` (`right` → `end`),
  blob décoratif + icône de coin de `BalanceHeroCard`, overlay du donut et barre
  d'onglets flottante (`left/right: 0` → `start/end: 0`).
- `DonutBreakdown` : l'anneau balayait toujours dans le sens horaire depuis midi.
  Il est désormais mirroité (`scaleX: -1`) en RTL pour balayer vers le côté de
  lecture ; le label central, dans un overlay frère, n'est pas mirroité.
- **Bug bidi corrigé** dans `AmountText` : `textAlign: 'left'` était codé en dur,
  ce qui collait le montant au bord opposé en RTL. Il suit maintenant le début de
  lecture, tandis que `writingDirection: 'ltr'` + les marques LTR gardent l'ordre
  latin des chiffres et du signe moins dans du texte arabe.
- Icônes : `Icon` mirroitait déjà les glyphes directionnels — couvert par un test
  (`Icon.rtl.test.tsx`) qui vérifie aussi que les glyphes non directionnels
  (maison, horloge…) ne le sont **pas**, et que rien ne l'est en LTR.
- Chaînes en dur restantes des composants de base supprimées (garde-fou i18n) :
  `back`, `previous-month`, `next-month` → section `a11y` des 3 catalogues. Les 8
  suites d'écrans qui ciblaient ces labels ont été mises à jour.
- `components.rtl.test.tsx` élargi : il rend tout le kit de base (header, month
  selector, hero card, row, progress bar, donut, bouton, champ, chip) et interdit
  **toute** clé de style directionnelle sur **tous** les nœuds de l'arbre — plus
  seulement les boutons. Vérifié par mutation (réintroduire `right: -3` fait
  échouer le test).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : 513/522 tests ✅
  (mêmes 9 échecs préexistants qu'avant l'itération, aucun régressé).

### Itération 6 — Tâche 1.6 (Formats locaux nombres/dates/devises) ✅
- ⚠️ **Locale française : `fr-MA`, tranché par le décideur produit.** Les milliers
  sont donc groupés par un **point** (`1.234,50`), la convention CLDR du français
  marocain — le marché de lancement. J'avais d'abord basculé sur `fr-FR` pour
  respecter la lettre du critère US-062 (« espace insécable ») ; décision inverse
  prise le 2026-07-16, retour à `fr-MA`.
- ✅ Le critère US-062 du PRD a été corrigé en conséquence : il demandait une espace
  insécable et contredisait le comportement retenu. Il spécifie désormais le point,
  en notant explicitement que le format `fr-FR` n'est pas celui retenu — 1.6 est
  donc `done: true` en accord avec son critère écrit.
- Le test existant `formatMoney` s'appelait « period thousands separator » et
  passait par accident : `/1.234,50.*MAD/` — le `.` du regex matchait l'espace.
  Nouveau `localeFormats.test.ts` qui assère les **codepoints réels** des
  séparateurs (U+202F, U+066C, U+066B) et non des regex permissives.
- Formats couverts par les tests : fr (espace insécable + virgule), en (virgule
  milliers, point décimal, symbole en préfixe), ar (séparateurs arabes + indicateur
  de devise localisé `د.م.` et non `MAD`, chiffres arabo-indiens).
- Dates : le formatage des mois était **dupliqué en ligne** dans `HomeScreen` et
  `CategoriesScreen` (violation de la règle « helper centralisé »). Centralisé dans
  `src/i18n/dateFormat.ts` (`formatMonthLabel`, `formatLongDate`, `formatShortDate`,
  `monthKeyOf`, `monthKeyToDate`) et branché sur les deux écrans.
- Les caractères invisibles (espaces insécables, marques LTR) sont écrits en
  échappements `\uXXXX` dans les tests : tapés au clavier ils sont indiscernables
  d'une espace normale dans une diff et feraient assérer le contraire du but visé.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : 530/539 tests ✅
  (mêmes 9 échecs préexistants).

### Itération 7 — Tâche 1.7 (Stockage local) ⚠️ laissée `done: false`

**3 critères sur 4 livrés. Le 4e est bloqué par la stack, décision utilisateur de
laisser la tâche ouverte.**

- 🚨 **« Base chiffrée au repos » : infaisable avec `expo-sqlite`.** Vérifié dans
  `node_modules/expo-sqlite/build/NativeDatabase.d.ts` : `SQLiteOpenOptions`
  n'expose que `enableChangeListener`, `useNewConnection`,
  `finalizeUnusedStatementsBeforeClosing` et `libSQLOptions` — **aucune clé de
  chiffrement, pas de SQLCipher**. Le code le reconnaissait déjà implicitement :
  `securityScreen.localOnlyNote` dit « il ne chiffre pas la base de données locale ».
  Options présentées à l'utilisateur (chiffrement OS / op-sqlite+SQLCipher /
  colonnes chiffrées) → **choix : laisser `done: false`** et trancher plus tard.
  Ne pas marquer cette tâche done sans avoir tranché : les données financières
  sont aujourd'hui en clair dans `mizaniyati.db`.
- ✅ Persistance locale + consultation hors ligne : `offlineStorage.test.ts` exécute
  saisie, édition et calcul d'agrégats avec `fetch`/`XMLHttpRequest`/`WebSocket`
  remplacés par des fonctions qui lèvent — tout passe.
- ✅ Disponibilité sans réseau : garde statique dans le même fichier, un cas de test
  **par fichier source** (167 fichiers), qui échoue si un `fetch(`/`XMLHttpRequest(`
  /`WebSocket(`/`EventSource(`/`sendBeacon(` apparaît dans `src/`. C'est aussi la
  moitié mécanique du garde-fou « aucune connexion bancaire / aucun scraping ».
  Vérifié par mutation.
- ✅ Avertissement de perte définitive : la mise en garde n'existait qu'en fin de
  `forgotPinNote` (note sur le PIN oublié) — là où personne ne la lit avant de
  désinstaller. Nouvelle section `storage` (ar/fr/en) + bannière d'alerte dédiée
  sur l'écran Sécurité, testée dans les 3 langues.
- `AlertBanner` gagne une prop optionnelle `title` (additive, testée).
- ⚠️ **`@types/node` ajouté** + `"types": ["jest", "node"]` dans `tsconfig.json`,
  nécessaire pour le scan de fichiers de la garde statique. Effet de bord à
  connaître : le code applicatif pourrait désormais importer `fs`/`path` sans que
  le typecheck s'en plaigne, alors que ça planterait sur l'appareil.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : 703/712 tests ✅
  (mêmes 9 échecs préexistants).

## 🚨 Blocage — `git push` impossible

Les commits sont faits **en local uniquement** — `main` est en avance sur
`origin/main`. L'utilisateur a demandé de continuer sans pousser et poussera
lui-même (la règle d'arrêt de `CLAUDE.md` est donc levée explicitement).

- `git push` → « Please make sure you have the correct access rights and the
  repository exists ». `git ls-remote origin` sur
  `git@github.com:ahmedkennani-it/mizaniyatiTest.git` reste bloqué jusqu'au
  timeout : l'accès SSH à GitHub n'aboutit pas depuis cet environnement (clé SSH
  absente/non chargée, ou réseau sortant filtré).
- **Action requise** : rétablir l'accès (charger la clé SSH, ou basculer le remote
  sur HTTPS avec un token), puis `git push`.

### Itération 8 — Réparation des 9 tests rouges (préalable au développement des US) ✅

Les 5 suites rouges depuis le début de la boucle échouaient toutes pour **la même
raison**, et **aucune n'était un bug produit** : elles interrogeaient l'écran avec
`getBy*` (synchrone) alors que ces écrans chargent leurs données en asynchrone
(config zakat, puces de catégories/membres, `settings` du verrou). Les assertions
tombaient avant que les champs existent.

- `ZakatScreen` (4) · `RecurringRuleForm` (2) · `HomeScreen` (1) → `findBy*` sur la
  première requête suivant le rendu ou l'ouverture d'un formulaire.
- `VaultDetail` (1) · `LockScreen` (1) → `waitFor` : ces deux-là assèrent une
  *disparition* ou un *appel de mock*, pour lesquels `findBy*` ne convient pas.
- Piste écartée : sur `HomeScreen`, le tableau de bord affiché sans l'opération
  laissait croire à un défaut de rafraîchissement après retour de l'écran de
  confirmation. En réalité le formulaire n'avait jamais été rempli — `getByText`
  échouait en amont, ligne 375. Le câblage `dataVersion` fonctionne.

**Suite entièrement verte : 712/712, 87 suites.** Plus aucun échec préexistant à
traîner — chaque tâche suivante peut désormais être marquée `done` sur une porte
qualité honnête.

### Itération 9 — Tâche 2.1 (Design tokens et palette) ✅
- **Couleurs de texte alignées sur la maquette** : `textSecondary` passe de `#475569`
  (valeur hors maquette) à `#334155`, ce qui *augmente* le contraste (7.58 → 10.35
  sur blanc). Ajout du 3e ton `textTertiary` `#64748B`, jusqu'ici absent.
- ⚠️ **`textTertiary` a une contrainte à connaître** : `#64748B` passe AA sur
  `surface` (4.76) et `background` (4.55) mais **échoue sur `surfaceAlt` (4.23)`**.
  Documenté dans le token. Son pendant sombre `#8595AC` a été choisi pour reproduire
  exactement la même contrainte (AA sur surface/background, pas sur surfaceAlt) —
  ma première valeur inventée (`#7C8CA5`) échouait AA sur `surface`, calcul à l'appui.
- **Critère « aucune couleur hors tokens » : il était violé partout.** Sorties vers
  des tokens : ombres (`shadowColors.neutral`/`.primary` — Card, Button, FAB),
  bannière d'alerte (`lightBanner`/`darkBanner` — 6 hex en dur dans `AlertBanner`),
  et surtout la famille **`onAccent`** (texte/décor posés sur un aplat ou dégradé de
  marque : `BalanceHeroCard`, `VoicePromoCard`, onboarding — une douzaine de
  `rgba(255,255,255,…)` en dur).
- Nommage : famille d'abord appelée `onGradient`, renommée **`onAccent`** — elle sert
  aussi sur des aplats (tuile d'onboarding), le premier nom aurait menti.
- Simplification : `categoryAccent(color?)` accepte désormais `undefined` et retombe
  sur `teal`. Les appelants faisaient `categoryAccent(c?.color ?? '#0D9488')`, un
  repli redondant puisque la fonction retombait déjà sur teal.
- Nouveau garde-fou `noHardcodedColors.test.ts` : un cas de test **par fichier** de
  `components/`, `screens/` et `navigation/` (54 fichiers), qui échoue sur tout hex
  ou `rgba(` hors commentaire. `src/theme` (les tokens eux-mêmes) et les modules qui
  stockent des couleurs comme **donnée** (palette de catégories, seeds) sont exclus.
  Vérifié par mutation.
- Nouveau `palette.test.ts` : les hex exacts de la maquette, la typo par script, et
  le fait que chaque thème (clair/sombre/senior/Ramadan) est une **surcharge** de
  tokens et non un jeu de valeurs parallèle.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **778/778, 89 suites** ✅.

### Itération 10 — Tâche 2.2 (Composants de base : Header, Bouton, Tag, Card) ✅
- Les 4 composants existaient et tiraient déjà tout des tokens (garanti par la garde
  de la 2.1). Le manque réel était la **couverture de tests** : `Card`, `Pill` (le
  « Tag » du design system) et `ScreenHeader` n'avaient **aucun test**, et `Button`
  ne testait que press/disabled — aucune variante, aucun thème.
- `Card.test.tsx` : rayon 14 px asséré contre la valeur littérale du design *et*
  contre le token (une seule source de vérité, changement délibéré) ; ombre douce
  quand `elevated` ; **absence** d'ombre en sombre (elle y lit comme de la crasse,
  la bordure sépare) ; 4 thèmes.
- `Pill.test.tsx` : label, icône optionnelle, ink par défaut pris du **schéma actif**
  et non figé, couleur sémantique passée par l'appelant, 4 thèmes.
- `ScreenHeader.test.tsx` : variantes titre et salutation, absence du bouton retour
  sans `onBack`, actions + texte court (pastille de langue), LTR/RTL, 4 thèmes.
- `Button.test.tsx` étendu : chaque variante assérée contre son token, repli sur le
  schéma sombre, cible tactile agrandie en mode senior, LTR/RTL du dégradé, 4 thèmes.
  Vérifié par mutation.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **823/823, 92 suites** ✅.

### Itération 11 — Tâche 2.3 (Composants financiers) ✅
Contrairement à la 2.2, il y avait **du vrai code à écrire** : 3 des 5 composants
demandés n'existaient pas.
- **`Amount`** (nouveau) : le composant « Montant » n'existait pas. Les écrans
  calculaient le signe à la main puis choisissaient `valueColor` eux-mêmes. Il gère
  signe, devise et locale via `formatMoney`, et les tons (`auto`/`neutral`/
  `positive`/`negative`). Choix : en `auto`, **seuls les revenus sont colorés** — un
  mur de rouge se lirait comme des erreurs, pas comme des dépenses normales.
- **`ProgressRing`** (nouveau) : l'« anneau » à valeur unique n'existait pas
  (`DonutBreakdown` est le frère multi-segments). Mirroité en RTL comme le donut.
- **`TransactionRow`** (nouveau) : composé à la main dans `HomeScreen`, avec une
  **date absolue** (`occurredAt.slice(0,10)`) alors que le critère exige une date
  **relative**. `HomeScreen` est branché dessus.
- **Seuil d'alerte** ajouté à `ProgressBar` et `ProgressRing` : l'appelant passait
  jusqu'ici un booléen `over` *et* la couleur. Le composant se colore désormais seul.
- **`formatRelativeDate`** (nouveau) : « aujourd'hui / hier / il y a 3 jours »,
  puis repli sur la date courte au-delà d'une semaine et pour toute date future.
  Compté en **jours calendaires** et non en heures écoulées — 23h hier est « hier ».
- ⚠️ Piège trouvé : `Intl.RelativeTimeFormat` **n'accepte pas** d'option
  `numberingSystem` ; sans l'extension de locale (`ar-MA-u-nu-arab`) l'arabe sort
  avec des chiffres **latins**. D'où `resolveIntlLocaleTag`.
- Piège de test : `react-native-svg` normalise `stroke` en objet couleur interne ;
  les assertions de couleur lisent les props **JSX** de l'arbre, pas le nœud rendu.
- Tests : `Amount` (14), `ProgressBar` (15), `ProgressRing` (13), `TransactionRow`
  (12), `Avatar` (9), date relative (8).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **902/902, 97 suites** ✅.

### Itération 12 — Tâche 2.4 (Contraste et mise à l'échelle des textes) ✅
Le test de contraste systématique (167 assertions : chaque token de texte × chaque
fond × 4 thèmes) a révélé **deux vrais défauts d'accessibilité livrés**, plus deux
de mes propres erreurs de la 2.1.

- 🐛 **`danger` en thème sombre échouait AA** : `#F43F5E` ne donne que **3.98:1** sur
  `surface`. Un montant négatif sur une carte sombre était sous le seuil. → `#FB7185`
  (rose-400), qui passe partout (5.44 / 4.80).
- 🐛 **Le dégradé `balance` échouait AA** : sur sa teinte claire `#0D9488`, le blanc
  **opaque** ne donne que 3.74:1. Le gros montant passe (texte large, seuil 3:1) mais
  le petit label « Solde du mois » non. → teinte assombrie à `#0F8377` (4.63:1).
- 🐛 **Mon commentaire de la 2.1 était faux** : j'y affirmais que « le blanc sur
  teal/purple passe AA à tous les niveaux d'alpha ». Calcul fait : **tous** les
  niveaux translucides échouaient (0.85 → 3.80:1 ; même sur la teinte la plus sombre
  du dégradé, 4.42). J'ai **supprimé les 4 tokens de texte translucides**
  (`textStrong`/`textMuted`/`textSubtle`/`textFaint`) : diminuer du petit texte par
  l'opacité est un anti-pattern d'accessibilité, et la hiérarchie de la maquette est
  déjà portée par la taille et la graisse. Il reste **un** blanc opaque pour le texte
  sur aplat ; les alphas ne servent plus qu'à la décoration (seuil 3:1).
- 🐛 **Mon `textTertiary` de la 2.1** (`#64748B`, valeur maquette) échouait sur
  `surfaceAlt` (4.23). Je l'avais documenté comme une contrainte d'usage — mais rien
  ne l'aurait fait respecter. Aligné sur la politique déjà établie dans le projet
  (« AA l'emporte sur le swatch ») : `#5F6F87`, la teinte passante la plus proche.
  Idem pour l'ink `gold` (`#B45309` → `#A9500A`, 4.46 → 4.86 sur `surfaceAlt`).
- Le test compose les couleurs translucides sur leur fond avant de mesurer — sans ça
  un blanc à 85% se noterait comme du blanc opaque et masquerait l'échec.
- Mise à l'échelle : garde statique (un cas par fichier) contre
  `allowFontScaling={false}` et `maxFontSizeMultiplier` — suivre le Dynamic Type se
  résume à **ne pas s'en désinscrire**. Plus : les composants à texte se dimensionnent
  en `minHeight` et jamais en `height` fixe.
- Couleur jamais seule : chaque cas assère le **porteur non-coloré** (signe du montant,
  glyphe d'alerte, état d'accessibilité de la puce), jamais la couleur.
- Vérifié par mutation : remettre `#F43F5E` ou le dégradé de la maquette fait bien
  échouer le test.
- ⚠️ **Effet visuel à valider** : la carte de solde change légèrement — teinte claire
  du dégradé un peu plus sombre, et labels en blanc opaque au lieu de 85%.
- 🔎 **Trouvé, non corrigé (hors critères 2.4)** : les boutons icône de `ScreenHeader`
  font 34×34 px et les chevrons de `MonthSelector` n'ont pas de taille explicite —
  sous le `minTouchTarget` de 44 px que le thème définit lui-même. Correction propre :
  `hitSlop` (garde le visuel de la maquette, agrandit la zone tactile).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1141/1141, 100 suites** ✅.

### Itération 13 — Tâche 2.5 (Libellés pour lecteurs d'écran) ✅ — phase 2 terminée
- 🐛 **`Icon` annonçait son nom brut** : `accessibilityLabel={name}` faisait lire
  « shopping-cart », **en anglais, dans les trois langues**, et par-dessus le libellé
  du bouton qui l'enveloppe déjà. L'icône est désormais **masquée par défaut**, avec
  un `accessibilityLabel` optionnel pour les glyphes qui portent du sens seuls.
- Glyphes porteurs de sens étiquetés : l'alerte de `CategoryBudgetRow` (elle
  **remplace** le texte du pourcentage, donc elle est le seul porteur de « dépassé »).
- Le point de notification est décoratif pour un lecteur d'écran : son sens est replié
  dans le libellé du bouton (« Notifications, notifications non lues »).
- `Amount` expose un libellé parlé **débarrassé des marques bidi** : la chaîne visible
  contient des U+200E invisibles pour l'ordre des chiffres — utiles à l'algorithme
  bidi, pas à une synthèse vocale.
- Décorations masquées : blob de la hero card, barre de progression nue, anneau du
  donut. ⚠️ J'ai d'abord masqué **tout le conteneur** de l'anneau — ce qui masquait
  aussi son chiffre central. Corrigé : seul le `<Svg>` est masqué.
- **`hitSlop` (approuvé par l'utilisateur, trouvé en 2.4)** : les boutons 34 px du
  header et les chevrons 17 px du `MonthSelector` étaient sous la cible tactile de
  44 px que le thème définit. `hitSlop` élargit la zone sans toucher au visuel.
- Effet de bord assumé : masquer les icônes de l'arbre d'accessibilité a cassé 40
  tests dans 8 suites, car **RNTL modélise cet arbre** et exclut les éléments masqués
  de ses requêtes. Les assertions concernées portent sur le **rendu** du glyphe : elles
  passent `{ includeHiddenElements: true }` explicitement. Cette même distinction sert
  d'assertion dans `screenReaderLabels.test.tsx` — « absent d'une requête normale mais
  présent avec le drapeau » **est** la preuve du masquage, pas un proxy.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1158/1158, 101 suites** ✅.

### Itération 14 — Tâche 3.2 (Barre de navigation principale) ✅ / 3.1 ⚠️ ouverte

- 🚨 **3.1 laissée `done: false`** : son critère exige « expo-router configuré avec un
  layout à onglets », or **expo-router n'est pas installé et ne l'a jamais été** —
  l'app utilise `@react-navigation/bottom-tabs` directement. `CLAUDE.md` annonce
  pourtant expo-router comme stack. Options présentées (garder React Navigation et
  corriger le critère / migrer / reporter) → **choix : reporter**, rien n'est tranché
  à la place de l'utilisateur. À noter : expo-router est une couche de routage **par
  fichiers construite au-dessus de React Navigation** ; pour l'utilisateur final le
  shell à onglets est identique. La migration toucherait le point d'entrée,
  l'assemblage des providers et toutes les suites montant `NavigationContainer`.
- ✅ **3.2 : du vrai code manquait.** Les 4 onglets étaient codés en dur dans
  `RootNavigator`.
  - **Onglet selon le marché** (nouveau) : `src/market/marketTabs.ts` décide de la
    composition de la barre. Les marchés à tontine (MA, DZ, TN, EG, SN, CI, CM, ML)
    gardent Tontine ; les marchés diaspora (FR, ES, BE…) reçoivent **Transferts** à la
    même place. Listé **par pays** et non déduit de la langue ou de la devise : le
    français est parlé des deux côtés de ce partage, et l'euro couvre les deux cas.
  - **Mode senior** (nouveau) : la barre tombe à Accueil + Profil. Rien n'est caché —
    le bouton d'ajout central et tous les écrans restent joignables depuis le
    dashboard ; quatre petites cibles alignées sont précisément ce que le mode senior
    existe pour éviter.
  - **Cibles tactiles** : les onglets n'avaient **aucune hauteur minimale**. Elles
    suivent maintenant `theme.minTouchTarget` — 44 pt, 56 en senior, comme l'exige la
    règle métier du critère.
  - `TransfersScreen` : placeholder tenant le créneau jusqu'à la phase 11.
  - `App.tsx` conserve désormais le `countryCode` des réglages (il les chargeait déjà
    sans les garder) et le passe au navigateur.
- Piège de test : `getAllByRole('button')` ramasse aussi les boutons de l'écran affiché
  sous la barre (header, sélecteur de mois). Les assertions sont cadrées sur la barre
  via `within(getByTestId('tab-bar'))`.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1189/1189, 103 suites** ✅.

### Itération 15 — Tâche 4.1 (Écran de bienvenue) ✅
- L'onboarding fusionnait bienvenue + langue + pays sur **un seul écran**, alors que la
  phase 4 en décrit une séquence. Nouveau `WelcomeScreen` (marque, nom, pitch, badge
  « Aucune connexion bancaire ») + `OnboardingFlow` qui séquence les étapes.
- Le badge **ne peut pas** passer sous la ligne de flottaison : l'écran n'est
  volontairement **pas** un `ScrollView`, et un test l'assère. C'est la promesse sur
  laquelle l'utilisateur décide de confier le budget familial à l'app.
- `OnboardingFlow` est un simple état local, pas un navigateur : la séquence est
  linéaire, courte et hors du shell à onglets — une pile n'apporterait qu'un second
  conteneur de navigation.
- ⚠️ **`SignInScreen` est une coquille assumée** : le critère 4.1 exige d'être « dirigé
  vers la connexion », mais se connecter n'a de sens qu'une fois qu'il existe une
  sauvegarde à restaurer — c'est US-071a/b, **phase 17**. L'écran le dit franchement
  plutôt que d'afficher des champs d'identifiants qui ne mèneraient nulle part. US-006
  (4.6) le remplira.
- 🐛 **Flake corrigé** : `VaultDetail › recalculates after deleting` échouait **seulement
  en suite complète**. Cause : `fireEvent.press` attend la dispatch, pas la chaîne async
  du handler (delete → reload → setState) ; le `waitFor` que j'avais écrit à
  l'itération 8 courait après avec le défaut d'1 s — suffisant à vide, trop juste en
  parallèle. Timeout explicite + commentaire. 3 runs complets verts d'affilée.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1214/1214, 105 suites** ✅.

### Itération 16 — Tâche 4.2 (Choix de la langue à l'onboarding) ✅
- 🐛 **L'anglais était absent du sélecteur** : `OnboardingLanguageCountryScreen`
  listait `fr` et `ar` en dur, alors que le catalogue `en` est complet et que
  l'anglais est une langue v1. Un utilisateur sur téléphone anglophone voyait
  l'app en anglais sans pouvoir le choisir.
- 🐛 **Bien pire dans `ProfileScreen`** : la bascule faisait
  `language === 'fr' ? 'ar' : 'fr'`. Depuis l'anglais elle envoyait vers le
  français, et **l'anglais devenait définitivement inatteignable**. Combiné à la
  détection de locale, un anglophone qui touchait la ligne une fois perdait sa langue
  pour de bon. La ligne **cycle** désormais sur les trois (`nextLanguage`, qui boucle).
- 🐛 `ProfileScreen` affichait aussi « العربية » comme nom de langue à un anglophone
  (le repli du ternaire). Corrigé via `languageOption`.
- Les deux écrans dupliquaient la liste des langues, tous deux en oubliant l'anglais →
  `src/i18n/languageOptions.ts`, **dérivé de `SUPPORTED_LANGUAGES`** : ajouter une
  langue est maintenant une seule édition.
- Noms **natifs et traduits** : le natif (« العربية ») est ce qu'un locuteur cherche
  dans une liste ; le traduit (« Arabe ») la rend lisible à qui ne déchiffre pas le
  script. Les noms natifs sont identiques dans les 3 catalogues — c'est leur définition,
  et un test le fige.
- Mention des packs à venir (Darija, Tamazight, Türkçe), non sélectionnable.
- ⚠️ **Test corrigé, pas le code** : mon test exigeait « Darija » en toutes lettres
  latines dans le catalogue **arabe**. Un lecteur arabe attend « الدارجة » — c'était
  le test qui figeait de la mauvaise i18n. Chaque catalogue est vérifié dans son script.
- 🐛 **Pollution d'état entre tests** exposée par le cycle : `i18n` est un singleton
  global ; le test RTL d'`App` le laissait désormais en anglais et décidait de la copie
  vue par le test suivant. `afterEach` remet le français.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1234/1234, 107 suites** ✅
  (2 runs complets).

### Itération 17 — Tâche 4.3 (Choix du pays / marché et devise) ✅
- ⚠️ **Conflit avec ma propre 3.2** : la règle métier de US-003 dit « Maroc/DZ/TN →
  tontine ; France/US → remittances ; **Golfe → les deux** ». Mon modèle de la 3.2
  faisait tontine **ou** transferts, sans exprimer le cas « les deux ». Remplacé par
  un vrai registre `src/market/markets.ts` (pays → devise + modules), dont
  `resolveTabs` **dérive** désormais. La barre garde une seule case pour un module
  local : un marché du Golfe y met **Tontine** (rituel hebdomadaire) et garde le
  module Transferts actif ailleurs — un 5e onglet rétrécirait toutes les cibles, à
  rebours de la règle des 44 pt de US-013 elle-même.
- 🐛 **Le bouton « Continuer » n'était jamais désactivé** : le pays était pré-sélectionné
  sur le Maroc. Le critère exige un choix explicite — le pays décide de la devise et
  des modules, le laisser implicite serait le supposer. Il démarre vide.
- **Duplication supprimée** : `src/onboarding/countries.ts` et le registre de marchés
  décrivaient tous deux les pays. L'ancien est supprimé, le registre est la seule source.
- Marchés annoncés (DZD, TND, EGP, EUR, AED, SAR) mentionnés sans être sélectionnables,
  comme les packs de langues de la 4.2. Le MVP reste Maroc seul (PRD §4).
- ⚠️ **J'ai retiré des marchés que j'avais inventés en 3.2** (SN, CI, CM, ML) : absents
  du PRD, ils revendiquaient une devise (XOF) que le produit n'a jamais spécifiée. Le
  registre ne couvre que les 7 marchés nommés par le PRD. Un marché non profilé retombe
  sur `transfers` : afficher une tontine à un foyer qui n'en pratique pas est pire que
  de l'omettre.
- Effet de bord assumé : la fin de la pré-sélection a cassé tous les tests qui
  traversaient l'onboarding — ils choisissent maintenant le marché, comme un vrai
  utilisateur. Doublon de test supprimé au passage (le seeding est déjà couvert, et par
  nom de catégorie, dans la suite US-023).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1263/1263, 109 suites** ✅
  (2 runs complets).

### Itération 18 — Tâche 4.4 (Écran de confidentialité) ✅
- Migration **0016** : `privacy_accepted_at` sur `user_settings` — exactement l'`ALTER
  TABLE` que la note de la migration 0014 avait anticipé. **Nullable à dessein** : un
  foyer ayant fait l'étape langue/pays avant cette colonne n'a aucune acceptation à
  rétro-remplir, et en inventer une reviendrait à fabriquer le consentement même que la
  colonne enregistre.
- `acceptPrivacy` **conserve la première acceptation** plutôt que de l'écraser : la date
  qui compte est la première, et repasser sur l'écran ne doit pas réécrire l'histoire.
  `saveLanguageCountry` ne l'efface jamais non plus.
- **Le dashboard est désormais gardé** : `App.tsx` traitait « pas de ligne » comme
  « onboarding à faire ». Une ligne **sans acceptation** (flux interrompu) renvoie
  maintenant aussi vers l'onboarding — la promesse ne doit pas être sautée en silence.
- L'étape confidentialité vient **après** langue/pays : les engagements méritent d'être
  lus dans sa propre langue, et c'est cette étape qui crée la ligne sur laquelle
  l'horodatage s'écrit.
- **La politique complète vit dans l'app**, pas derrière une URL : toute la promesse du
  produit est que rien ne quitte l'appareil ; renvoyer vers une page web pour lire ça
  serait une petite contradiction, et exigerait l'appel réseau que l'app refuse. Son
  texte décrit ce que le code fait réellement — vérifiable, la garde de la 1.7 échouant
  si un fichier source appelle `fetch`.
- 🚩 **À faire valider** : ce texte n'est **pas** un document juridique relu. Si une
  politique formelle est requise (stores, RGPD), elle doit remplacer ce contenu.
- 🐛 Trouvé au passage : la fausse base rendait `undefined` là où SQLite rend `null`,
  car mon `INSERT` n'écrivait pas la nouvelle colonne. Corrigé des deux côtés.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1289/1289, 110 suites** ✅
  (2 runs complets).

### Itération 19 — Tâche 4.5 (Création du foyer) ✅
- 🐛 **Le dashboard confondait membre et foyer** : `householdName = members[0]?.name`,
  donc l'en-tête affichait « Bonjour / Moi ». Ce sont deux choses différentes — la
  personne saluée et le nom du budget familial. L'en-tête affiche désormais
  « Bonjour, {prénom} » avec le foyer en dessous, comme l'exige le critère.
- **Rôle `admin` ajouté** (`MemberRole`) : `role` est une colonne TEXT sans contrainte
  CHECK, donc aucune migration nécessaire. `canEdit`/`isAdmin` nomment la règle en un
  seul endroit — non appliquée aujourd'hui (elle n'a de sens qu'avec le compte partagé
  d'US-039/040), mais la donnée est correcte dès maintenant.
- **`setupHousehold` renomme le membre semé au lieu d'en ajouter un second** :
  `ensureAppReady` crée un « Moi » de remplacement à l'étape langue/pays pour que le
  sélecteur de membre ne soit jamais vide ; le laisser aurait donné deux membres à un
  foyer d'une personne dès la première minute. Idempotent : un onboarding interrompu se
  rejoue sans empiler de doublons.
- Le foyer hérite de la **devise du marché choisi** — l'étape langue/pays remonte
  désormais le marché retenu au flux.
- **Garde étendue** : plus de foyer = onboarding, même logique que l'acceptation de
  confidentialité en 4.4. Un dashboard sans famille à nommer n'a pas de sens.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1322/1322, 112 suites** ✅
  (2 runs complets).

### Itération 20 — Tâche 4.6 (Connexion à un compte existant) 🚨 laissée `done: false`

**Bloquée par des dépendances qui vivent trois phases plus loin.** Sur ses 3 critères
fonctionnels, seul le premier est faisable :

- ✅ « quand je tape "J'ai déjà un compte", l'écran de connexion s'affiche » — livré en
  4.1, et l'écran dit franchement qu'il n'y a rien à restaurer.
- 🚨 « identifiants valides + **sauvegarde chiffrée existante** → données restaurées sur
  le nouvel appareil » — exige :
  1. un **système de comptes**, qui n'existe nulle part dans le code ;
  2. l'**infrastructure de sauvegarde chiffrée**, spécifiée par **US-071a/b (phase 17)** ;
  3. la décision de **chiffrement au repos** de la **1.7**, toujours ouverte ;
  4. une **couche réseau**, que la garde statique de la 1.7 interdit aujourd'hui à dessein.
- 🚨 « identifiants invalides → message d'erreur explicite » — sans notion d'identifiant
  valide, il n'y a rien à invalider.

**Pourquoi ne pas la bricoler** : un écran de connexion factice qui prétend authentifier
serait exactement la fabrication que les garde-fous interdisent, et exigerait un backend
codé en dur. Le PRD ordonne 4.6 avant la phase 17 dont elle dépend — c'est un **problème
d'ordonnancement du PRD**, pas un manque de travail.

**À faire quand la phase 17 arrivera** : reprendre 4.6 juste après 17.2/17.3, et
**assouplir la garde réseau** (`src/db/__tests__/offlineStorage.test.ts`) pour le seul
module de sauvegarde — elle protège le garde-fou « aucune connexion bancaire », pas une
interdiction éternelle du réseau.

### Itération 21 — Tâche 5.1 (Hero solde du mois) ✅
- 🐛 **La devise du foyer était ignorée** : le dashboard interpolait
  `DEFAULT_CURRENCY_CODE` (MAD) partout. Un foyer en France aurait vu son budget en
  dirhams. Il lit désormais `households[0].currencyCode`.
- ⚠️ **Le critère « solde négatif → couleur d'alerte (coral) » ne peut pas être pris au
  pied de la lettre** : du texte coral sur le dégradé teal donne **1.49:1** — invisible.
  Même la rose la plus pâle n'atteint que 3.88. C'est donc **la carte** qui passe en
  alerte : nouveau dégradé `negative` (`#BE123C → #E11D48`) sur lequel le blanc reste
  lisible (6.29 / 4.70). Le test de contraste de la 2.4 a validé le nouveau dégradé
  **tout seul** — il itère sur l'ensemble des dégradés.
- Piège de test évité : `/5.000/` matchait **à la fois** le solde et le total des
  revenus — le `.` de regex, exactement le piège trouvé en 1.6. Les assertions sont
  cadrées sur la carte (`within(getByTestId('balance-hero'))`) et comparent des chaînes
  exactes.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1332/1332, 113 suites** ✅.

### Itération 22 — Tâche 5.2 (Sélecteur de mois) ✅
- 🐛 **La navigation future n'était pas bloquée** : `stepMonth` était sans borne, on
  pouvait marcher indéfiniment dans des mois vides. Le mois courant est désormais le
  plafond, et le chevron « suivant » y est **désactivé** — dimé *et* signalé comme tel
  aux lecteurs d'écran, plutôt que pressable en apparence et silencieux à l'usage.
- 🐛 **La liste des transactions n'était pas scopée au mois** : elle affichait les 5
  dernières opérations *toutes périodes confondues*, donc consulter juin listait celles
  de juillet.
- ⚠️ **Conflit d'intention assumé** : un test existant assérait explicitement l'inverse
  (« Historique conservé : le mois dernier est encore listé »). Lecture plausible, mais
  le critère US-008 est explicite — « solde, catégories, **transactions** et objectifs
  reflètent ce mois » — et un sélecteur de mois qui laisse la liste non scopée est
  déroutant. L'historique complet vivra derrière « Voir tout » (US-012, tâche 5.4).
- **Objectifs scopés au mois** : un objectif étant cumulatif, un mois passé montre ce
  qui était épargné **à sa fin** — pas les seuls versements de ce mois-là, qui se
  liraient comme un objectif ayant perdu sa progression.
- Deux tests dataient leurs opérations en janvier 2026, un mois passé : ils devenaient
  invisibles une fois la liste scopée. Recalés sur le mois courant, intention préservée.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1345/1345, 114 suites** ✅
  (2 runs).

### Itération 23 — Tâche 5.3 (Anneau de répartition) ✅
- **Agrégation « Autres » (nouveau)** : au-delà de 4 catégories, `rankCategories` garde
  les 4 premières et **somme** la queue plutôt que de la jeter — un anneau dont les
  parts ne font pas le tout serait pire que pas d'anneau. Le libellé est passé par
  l'appelant : ce module n'a pas à connaître la langue active.
- **Légende tappable (nouveau)** : c'est **la légende** qui est la surface tactile, pas
  l'arc — une tranche d'anneau de 19 px de large n'est pas une cible atteignable, et la
  ligne d'à côté dit la même chose avec un nom dessus. Cible de 44 pt.
- « Autres » est **inerte** : elle représente plusieurs catégories, il n'y a pas un
  détail unique à ouvrir.
- ⚠️ **Approximation assumée** : l'écran de détail d'une catégorie n'existe pas encore
  (phase 7). Le tap ouvre l'onglet Catégories, là où ce détail vivra.
- **Convention respectée** : j'avais d'abord utilisé `useNavigation`, ce qui a cassé 31
  tests — les tests d'écran ne montent pas de `NavigationContainer`, et **tous les autres
  écrans du projet reçoivent des callbacks** plutôt que de connaître la navigation.
  `HomeScreen` prend désormais `navigation` en prop optionnelle, comme React Navigation
  la fournit déjà aux écrans d'onglets.
- Pièges de test rencontrés : le nom de catégorie apparaissait **deux fois** (légende +
  ligne de transaction, qui retombe sur le nom sans note) ; et mon jeu de données faisait
  collider le total « Autres » (300) avec celui de Santé (300).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1363/1363, 116 suites** ✅
  (2 runs).

### Itération 24 — Tâche 5.4 (Dernières transactions) ✅
- **Écran d'historique filtrable (nouveau)** : « Voir tout » ne menait nulle part.
  `TransactionHistoryScreen` liste **tous les mois** — délibérément *non* scopé, à
  l'inverse du dashboard : c'est précisément l'historique que le sélecteur de mois cache
  (cf. le conflit tranché en 5.2), le scoper laisserait l'app sans aucun endroit où tout
  voir. Filtres type / catégorie / membre, combinés en **ET** — « combien Youssef a-t-il
  dépensé en courses » est une conjonction, pas une disjonction.
- 🐛 **La liste affichait 5 lignes**, le critère en demande **4**. Un test figeait le 5.
- 🐛 **Les revenus n'avaient aucun signe** : le critère exige « préfixé d'un plus ».
  Un test existant assérait explicitement l'inverse (« income (no sign) »). Le `+` est
  aussi ce qui fait que la distinction ne repose pas seulement sur la couleur — le
  garde-fou de la 2.4.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1387/1387, 118 suites** ✅
  (2 runs).

### Itération 25 — Tâche 5.5 (État vide du dashboard) ✅
- **Tiret au lieu de zéro** : le hero affichait `0` sur un mois sans aucune opération.
  Distinction qui compte — **un zéro est un fait sur le mois** (revenus et dépenses
  s'annulent), **un tiret veut dire qu'il n'y a rien à additionner**. Les confondre
  dirait à un foyer à l'équilibre qu'il n'a rien saisi. Testé dans les deux sens.
- **Deux actions** (Dépense / Vocal) au lieu d'une, avec le nouveau message du critère.
- **État vide lié au foyer, pas au mois** : l'invitation ne revient pas en consultant un
  mois vide d'un foyer qui a de l'historique — « ajoute ta première opération » y serait
  faux. Un `monthEmpty` neutre prend le relais.
- ⚠️ **Lecture assumée de « disparaît définitivement »** : compris comme « elle s'en va
  **parce qu'il y a des données** », pas comme un drapeau à sens unique. Un foyer qui
  supprime tout se retrouve devant une app vide, et l'invitation y redevient utile ;
  persister un bit « a déjà saisi » pour la lui refuser serait pire, pas plus fidèle.
  Un test épingle cette lecture pour que le prochain lecteur sache que c'est une décision.
- ⚠️ La saisie vocale n'existe pas encore (phase 6) : les deux routes ouvrent la même
  feuille, plutôt qu'un bouton qui ferait semblant d'écouter.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1398/1398, 119 suites** ✅
  (2 runs).

### Itération 26 — Tâche 5.6 (Chip de confiance) ✅
- Le composant existait ; le **texte ne correspondait pas** à celui que le critère cite.
  Aligné dans les 3 catalogues (« On ne se connecte pas à ta banque · saisie manuelle »),
  ce qui suit aussi le tutoiement déjà adopté par la copie de la 5.5.
- **Lisibilité vérifiée sur les 4 thèmes**, Ramadan compris : le chip **peint son propre
  fond opaque**, donc la page derrière ne décide jamais du contraste de son texte —
  c'est ce qui le rend lisible sur la surface chaude du Ramadan. Vérifié par le calcul
  (4.86 en clair, 6.41 en sombre) *et* par un test qui assère que le fond vient bien du
  token et non de la page.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1410/1410, 120 suites** ✅.

### Itération 27 — Tâche 5.7 (Aperçu des objectifs) ✅
- 🐛 **Le dashboard affichait tous les coffres**, le critère en demande **2**.
- 🐛 **« Voir tout » ne menait nulle part** ; il ouvre `VaultsScreen`, qui existait déjà
  mais n'était atteignable que depuis le Profil.
- 🐛 **La section disparaissait entièrement sans objectif** : un foyer qui n'a jamais
  épargné n'avait donc **aucun moyen de découvrir la fonction**. La section reste, avec
  une invitation à créer un premier objectif.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1418/1418, 121 suites** ✅.

### Itération 28 — Tâche 5.8 (Bandeau de découverte vocale) ✅ — phase 5 terminée
- 🐛 **Le bandeau s'affichait en permanence** : aucune des deux règles de retrait
  n'existait, et **il n'y avait même pas de bouton de fermeture** alors que le critère
  parle de « fermer le bandeau ».
- Migration **0017** : `voice_entry_count` et `voice_promo_dismissed` sur `user_settings`.
  **Deux colonnes distinctes à dessein** : « je connais et je n'en veux pas » n'est pas
  « je m'en sers ». Les fusionner ferait passer un refus pour un usage que le foyer n'a
  jamais eu — un test l'épingle.
- `shouldShowVoicePromo` est une règle pure et testée : retrait au 3e usage, ou sur refus
  quel que soit le compteur.
- ⚠️ **`recordVoiceEntry` n'a pas encore d'appelant** : la saisie vocale arrive en phase 6.
  La règle et son stockage sont livrés et testés ; la phase 6 branchera l'incrément. Le
  tap du bandeau ouvre la feuille clavier en attendant, plutôt qu'un écran qui ferait
  semblant d'écouter.
- 🐛 Trouvé au passage : le moteur de la fausse base ne parse pas un littéral dans un
  `UPDATE ... SET col = 1` — la valeur doit être paramétrée. Mon test l'a attrapé.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1445/1445, 123 suites** ✅.

### Itération 29 — Tâche 6.1 (Saisie au pavé numérique) ✅
- **`NumericKeypad` (nouveau)** : le formulaire s'appuyait sur le clavier natif, le critère
  demande un **pavé custom**. Il l'est pour une raison concrète : le pavé décimal de l'OS
  varie selon la plateforme et la locale, **y compris le séparateur décimal qu'il propose** —
  c'est ainsi que « 42,50 » devient improbable à parser sur un appareil et correct sur un autre.
- **Décimales par devise** : une devise sans décimale (JPY) n'a **aucune touche décimale**,
  plutôt qu'une touche qui ne ferait rien. Une saisie qui dépasserait les décimales de la
  devise est **refusée, pas tronquée** : couper un chiffre que l'utilisateur vient de taper
  ferait diverger le montant affiché de ce qu'il a pressé — c'est ainsi qu'un mauvais
  montant se sauvegarde.
- 🐛 **La devise du foyer était encore ignorée ici** : `DEFAULT_CURRENCY_CODE` codé en dur
  dans le formulaire, y compris à l'enregistrement. Une opération éditée garde en revanche
  la devise dans laquelle elle a été saisie.
- 🐛 **Le bouton Enregistrer n'était pas désactivé à zéro** : il affichait une erreur après
  la pression. La réponse à « puis-je enregistrer ceci ? » est connue **avant** que
  l'utilisateur ne demande. Un test figeait l'ancien comportement.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1484/1484, 125 suites** ✅ (2 runs).

### Itération 30 — 🐛 `Intl` manquant sur Hermes (correctif, hors tâche) ✅
- **Le symptôme** : tout écran affichant une `TransactionRow` **crashait sur appareil**
  (`TypeError: Cannot read property 'prototype' of undefined`), la suite restant verte.
  Hermes ne fournit qu'un sous-ensemble d'`Intl` : `NumberFormat` et `DateTimeFormat` sont
  natifs, mais `RelativeTimeFormat`, `PluralRules`, `Locale` et `getCanonicalLocales` **non**.
  `formatRelativeDate` appelait le premier ; `i18next.init` résout ses pluriels via le second.
- **`intlPolyfills.ts` (nouveau)** : polyfills `@formatjs`, importés en tête de `i18n.ts` car
  `i18next.init` touche `Intl.PluralRules` dès son exécution. L'ordre d'import suit la chaîne
  de dépendances et est porteur. Seules les données CLDR des trois langues sont chargées —
  le jeu complet pèse des mégaoctets.
- **Pourquoi aucun test ne pouvait l'attraper** : Jest tourne sur Node, qui a l'ICU complet.
  C'est précisément l'asymétrie qui a laissé passer le bug. La vérification honnête est donc
  le bundle réel : `npx expo export --platform ios` compile en bytecode Hermes (5,66 Mo) et
  les données des polyfills y sont bien présentes, arabe compris (stocké en UTF-16 par Hermes).
- 🐛 **Trouvé au passage — les chiffres arabes divergeaient entre moteurs** : le polyfill
  CLDR résout toujours `nu` vers `latn`, quels que soient le tag de locale ou l'option
  `numberingSystem`. « قبل ٣ أيام » sous Node devenait « قبل 3 أيام » sur Hermes. Le compte
  passe maintenant par `toLocalizedDigits` et est réinjecté dans les parts formatées, ce qui
  met les deux moteurs d'accord. `resolveIntlLocaleTag`, dont c'était l'unique raison d'être,
  est supprimé.
- **Compromis assumé** : un mock Jest neutralise `intlPolyfills.ts` sous test — les bundles
  `@formatjs` publiés utilisent des blocs statiques de classe que le Babel de ce projet ne
  transforme pas pour Jest (Metro, si). Le module n'est donc pas exercé par la suite ;
  `typecheck` valide ses imports et l'export réel prouve son chargement.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1486/1486, 125 suites** ✅.

### Itération 31 — Tâche 6.2 (Sélection de catégorie par chips) ✅
- Le code de cette tâche existait déjà dans l'arbre (chips `CategoryChipV` triées par
  `rankCategoriesByFrequency`, sélection unique, action « Plus »), livré et testé dans le
  commit précédent mais **jamais marqué `done` ni journalisé** — écart de process plutôt
  que de code. Les 4 critères fonctionnels d'US-017 sont couverts par
  `AddExpenseForm.test.tsx` (« chips de catégories (US-017) ») : ordre par usage sur 30
  jours, sélection exclusive, apparition de « Plus » seulement si la liste rapide ne
  contient pas déjà tout, et retour à la bande une fois un choix fait dans la liste
  complète.
- 🧹 Nettoyage au passage : un fichier `.swp` (résidu d'édition Vim) avait été committé
  par erreur dans `src/components/` — supprimé, et `*.swp`/`*.swo`/`*.swn` ajoutés au
  `.gitignore` pour empêcher la récidive.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1502/1502, 126 suites** ✅.

### Itération 32 — Tâche 6.3 (Capture audio et état d'écoute) ✅
- **Aucune infrastructure micro/voix n'existait** avant cette tâche : la bannière de découverte
  (5.8) et le bouton « Vocal » du dashboard n'ouvraient que le clavier en attendant. Ajoute
  `expo-speech-recognition` (reconnaissance **sur l'appareil**, aucune clé API cloud, donc rien à
  mettre en variable d'environnement ni de garde-fou à contourner) avec son plugin de config
  (`app.json`) et les libellés `NSMicrophoneUsageDescription` / `NSSpeechRecognitionUsageDescription`.
- **`src/voice/speechRecognitionClient.ts`** : interface étroite sur le module natif, même schéma
  que `notificationClient`/`biometricClient` — jamais appelé directement par un écran ni par un
  test, pour que le module natif (absent sous Jest et dans ce bac à sable) ne soit jamais requis
  réellement en dehors d'un build. Mock global (`jest/speechRecognitionMock.js`, même principe que
  `intlPolyfillsMock.js`) en filet de sécurité si un import transite par erreur.
- **`markMicPermissionExplainerSeen`** (migration 0018) : l'explication contextuelle du micro
  (critère US-020a) est marquée vue **dès qu'elle s'affiche**, pas seulement si l'utilisateur
  appuie sur Continuer — sinon « Pas maintenant » la ferait revenir à chaque tap, ce qui n'est plus
  « au premier usage ».
- **`createSilenceWatcher`** : minuteur ré-armable pur, testé isolément (fenêtre glissante de 5s,
  pas 5s depuis le début de l'écoute) puis vérifié à nouveau *câblé* dans `VoiceEntrySheet` sans
  dépendre de faux timers React (le mock intercepte directement le callback passé au watcher).
- **`VoiceWaveform`** : hauteur des barres dérivée uniquement du prop `level`, sans bibliothèque
  d'animation ni état interne — testable par assertion directe plutôt qu'en course contre une
  animation.
- 🐛 **`voice` était déjà un flag d'entitlement (5.8) mais réglé à `true` sur les deux plans** :
  la tâche est marquée `"plan": "pro"`, donc `FREE_PLAN.voice` passe à `false`. La bannière et le
  bouton du dashboard restent visibles pour tous (ce sont des incitations à la découverte) ; c'est
  `VoiceEntrySheet` qui tranche à l'ouverture — upsell Pro pour un foyer gratuit, capture réelle
  sinon. Casse deux tests existants qui supposaient un tap ouvrant directement le clavier ;
  corrigés pour refléter le nouveau comportement (upsell sur le plan gratuit, capture sur Pro).
- **Langue de dictée** : réutilise `resolveIntlLocale` (déjà utilisé pour `Intl.NumberFormat`)
  plutôt qu'une seconde table `ar`/`fr`/`en` → BCP-47, pour ne pas pouvoir diverger de celle des
  montants/dates.
- ⚠️ **Vérification navigateur/appareil non effectuée** (limitation connue de cet environnement) —
  mais `npx expo export --platform web` a été lancé pour vérifier que le nouveau module natif se
  bundle réellement sans casser Metro (2589 modules, aucune erreur), ce qu'aucun test Jest ne peut
  prouver puisque le module natif y est justement mocké.
- **Portée délibérément limitée** : ce que dit la dictée (transcription affichée, montant extrait)
  est hors périmètre de 6.3 — le flux s'arrête proprement (ferme la feuille) dès que le
  reconnaisseur rend un résultat final ; 6.4/6.5 brancheront le traitement du contenu.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1544/1544, 130 suites** ✅. Bundle web
  vérifié via `npx expo export --platform web`.

### Itération 33 — Tâche 6.4 (Transcription vocale multilingue) ✅
- Trois critères sur quatre étaient déjà couverts par la 6.3 (langue alignée sur l'app + bascule
  manuelle, message d'erreur clair + repli clavier) : cette tâche ajoute l'affichage de la
  transcription **en direct** et prouve par un test qu'aucun fichier audio n'est conservé.
- **Transcription live** : `VoiceEntrySheet` s'abonne à l'évènement `result` du reconnaisseur et
  affiche `results[0].transcript`, remplacé au fil des résultats intermédiaires
  (`interimResults: true` déjà activé côté client depuis la 6.3) plutôt que d'attendre un résultat
  final — c'est ce que « pendant l'analyse » demande. Réinitialisée à chaque redémarrage de
  capture (changement de langue), pour ne pas laisser un fragment de l'ancienne langue affiché
  sous la nouvelle écoute.
- **`speechRecognitionClient.test.ts` (nouveau)** : jusqu'ici seul le wrapper natif n'avait pas de
  test dédié (mocké dans tous les autres). Le test qui compte pour US-020b/US-021a assère que
  `start()` n'envoie **jamais** `recordingOptions` au module natif — c'est cette absence, pas une
  suppression après coup, qui garantit qu'aucun fichier n'est écrit sur le disque de l'appareil.
  Une suppression après capture serait une promesse plus faible (une fenêtre where le fichier a
  existé) que ne jamais l'écrire.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1553/1553, 131 suites** ✅.

### Itération 34 — Tâche 6.5 (Extraction du montant depuis la dictée) ✅
- **`src/voice/numberWords/{fr,en,ar}.ts` + `extractAmountFromDictation.ts`** : un petit moteur
  partagé (fusion des composés multiplicatifs type « quatre-vingt » = 4×20, classification
  token par token, somme/multiplication additive) piloté par un lexique par langue plutôt que
  trois implémentations séparées. Portée assumée et documentée dans le code : couvre 0-999 999 et
  une décimale (centimes), pas une grammaire complète — le commentaire de `ar.ts` explique
  précisément ce qui est **volontairement** hors périmètre (accord de genre, formes figées des
  centaines) plutôt que de le passer sous silence.
- 🐛 **Piège classique évité, pas rencontré en prod** : les lexiques utilisaient `token in
  lexicon.words` pour la recherche — remplacé par `Object.prototype.hasOwnProperty.call(...)`
  avant que ça ne devienne un bug, car `in` remonte la chaîne de prototypes (`"toString" in {}` →
  `true`).
- **Un mot-clé numérique par test, pas un `it.each` fourre-tout** : la 30-aine de cas
  (dizaines irrégulières françaises, formes composées arabes du type أحد عشر, décimales,
  repli sur un chiffre littéral déjà transcrit) restent des tests séparés et nommés — plus lisible
  quand l'un d'eux casse.
- **Le montant extrait devient enfin utile** : jusqu'ici (6.3/6.4) la capture vocale se contentait
  de fermer la feuille à la fin de l'écoute, l'extraction n'avait aucun appelant. `VoiceEntrySheet`
  bascule maintenant vers `AddExpenseForm` en pré-remplissant `amountInput` (si un montant a été
  détecté) et `note` (toujours, avec la dictée brute) — `AddExpenseForm` gagne un prop `prefill`
  pour une nouvelle opération (distinct de `transaction`, qui reste réservé à l'édition).
  L'attribution de catégorie/membre reste manuelle : la déduction automatique est la 6.6, pas
  celle-ci.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1592/1592, 132 suites** ✅.

### Itération 35 — Tâche 6.6 (Déduction catégorie/libellé et confirmation) ✅
- **Écart assumé avec le libellé du critère** : le critère cite « catégorie Repas », mais les
  catégories par défaut de ce projet (2.x, déjà livrées et testées) s'appellent « Restaurants »,
  pas « Repas ». Le rapprochement se fait par **icône** de catégorie (`utensils`), pas par nom —
  ce qui est plus robuste (fonctionne quel que soit le nom que le foyer a donné/gardé à sa
  catégorie) — donc « Repas » dans le critère est lu comme illustratif du *type* de catégorie
  attendu, pas comme une exigence de renommer la catégorie existante. Documenté ici plutôt que
  laissé implicite.
- **`src/voice/dictationKeywords/{fr,en,ar}.ts` + `deduceCategoryAndLabel.ts`** : même schéma que
  l'extraction de montant (6.5) — un lexique borné et assumé comme tel par langue (`{keyword,
  label, categoryIcon}`), pas un dictionnaire exhaustif. Le montant, le nom de la devise et les
  mots de temps (« ce matin ») n'ont besoin d'aucun traitement particulier pour être ignorés :
  n'étant pas des mots-clés reconnus, ils ne sont simplement jamais candidats.
- **Nouvel étage `review` dans `VoiceEntrySheet`** : quand l'écoute se termine avec un montant,
  au lieu de basculer directement vers le clavier (6.5), le foyer voit maintenant la proposition
  (montant, libellé, catégorie suggérée avec la mention « Détecté automatiquement ») avant
  d'enregistrer. La catégorie reste modifiable (n'importe quel autre chip) — la sélectionner à la
  main retire la mention, puisque ce n'est plus une détection. Sans montant, le comportement de la
  6.5 (bascule directe clavier) est inchangé.
- **Confirmer enregistre directement** (pas de passage par `AddExpenseForm`) ; **Annuler** repasse
  par `onCaptured` — même chemin que « aucun montant détecté » de la 6.5, avec en prime la
  catégorie choisie transmise au clavier pour ne pas la faire re-choisir. `AddExpenseForm` gagne
  donc un `prefill.categoryId` en plus de `amountInput`/`note`.
- **Pas de sélecteur de membre sur cet écran, volontairement** : le premier membre du foyer est
  utilisé par défaut. L'attribution explicite à un membre est la 6.10 (US-018), pas celle-ci —
  commenté dans le code pour que ça ne passe pas pour un oubli.
- 🐛 **Piège de test évité, pas un bug produit** : `screen.findByText('Café')` apparaît dès l'entrée
  dans l'étage `review`, **avant** que la liste des catégories (chargée en async) et la
  sélection automatique n'aient fini de se résoudre. Un test qui vérifiait la sélection juste après
  ce texte était donc en course avec l'effet — remplacé par un `waitFor` qui attend la sélection
  elle-même, pas seulement la présence du chip.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1612/1612, 133 suites** ✅.

### Itération 36 — Tâche 6.7 (Confirmation d'ajout avec solde mis à jour) ✅
- `ExpenseConfirmation` (livrée avec la 5.x, réutilisée depuis) n'affichait **que** le solde
  restant — jamais le détail de l'opération qu'on venait d'enregistrer, ni un avertissement de
  dépassement. Ajoute une carte montant/catégorie/membre/date et, quand pertinent, un
  `AlertBanner` réutilisant le même texte que `categoriesScreen.overBanner` (pas de doublon de
  chaîne pour le même message).
- 🐛 **Corrigé au passage, pas dans le périmètre du critère mais découvert en l'implémentant** :
  la devise affichée sur cet écran était codée en dur sur `DEFAULT_CURRENCY_CODE` ('MAD'), au lieu
  de celle de l'opération réellement enregistrée. Silencieux tant qu'un seul foyer/devise existe,
  ça aurait affiché la mauvaise devise dès qu'une autre serait supportée.
- **Le calcul de dépassement se fait sur l'opération qui vient d'être enregistrée**, pas sur l'état
  général de la catégorie : `computeCategoryBudgetStatus` est recalculé après le `createTransaction`
  à partir des transactions rechargées, donc l'avertissement reflète bien l'effet de *cette*
  opération-là sur le plafond du mois.
- **`AddExpenseForm.onSaved` et `VoiceEntrySheet.onSavedFromReview` remontent maintenant la
  transaction créée** (au lieu d'un simple callback sans argument) — c'est ce qui permet à
  `ExpenseEntryProvider` de résoudre catégorie/membre/dépassement sans un aller-retour DB
  supplémentaire côté écran appelant. Une édition ne remonte toujours rien (`onSaved()` sans
  argument) puisqu'elle ferme directement sans passer par la confirmation.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1615/1615, 133 suites** ✅.

### Itération 37 — Tâche 6.8 (Saisie d'un revenu) ✅
- **Découverte en amont** : 2 des 3 critères étaient déjà satisfaits sans rien coder — le bascule
  Dépense/Revenu existe depuis une tâche antérieure (`AddExpenseForm`), et le solde/la ligne de
  transaction traitent déjà le revenu en positif (`computeMonthlyBalance`, `TransactionRow`). Un
  moteur de règles récurrentes complet (`src/recurring/`, `RecurringRuleForm`,
  `RecurringRulesScreen`) existait aussi déjà, accessible depuis Profil — mais **jamais relié** à
  l'écran de saisie ponctuelle. C'est ce lien qui manquait, pas le moteur.
- **Case « Rendre ce revenu mensuel »** dans `AddExpenseForm`, visible uniquement pour un nouveau
  revenu (`type === 'income' && !isEditing`) — pas en édition, où une règle est sa propre chose
  indépendante (gérée depuis `RecurringRulesScreen`), pas un sous-produit d'une modification.
- 🐛 **Évité avant d'écrire le code, pas corrigé après coup** : créer la règle avec `startDate` au
  jour de l'opération l'aurait rendue **due immédiatement** pour ce même mois — proposant un
  doublon de l'opération qu'on vient de saisir à la main. `nextMonthStart` (nouveau, testé
  isolément avec le passage d'année en décembre) démarre la règle le 1er du mois suivant, ce qui
  correspond au texte exact du critère (« proposé le mois suivant »), sans avoir besoin de toucher
  `lastRunDate` (que `createRecurringRule` ne permet pas de définir à la création).
- Mode `prompt` choisi (pas `auto`) : le critère dit « proposé », pas « ajouté automatiquement » —
  le foyer confirme chaque mois plutôt que de voir une transaction apparaître seule.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1624/1624, 134 suites** ✅.

### Itération 38 — Tâche 6.9 (Modification/suppression) ⚠️ laissée `done: false`
- **3 critères sur 4** livrés :
  1. Modifier montant/catégorie/membre/date/libellé — déjà couvert par `AddExpenseForm` en mode
     édition (tâches antérieures), rien à ajouter.
  2. **Nouveau : fenêtre « Annuler » de 5 s après suppression.** La confirmation avant suppression
     existait déjà ; ce qui manquait est la seconde moitié du critère. Choix : suppression
     immédiate (pas de suppression différée) + `UndoBanner` (nouveau composant) flottant pendant
     5 s qui **recrée** la transaction si on appuie sur Annuler. Une transaction différée aurait
     laissé l'opération visible pendant 5 s de plus après un « supprimer » explicite — contraire à
     ce qu'on vient de demander. Le minuteur vit dans `ExpenseEntryProvider` (pas dans
     `AddExpenseForm`, qui se ferme avant que les 5 s ne s'écoulent) pour survivre à la fermeture
     de la feuille de saisie.
  3. Solde/catégories/anneau recalculés — déjà vrai pour le dashboard (`dataVersion`). 🐛
     **`CategoriesScreen` ne s'abonnait pas à `dataVersion`** : modifier la catégorie d'une
     opération depuis `AddExpenseForm` pendant que l'onglet Catégories restait monté ne
     rafraîchissait ses totaux qu'au remount suivant. Corrigé au passage — c'est littéralement ce
     que ce critère demande.
- **Critère 4 laissé `done: false` — « membre en Lecture seule » n'a rien à vérifier contre** :
  le rôle `viewer` existe déjà dans le modèle de données et l'UI d'attribution (`MemberForm`,
  `MembersScreen`), et un helper `canEdit(role)` existe déjà dans `src/household/` — mais
  **inutilisé nulle part**, et pour cause : rien dans l'app n'identifie « quel membre du foyer
  utilise ce téléphone en ce moment ». Cette app est mono-appareil, sans session ni compte
  partagé (`docs` : le rôle « n'a de portée réelle qu'une fois un compte cloud partagé
  disponible, US-039/US-040 »). Inventer un sélecteur « qui es-tu ? » ici créerait une fausse
  notion de contrôle d'accès qui ne protégerait rien — la tâche **13.4 « Rôles et permissions des
  membres »** (US-052, plan Pro, encore `done: false`) est explicitement celle qui doit définir
  et faire respecter cette distinction, une fois l'invitation multi-appareil en place. Documenté
  ici plutôt que masqué ; repris quand la 13.4 (ou ce qu'elle requiert) arrivera.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1630/1630, 135 suites** ✅.

### Itération 39 — Tâche 6.10 (Attribution d'une opération à un membre) ✅
- **`MemberChip` (nouveau)** : même forme que `CategoryChipV` (icône/avatar + libellé, empilés),
  avec un `Avatar` à la place de l'icône — c'est littéralement ce que demande le critère
  (« pré-sélectionné avec son avatar »).
- **Champ masqué à 1 seul membre** (critère 3) : gardé volontairement sur `members.length <= 1`
  plutôt que sur le plan — `FREE_PLAN.members.max` vaut aujourd'hui `2` dans `freePlan.ts`, alors
  que la tâche **13.1 « Limite de 1 membre en plan Gratuit »** (encore `done: false`) est celle
  censée corriger cette valeur placeholder. Un gardé sur le plan n'aurait donc rien masqué du tout
  tant que 13.1 n'est pas faite ; un garde sur le nombre réel de membres fonctionne dès
  aujourd'hui et convergera naturellement avec « plan Gratuit » une fois 13.1 livrée.
- **Écart assumé sur le critère 2** (« quand je tape le champ, la liste s'affiche ») : lu comme
  « la liste des membres est visible et sélectionnable », pas comme « masquée derrière un tap » —
  les chips restent affichées directement (même traitement que la bande rapide de catégories,
  6.2), ce qui est cohérent avec des foyers à effectif toujours restreint (2-3 membres au grand
  maximum sur ce MVP) : un tap supplémentaire n'y ajouterait rien.
- 🐛 **Six tests existants cassés par le masquage à 1 membre**, corrigés : ils pressaient un chip
  membre qui n'existait déjà plus (la sélection étant automatique dès le chargement) — le press
  était redondant avant même ce changement, seulement rendu visible maintenant.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1637/1637, 135 suites** ✅.

### Itération 40 — Tâche 6.11 (Choix de la date de l'opération) ✅ — phase 6 close (hormis 6.9)
- **`src/calendar/calendarGrid.ts` (nouveau, pur)** + **`DatePicker` (nouveau composant)** :
  même logique que le pavé numérique (6.1) — un contrôle construit et testable plutôt qu'un
  widget natif différent par plateforme. Le calcul du quadrillage (semaines, jours du mois,
  positionnement du 1er sur son vrai jour de semaine) est entièrement pur et testé en isolation
  avant même d'exister comme composant.
- **Jours futurs désactivés dans la grille, pas seulement rejetés après coup** : même principe
  que le bouton Enregistrer désactivé à zéro (6.1) — la réponse à « puis-je choisir ce jour ? »
  est connue avant l'appui. La validation dans `handleSubmit` reste en filet de sécurité pour la
  saisie manuelle au clavier physique (le champ reste éditable en parallèle du sélecteur, comme
  `NumericKeypad`/`amountInput`).
- **Le champ Date déclenche le sélecteur via son `onFocus` natif** plutôt qu'un état ouvert/fermé
  géré par un `Pressable` séparé : taper le champ le focus déjà nativement, ce qui EST « je tape
  le champ » du critère, sans dupliquer la logique de focus.
- 🐛 **Piège de test, pas de bug produit** : le premier jet de `previousMonthIso()` (aide de test)
  construisait un `Date` local puis appelait `.toISOString()` — sur ce fuseau (UTC+1), minuit
  local le 1er du mois se convertit en 23h UTC la veille, décalant la date d'un jour. Corrigé en
  construisant la chaîne ISO directement depuis les composants de date locaux, sans passer par
  une conversion UTC — exactement le piège que `calendarGrid.ts` évite déjà en restant en UTC de
  bout en bout plutôt que de mélanger les deux.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1665/1665, 137 suites** ✅.

### Itération 41 — Phase 7 (Catégories, plafonds & alertes) ✅ 7/7
- **Audit préalable** (comme pour la phase 6) : les fondations (liste, ligne de progression,
  couleur d'alerte, formulaire combiné création/édition, calcul de plafond/report,
  `computeCategoryBudgetStatus`, alerte une fois par mois) existaient déjà et sont bien testées.
  Mais contrairement à la phase 6, plusieurs critères manquaient réellement en code, pas
  seulement au bookkeeping : pas d'écran de détail, pas de presets, pas de sélecteur de seuil en
  %, pas d'agrégation de bandeau, mauvais chiffre de limite gratuite, et le report qui faisait
  l'**inverse** de ce que demande son propre critère sur un dépassement.
- **Écart assumé sur la règle métier de la 7.1** (liste Maroc « Logement, Alimentation, École &
  enfants, Transport, Zakat & dons, Autres ») : **non appliqué**. La tâche **10.3** possède son
  propre critère « la catégorie Zakat & dons fait partie des catégories par défaut » (encore
  `done: false`) et la tâche **15.1** possède son propre critère sur les catégories par défaut du
  marché Maroc/Golfe (encore `done: false`) — renommer la liste ici aurait empiété sur les deux et
  cassé des dizaines de tests qui référencent les noms actuels (Courses, École, Santé…) sans
  aucune des deux tâches pour les remplacer proprement. Repris quand 10.3/15.1 arriveront.
- **`CategoryDetail` (nouvel écran, 7.3)** : anneau + 3 tuiles (Dépensé/Plafond/Reste) +
  transactions du mois filtrées par catégorie. Sert aussi de point d'entrée unique « taper une
  catégorie » pour 7.1 (avant : ouvrait directement l'édition, sans état intermédiaire).
- **`MonthSelector` ajouté à `CategoriesScreen`** (7.1, critère « le mois sélectionné ») —
  réutilise le même composant que le tableau de bord (5.2) et `nextMonthKey`/`previousMonthKey` de
  `src/calendar` (déjà écrits pour la 6.11), plutôt que d'écrire un troisième sélecteur de mois.
- **Bandeau agrégé** (7.2) : `AlertBanner` gagne un `onPress` optionnel ; agrégation
  (« N catégories dépassées ») seulement à partir de 2, sinon reste nommé + tapable vers le détail
  — au-delà de 1, « la catégorie concernée » du critère n'a plus de référent non ambigu.
- **Presets + clavier numérique + avertissement immédiat** (7.4) : le plafond utilise maintenant
  le même `NumericKeypad` que le montant de dépense (US-016), pas seulement un clavier décimal
  natif — cohérence avec la justification déjà posée en 6.1 (séparateur décimal variable selon
  OS/locale). L'avertissement « déjà dépensé plus que ce nouveau plafond » se calcule en direct
  pendant la saisie, avant l'enregistrement.
- 🐛 **Limite gratuite corrigée : 10 → 3** (7.5), au chiffre exact du critère d'acceptation plutôt
  que le placeholder précédent. Le « + » à la limite ouvre maintenant `PaywallScreen` (déjà utilisé
  ailleurs depuis Profil) au lieu de ne rien faire silencieusement.
- **Seuil en pourcentage plutôt qu'en montant libre** (7.6) : remplace le champ de saisie libre
  (qui pouvait dépasser le plafond, nécessitant sa propre validation) par des puces 50/70/80/90/100
  % — dépasser le plafond devient structurellement impossible, l'ancienne erreur de validation est
  supprimée avec ce qu'elle validait. Texte d'aperçu dynamique (« Notification quand tu atteins X
  MAD ») recalculé à chaque changement de plafond ou de seuil.
- 🐛 **Le report faisait l'inverse de son propre critère (7.7)** : `computeCategoryBudgetStatus`
  pinçait le report à `max(0, ...)`, ignorant tout dépassement du mois précédent — un test
  existant épinglait explicitement ce comportement comme correct (« does not roll over a negative
  leftover »). Le critère 7.7 dit noir sur blanc l'inverse (« le déficit est déduit du plafond du
  mois suivant »). Formule corrigée pour laisser `rolloverMinor` négatif, plafond effectif
  seulement borné à 0 (jamais un budget négatif). Le test existant est retourné pour affirmer le
  nouveau comportement voulu, pas contourné.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1681/1681, 138 suites** ✅.

### Itération 42 — Phase 8 (Objectifs & coffres) ✅ 4/4
- **Audit préalable** : `VaultsScreen`, `VaultForm` et `VaultDetail` existaient déjà (US-023) avec
  `computeVaultStatus` (calcul pur savedMinor/percentage/remaining/monthsRemaining/
  suggestedMonthlyMinor/isOverdue déjà couvert par `vaultStatus.test.ts`). Contrairement à la
  phase 7, aucun écran ne manquait entièrement — seulement des affichages precis attendus par les
  critères d'acceptation :
  - 8.1 : le nombre de coffres n'était pas affiché à côté du total épargné, et l'échéance
    (ou « Sans échéance ») n'apparaissait pas sur chaque ligne.
  - 8.2 : le formulaire de création n'affichait pas d'aperçu en direct du versement mensuel
    suggéré pendant la saisie — seul le détail le calculait, après enregistrement.
  - 8.3 : `VaultDetail` n'affichait ni le nombre de mois restants à côté du montant suggéré, ni de
    badge « En retard » distinct du texte d'échéance dépassée, ni de bloc de célébration à
    l'atteinte de l'objectif (seulement du texte plat).
  - 8.4 : chaque ligne de versement de l'historique affichait `note || date` (l'un OU l'autre) au
    lieu de la date ET le membre ensemble — un versement sans note perdait silencieusement
    l'information de qui l'avait fait.
- **`vaultCountLabel` + échéance par ligne (8.1)** : réutilise `formatShortDate`, même motif que le
  reste de l'app (`vaultsScreen.deadlineLabel`/`noDeadlineLabel`).
- **Aperçu en direct du versement suggéré (8.2)** : `VaultForm` reçoit un `savedMinor` optionnel
  (0 par défaut en création) et recalcule `computeVaultStatus` sur un `Vault`/`VaultContribution[]`
  temporaires à chaque frappe sur l'objectif ou l'échéance — même fonction pure que l'écran de
  détail, pas de second calcul divergent. `VaultDetail` passe son `status.savedMinor` réel à
  `VaultForm` en édition, pour que l'aperçu reflète l'épargne déjà accumulée plutôt que de repartir
  de zéro.
- **Mois restants, badge retard, célébration (8.3)** : `monthsRemainingLabel` accolé au montant
  suggéré (« Suggéré / mois : 250,00 MAD (sur 12 mois) ») ; le badge `Pill` « En retard »
  (`theme.banner.warningBg/warningText`) s'ajoute au texte d'indice déjà présent au lieu de le
  remplacer ; à l'atteinte, bloc dédié (icône `party-popper` + `reachedCelebration`) avec l'excédent
  affiché entre parenthèses s'il y en a un, plutôt que le même texte que l'état « en cours ».
- 🐛 **Ligne de versement corrigée pour toujours montrer date + membre (8.4)** : c'était
  `note || date` (l'un remplaçait l'autre), désormais `[date, membre].filter(Boolean).join(' · ')`
  avec la note affichée séparément au-dessus quand elle existe — aucune des trois informations
  n'écrase plus les autres. Montant préfixé `+` en `theme.colors.success` pour le distinguer
  visuellement d'une dépense.
- **Tests** : 3 nouveaux dans `VaultsScreen.test.tsx` (compteur de coffres, échéance/« Sans
  échéance », objectif à 0 % qui reste visible), 2 nouveaux dans `VaultForm.test.tsx` (aperçu qui
  apparaît seulement une fois objectif + échéance renseignés, aperçu qui reflète le `savedMinor`
  déjà épargné en édition — ce dernier avec `jest.useFakeTimers()` pour fixer « aujourd'hui » et
  obtenir un nombre de mois déterministe), 4 nouveaux dans `VaultDetail.test.tsx` (date + membre
  ensemble sur une ligne, montant préfixé `+`, badge « En retard », mois restants). Corrigé au
  passage : `VaultForm.test.tsx` et `VaultDetail.test.tsx` manquaient/avaient des assertions
  obsolètes découvertes en cours de route (wrapper `LanguageProvider` manquant, libellé du bouton
  d'ajout renommé, casse de « objectif atteint »).
- 🐛 **Piège de correspondance de texte avec espace insécable** : `Intl.NumberFormat` place un
  espace insécable (U+00A0) avant le code devise ; le normalisateur de RNTL le convertit en espace
  normal avant de tester une regex passée à `findByText`, mais si le motif de test est construit à
  partir du texte brut de `formatMoney` (qui contient encore le U+00A0), il ne correspond plus au
  texte normalisé — silencieusement, sans erreur claire au premier abord. Corrigé en normalisant
  aussi l'espace côté attendu (`\s` → `' '`) avant de construire le motif.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1690/1690, 138 suites** ✅.
- Aucune violation des garde-fous : toujours aucune API bancaire, toutes les valeurs passent par
  `formatMoney`/i18n, aucune chaîne en dur ajoutée.

### Itération 43 — Tâche 9.1 (Vue d'ensemble d'une tontine) ✅ — phase 9 amorcée

- **Audit préalable** : `TontineScreen` existait déjà en quasi-totalité (US-024, itérations
  antérieures) — cagnotte, tour courant, mon tour, calendrier, rappel, upsell Pro, état vide.
  Deux écarts réels avec les critères d'acceptation de la 9.1 :
  1. **Nombre de membres jamais affiché** : ajouté sous l'en-tête (`memberCountLabel`,
     nouvelle clé), visible dès qu'un groupe existe — c'est une propriété du groupe, pas du
     tour courant, donc affichée indépendamment de `roundStatus`.
  2. **Le libellé « Tour X sur N » n'incluait jamais le mois**, alors que le critère écrit
     « Tour X sur N - {mois} » noir sur blanc. Nouvelle clé `roundLabelWithMonth` (ar/fr/en),
     utilisée dans la carte du tour courant **et** dans le calendrier (qui, avant, concaténait
     le mois brut `round.month`, ex. `2026-08`, plutôt que de le formater).
- 🐛 **Trouvé au passage, corrigé** : `myRoundUpcoming`/`myRoundPast` interpolaient aussi
  `round.month` en brut (`YYYY-MM`) directement dans le texte visible — violation discrète de
  la règle « tout format passe par le helper centralisé ». Les deux passent maintenant par
  `formatMonthLabel(month, language)`, comme le reste de l'app (`dateFormat.ts`, réutilisé
  depuis la 6.11/7.x).
- Piège de test : la carte du tour courant et la ligne du calendrier affichent désormais **le
  même texte** pour le tour en cours (`Tour 1 sur 2 · juillet 2026`) → `findByText` remontait
  « multiple elements ». Remplacé par `findAllByText(...).not.toHaveLength(0)`, dans l'esprit
  du garde-fou déjà posé en 5.3 pour un problème de duplication de texte similaire.
- ⚠️ **Vérification navigateur LTR/RTL non effectuée** (blocage connu, `dev-browser`
  indisponible dans cet environnement — cf. section notes en bas de fichier).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1690/1690, 138 suites** ✅.

### Itération 44 — Tâche 9.2 (Création et paramétrage d'une tontine) ✅

- **Audit préalable** : `TontineGroupForm` existait déjà (nom, cotisation, mois de départ,
  membres, génération automatique du calendrier via `createTontineGroupWithMembers`). Trois
  écarts réels avec les 4 critères d'acceptation :
- 🐛 **Le libellé du champ mentait sur ce qu'il fallait saisir** : `contributionLabel` disait
  « Cagnotte par tour » (le total du tour), alors que la valeur saisie est la **cotisation
  individuelle** (le calcul `contribution × nombre de membres` produit la cagnotte, ailleurs
  dans le code). Un organisateur suivant le libellé à la lettre aurait saisi le mauvais
  montant. Renommé « Cotisation par membre », conforme au texte du critère (« cotisation par
  membre »).
- 🐛 **Devise encore codée en dur** (`DEFAULT_CURRENCY_CODE`), même bug que celui déjà corrigé
  dans `AddExpenseForm`/`ExpenseConfirmation`/`HomeScreen` à des itérations antérieures — jamais
  porté jusqu'à ce formulaire. Lit maintenant `households[0]?.currencyCode`, avec repli sur
  `DEFAULT_CURRENCY_CODE` si l'onboarding n'a pas encore créé de foyer.
- **Aperçu en direct (nouveau, critère 4)** : carte `Aperçu` recalculant la cagnotte
  (`formatMoney(cotisation × nombre de membres valides, ...)`) et le nombre de tours à chaque
  frappe — même schéma que le `VaultForm` de la 8.2 (aperçu dérivé, pas un second calcul
  divergent). Le compte de membres « valides » ignore les lignes encore vides, pour ne pas
  annoncer un tour supplémentaire avant qu'un nom soit réellement saisi.
- **Réordonnancement (critère 2), écart assumé** : le critère dit « par glisser-déposer », mais
  **aucune dépendance de gestes/drag n'existe dans ce projet** (`react-native-gesture-handler`,
  `reanimated`, tout paquet « draggable » — absents de `package.json`). Ajouter un vrai glisser
  tactile pour ce seul écran aurait exigé une nouvelle dépendance native, un travail de test
  quasiment impossible à couvrir sous RNTL (les gestes de pan ne se simulent pas), **et** un
  contrôle historiquement mauvais pour l'accessibilité (aucune sémantique native pour un
  lecteur d'écran). Implémenté à la place par **deux boutons Monter/Descendre** (icônes
  `chevron-up`/`chevron-down`, déjà non-directionnelles dans `Icon` — confirmé dans son
  ensemble `RTL_FLIP`) par ligne de membre, avec `accessibilityState.disabled` en butée (même
  motif que les chevrons du `MonthSelector`, 5.2) : atteint le même objectif fonctionnel
  (définir l'ordre des tours) en restant accessible et testable. Un swap déplace aussi
  `selfIndex` avec le membre concerné, pas avec la position.
- 🔎 **Résolu un résidu non commité d'une session antérieure** : `Icon.tsx` portait déjà
  `chevron-up` en attente (modification non committée trouvée en tout début de session, sans
  appelant). Elle correspond exactement au besoin ci-dessus — récupérée et committée avec cette
  tâche plutôt que dupliquée.
- **Périodicité (critère 1), écart assumé** : le champ existe (`Périodicité : Mensuelle`), mais
  **une seule valeur est réellement implémentée** — tout le moteur de tours
  (`tontine_rounds.month`, `findCurrentRound`, `monthsUntil`, `formatMonthLabel`) suppose des
  tours mensuels de bout en bout. Proposer un choix « Hebdomadaire » qui resterait silencieusement
  mensuel serait la fabrication que les garde-fous interdisent. Traité comme les « packs de
  langue »/« marchés » à venir (4.2/4.3) : mentionné (`periodicityWeeklyNote`, « bientôt
  disponible ») sans être sélectionnable. À lever si/quand le moteur de tours est généralisé
  au-delà du mois.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1694/1694, 138 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 45 — Tâche 9.3 (Mise en avant de mon tour) ✅

- **Audit préalable** : la carte « Mon tour » existait déjà (upcoming/current/none), mais deux
  des trois critères n'étaient pas remplis à la lettre :
- 🐛 **L'état « tour passé » n'affichait pas le montant reçu** : `myRoundPast` disait seulement
  « Ton tour est passé (tour N, mois) », sans le montant — alors que le critère demande
  explicitement « la carte affiche l'historique de ce que j'ai reçu ». `potLabel` est
  maintenant interpolé, texte reformulé en reçu : « Tu as reçu {{amount}} au tour {{round}}
  ({{month}}). ».
- ⚠️ **« Historique » lu comme un reçu unique, pas une liste** : `findMyRound` (et le modèle de
  génération des tours, `createTontineGroupWithMembers`) attribue à chaque membre **exactement
  un** tour par cycle — il n'existe donc jamais plusieurs tours passés à lister pour un même
  membre dans ce modèle de données. Construire une liste généralisée pour un cas qui ne peut
  produire qu'un seul élément aurait été de la sur-ingénierie pour un besoin hypothétique (un
  futur « renouvellement de cycle » hors du périmètre du PRD actuel). Le reçu unique, avec
  montant/tour/mois, remplit le critère sans l'inventer.
- 🐛 **`myRoundUpcoming` dans un ordre différent du critère écrit** : le critère dit « Ton tour
  arrive en {mois} (tour N) », le code disait « Ton tour arrive au tour N (mois) ». Réordonné
  pour suivre le texte du critère (ar/fr/en).
- **Carte mise en évidence (critère 1, « une carte mise en évidence »)** : la carte « Mon tour »
  est déplacée **avant** la carte « Tour courant » (elle concerne directement le foyer, contre
  l'état général du groupe) et gagne un fond teinté (`theme.accents.teal.wash`/`.ink`, mêmes
  tokens que la puce « payé » déjà utilisée sur cet écran) quand mon tour est actionnable
  (à venir ou en cours) — pas quand il est passé ou que je ne fais pas partie du groupe, où rien
  n'appelle à l'action.
- Tests : nouveau cas pour l'état « à venir » (membre non-self bénéficiaire du tour courant, moi
  au tour suivant) et pour l'état « passé » (mon tour au mois précédent), tous deux calculant le
  texte attendu via les **mêmes helpers** que l'écran (`formatMoney`, `formatMonthLabel`,
  `nextMonthKey`/`previousMonthKey`) plutôt que des séparateurs tapés à la main — dans l'esprit
  du garde-fou déjà posé en 1.6/8.4 sur les caractères invisibles de `formatMoney`.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1696/1696, 138 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 46 — Tâche 9.4 (Suivi des paiements du tour en cours) ✅

- **Audit préalable** : le compteur « X/N payé » et le toggle payé/en attente existaient déjà et
  se mettaient déjà à jour immédiatement (critères 1 et 4). Trois écarts réels :
- 🐛 **Aucun montant par membre affiché** : la ligne membre ne montrait qu'un verbe d'action
  (« Marquer payé »/« Marquer en attente »), jamais ce que ce membre doit ce tour-ci — alors que
  le critère 2 exige explicitement avatar + nom + **montant** + statut. Chaque ligne est
  reconstruite (`Card` + `Pressable`, plus `ListRow` qui n'a qu'un seul slot `trailing` — pas
  assez pour montant **et** statut **et**, sur une ligne, un badge) : `formatMoney` de la
  cotisation par membre (`group.contributionPerRoundMinor`, pas la cagnotte totale) au-dessus
  d'un `Pill` de statut.
- 🐛 **Le statut affiché était un verbe d'action, pas un état** : le critère demande la paire
  littérale « Payé / En attente ». Séparé de l'action (le tap sur la ligne bascule toujours le
  statut, geste inchangé) : nouvelles clés `statusPaid`/`statusPending`, `markPaid`/`markPending`
  supprimées (plus aucun appelant).
- 🐛 **Le bénéficiaire n'était identifié que par une ligne de texte au-dessus de la liste**
  (« Bénéficiaire : Youssef »), jamais par un badge **sur sa ligne** comme l'exige le critère 3.
  Nouveau `Pill` doré (`theme.accents.gold`, jusqu'ici inutilisé sur cet écran — le distingue du
  teal déjà pris par « payé » et du violet des autres membres) avec le texte exact du critère
  (« Bénéficiaire - reçoit ce tour »).
- **Clôture du tour (critère 5), nouvelle capacité côté données** : migration **0019**
  (`tontine_rounds.closed_at`, nullable) + `updateTontineRound` (repository jusqu'ici
  create/read/list seulement — le commentaire disant « jamais modifié après coup » est corrigé
  en conséquence). Bouton « Clôturer le tour » affiché seulement quand `paidCount === totalCount`
  et le tour n'est pas déjà clôturé ; une fois clôturé, un badge « Tour clôturé » le remplace.
- ⚠️ **Écart assumé sur « le tour suivant devient courant »** : `findCurrentRound` reste basé sur
  le mois calendaire (comportement déjà livré et testé en 9.1/9.3/9.5-adjacent) plutôt que sur la
  clôture — changer cette base aurait fait diverger la définition de « courant » entre cette
  tâche et les trois précédentes qui s'appuient dessus (9.1 « Tour X sur N - mois », 9.3
  « à venir/en cours/passé » via `monthsUntil`), pour un cas que le modèle de données ne permet
  d'ailleurs pas de tester : chaque membre ne bénéficie que d'**un seul** tour par cycle, donc le
  tour suivant devient de toute façon courant dès que son mois calendaire arrive, avec ou sans
  clôture manuelle. La clôture est donc un acte de tenue de registre honnête (« ce tour est
  réglé ») plutôt qu'un second mécanisme d'avancement redondant avec le premier.
- Tests : nouveau cas pour montant + statut + badge bénéficiaire sur chaque ligne, nouveau cas
  pour la clôture (bouton absent tant que tout n'est pas payé, apparaît une fois les deux membres
  marqués payés, disparaît au profit du badge après clôture), plus un test repository dédié à
  `updateTontineRound` (`closedAt` nul à la création, mis à jour une fois).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1700/1700, 138 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 47 — Tâche 9.5 (Calendrier des tours) ✅ — phase 9 terminée

- **Le calendrier était une liste verticale** (`ListRow` empilées), alors que les 3 critères
  décrivent une **frise horizontale scrollable** avec des états visuels distincts (grisé/mis en
  évidence/« Toi »). Remplacé par un `ScrollView horizontal` de tuiles (mois + « Tour X sur N » +
  nom du bénéficiaire ou « Toi »), même motif déjà utilisé pour la bande de catégories de
  `AddExpenseForm` (US-017) — jusqu'au commentaire expliquant que `ScrollView` inverse déjà tout
  seul son sens de lecture en RTL, donc rien à coder en plus pour le critère 3.
- **Grisé / mis en évidence** : `opacity: 0.5` pour un tour passé (`monthsUntil(now, round.month)
  < 0`, même fonction que 9.3), fond + bordure `theme.accents.teal` (déjà la couleur « en cours »
  sur cet écran, cf. la puce « payé » et la carte « mon tour » actionnable) pour le tour courant —
  jamais l'opacité et la couleur toutes seules l'une sans l'autre pour porter l'information (même
  garde-fou que la 2.4 : dans les deux cas le mois/numéro du tour reste lisible en texte, la
  couleur n'est qu'un renfort).
- **« Toi »** : nouvelle clé `calendarMineBadge` (distincte de `calendarMineTag`, le suffixe
  « (Toi) » toujours utilisé ailleurs sur l'écran) — sur la frise, le libellé du bénéficiaire est
  **remplacé** par « Toi » plutôt que suffixé, le critère demandant que mon tour « porte le
  libellé Toi », pas mon nom affublé d'un tag.
- Test : `testID` déterministe par tour (`tontine-round-tile-{id}`, l'id venant de
  `listTontineRounds` après création, pas deviné) pour cibler précisément la tuile passée vs la
  tuile courante et vérifier `opacity`/le libellé sur chacune séparément — repris du même besoin
  que le badge « En retard » de la 8.3, où le style seul ne suffit pas à prouver le bon état sans
  savoir *laquelle* des tuiles on regarde.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1701/1701, 138 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé) — en particulier
  le sens de défilement réel de la frise en RTL, qui dépend du moteur natif et n'est pas
  observable depuis les tests de rendu.

### Itération 48 — Tâche 10.1 (Mode Ramadan) ✅ — phase 10 amorcée

Tâche à choix d'architecture réels ; les deux ont été posés à l'utilisateur avant d'écrire du
code plutôt que tranchés seul (cf. guide de collaboration — un vrai fourchement, pas une
préférence esthétique) :

- **« L'onglet Accueil doit-il vraiment changer d'identité, ou l'écran séparé (Profil > Mode
  Ramadan, déjà livré) suffit-il ? »** → utilisateur : faire basculer l'onglet Accueil. C'est le
  changement le plus lourd des deux (touche l'écran vu chaque jour), mais suit le critère à la
  lettre plutôt qu'une lecture élastique.
- **« Construire un calendrier hégirien approximatif pour la suggestion automatique, ou laisser
  l'activation manuelle seule et documenter le blocage ? »** → utilisateur : construire le
  calendrier, documenté comme approximation.

**Audit préalable** : `RamadanScreen` (Profil), `computeSeasonalThemeStatus`,
`activateRamadanTheme` et les 4 sous-catégories existaient déjà et sont réutilisés tels quels — la
tâche réelle était de brancher `HomeScreen` sur cet état déjà persistant, pas de le reconstruire.

- **`src/seasonalThemes/hijriCalendar.ts` (nouveau)** : conversion grégorien ⇄ hégirien en
  **arithmétique pure** (calendrier « tabulaire »/civil, cycle fixe de 30 ans) plutôt que via le
  calendrier `islamic-civil` d'`Intl` — Hermes sur l'appareil n'expose qu'un sous-ensemble d'ICU
  (déjà la cause du correctif de l'itération 30 sur `RelativeTimeFormat`/`PluralRules`) ; réutiliser
  la même surface ICU pour un calendrier aurait exposé au même risque. Le calendrier `islamic-civil`
  d'Intl **existe sous Node** (ICU complet de Jest) : utilisé uniquement comme oracle de test, jamais
  à l'exécution — les 16 tests du module comparent la sortie de l'arithmétique manuelle à celle
  d'`Intl` sur 7 dates, plus l'aller-retour et les propriétés de la fenêtre de suggestion.
  **Documenté comme approximation** : ±1-2 jours par rapport à la date par observation lunaire
  qu'annoncent les autorités religieuses — jamais présenté comme faisant autorité, seulement utile
  pour proposer l'activation une semaine à l'avance.
- **Migration 0020** (`user_settings.ramadan_suggestion_dismissed_hijri_year`, nullable) +
  `dismissRamadanSuggestion(db, hijriYear)` : l'année hégirienne du refus est stockée, pas un
  booléen — la suggestion doit revenir l'année suivante plutôt qu'être réduite au silence pour
  toujours après un seul refus (même logique que `voice_promo_dismissed`, mais annuelle).
- **`HomeScreen` bascule d'identité (critères 1-4)** : `ScreenHeader` passe en titre simple « Mode
  Ramadan », `BalanceHeroCard` est réutilisé avec `gradient="ramadan"` (dégradé nuit/or déjà défini
  mais jamais consommé) + `barColor`/`cornerIcon="moon-star"` dorés — au lieu d'un nouveau
  composant hero, exactement ce que les commentaires de `BalanceHeroCard` anticipaient déjà
  (« Ramadan uses gold », « cornerIcon e.g. moon-star for Ramadan »). Les 4 tuiles réutilisent
  `StatCard` (son propre commentaire disait déjà « Used in the Ramadan grid ») sur
  `ramadanStatus.categorySpend`, avec `categoryIconName`/`categoryAccent` déjà utilisés partout
  ailleurs pour mapper icône/couleur stockées → tokens. Le raccourci Zakat mentionne le taux
  (`zakatShortcutWithRate`, nouvelle clé) et ouvre l'écran Zakat existant sans dupliquer son calcul.
- **Fin du Ramadan (critère 5)** : un récapitulatif (dépensé/enveloppe) + bouton « Revenir au thème
  standard » qui désactive la ligne `seasonal_themes` — l'onglet redevient normal au prochain
  rendu puisque `activeRamadanTheme` ne trouve plus de ligne active.
- **Suggestion automatique (règle métier)** : bannière dismissible sur le tableau de bord normal
  (`shouldSuggestRamadanActivation`, fenêtre = semaine avant + toute la durée du Ramadan), visible
  seulement si Pro, aucun thème actif, et pas déjà refusée pour cette année hégirienne. « Activer »
  ouvre l'écran `RamadanScreen` existant (son formulaire de configuration, réutilisé, pas dupliqué) ;
  « Pas maintenant » enregistre le refus.
- 🐛 **9 fichiers de test `HomeScreen` cassés par l'ajout d'`useEntitlements()`** : aucun ne
  fournissait `EntitlementsProvider` (l'écran n'en avait jamais eu besoin avant). Corrigés
  uniformément — plan par défaut (Gratuit), donc `ramadan: false`, aucune interférence avec les
  tests existants.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1733/1733, 140 suites** ✅. Bundle web
  vérifié via `npx expo export --platform web` (2609 modules, aucune erreur).
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 49 — Tâche 10.2 (Calculateur de Zakat) ✅

- **Audit préalable** : `ZakatScreen`, `computeNisabMinor`, `computeZakatAssessment` existaient
  déjà et couvraient déjà 4 des 6 critères (saisie des 4 catégories d'avoirs, base en direct,
  taux 2,5 %, statuts au-dessus/en dessous du nisab). Deux écarts réels :
- 🐛 **Devise encore codée en dur sur tout l'écran** (`DEFAULT_CURRENCY_CODE`/MAD) : le nisab, la
  base, le montant dû, l'historique et même l'analyse des montants saisis (`parseNonNegativeAmountInput`,
  sensible au nombre de décimales de la devise) ignoraient la devise réelle du foyer — même classe
  de bug déjà corrigée sur `AddExpenseForm`/`TontineGroupForm`/etc., jamais portée jusqu'ici. Un
  foyer en France aurait vu son nisab en dirhams. Lit maintenant `households[0]?.currencyCode`.
  Repli laissé sur le préremplissage du prix par gramme (`priceInput`, `/100` fixe) : le corriger
  exigeait de faire dépendre `refresh` (mémoïsé à vide) de `currencyCode`, qu'il alimente lui-même
  via `setHouseholds` — un risque réel de boucle de rendu pour un gain marginal (le préremplissage
  d'un champ de saisie, pas un montant affiché) ; laissé tel quel plutôt que risqué.
- 🐛 **Critère « hero » non respecté à la lettre** : le résultat (base/dû/statut) vivait dans une
  `Card` plate au même niveau visuel que la configuration — pas de dégradé pertinent dans la
  palette existante pour un vrai hero à la `BalanceHeroCard` (aucune notion de « progression »
  naturelle ici, contrairement au solde du mois). Repris à l'identique du traitement déjà choisi
  par `RamadanScreen` pour son propre budget restant (`IconTile` + montant en `size="xxl"` dans une
  `Card` centrée) plutôt que d'inventer un nouveau dégradé — le statut passe d'un texte coloré à un
  `Pill` (même doc-comment du composant : « tontine paid/pending status » l'anticipait déjà pour ce
  genre de badge).
- Tests : nouveau cas dédié à la devise du foyer (EUR, avec le piège déjà rencontré en 8.4 — le
  formateur `fr` rend l'EUR par son symbole `€`, pas par les lettres ISO, contrairement au MAD qui
  n'a pas de symbole étroit en CLDR fr et retombe sur les lettres). Les 7 tests existants
  passent inchangés (le format « Base zakatable : {montant} » de la carte est resté identique).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1734/1734, 140 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 50 — Tâche 10.3 (Catégorie Zakat & dons avec plafond) ✅

- **Écart réel** : ce que l'itération 41 (phase 7) avait volontairement laissé de côté — le
  seeding des catégories par défaut (`getDefaultCategories`/`seedDefaultCategories`) était
  **entièrement piloté par la langue**, jamais par le marché. Aucune notion de « MENA/Golfe »
  n'existait avant cette tâche.
- **`isMenaGulfMarket(countryCode)` (nouveau, `src/market`)** : réutilise volontairement le signal
  déjà présent `marketHasModule(countryCode, 'tontine')` plutôt qu'une seconde liste de pays à
  maintenir en parallèle — dans le registre actuel, tontine et MENA/Golfe décrivent déjà exactement
  le même découpage (Maghreb + Golfe vs diaspora), documenté comme tel dans le commentaire de la
  fonction pour que ce ne soit pas lu comme une coïncidence.
- **`getDefaultCategories(language, countryCode = DEFAULT_COUNTRY_CODE)`** : `countryCode` devient
  un second paramètre **optionnel** (repli sur le marché de lancement, Maroc) plutôt qu'obligatoire
  — évite de casser les nombreux appelants existants qui n'avaient jamais eu besoin du marché
  (`ensureAppReady`, les tests de bootstrap) alors que Maroc, précisément, est un marché MENA : le
  comportement par défaut change donc correctement pour le marché réellement lancé, sans réécrire
  tous les appels. Catégorie ajoutée **en fin de liste** (jamais insérée au milieu), pour ne jamais
  décaler l'`orderIndex` des 9 catégories existantes déjà en base chez des foyers existants.
- **`OnboardingLanguageCountryScreen`** : seul appelant à devoir passer un vrai `countryCode` non
  défaut, puisque c'est le seul endroit où le marché choisi par l'utilisateur est réellement connu
  au moment du seeding.
- 🐛 **Test existant devenu incomplet, pas faux** : `defaultCategories.test.ts` figeait la liste
  Maroc à 9 noms sans jamais passer de `countryCode` — avec le nouveau critère, Maroc (marché
  MENA par excellence) doit désormais en avoir 10. Mis à jour pour refléter le comportement voulu
  plutôt que contourné.
- **Couleur/icône dédiées** : `hand-heart` / `#B45309` (un ambre plus profond que celui déjà pris
  par « Courses », `#D97706`) — ajouté à `categoryAccent`'s `COLOR_TO_ACCENT` pour résoudre vers
  `gold`, sinon la tuile serait retombée sur le teal par défaut (repli silencieux déjà documenté
  dans la 9.1 pour toute couleur non reconnue).
- **Critère 2 (« se comporte comme les autres : plafond, alerte, détail ») satisfait sans code
  supplémentaire** : la catégorie passe par le même `createCategory(..., isDefault: true, ...)`
  que les 9 autres — plafond/alerte/détail sont tous indexés par `category.id`, jamais par nom,
  donc rien à spécialiser.
- **Critère 3 (marché non concerné → créable à la main)** : déjà vrai nativement (`createCategory`
  n'a jamais restreint les noms) ; testé explicitement pour le documenter comme un critère vérifié,
  pas seulement supposé.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1747/1747, 140 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 51 — Tâche 10.4 (Enregistrement et planification du don de Zakat) ✅ — phase 10 terminée

- **Audit préalable** : `ZakatAssessment` n'était qu'un historique de calculs, append-only, sans
  aucune notion de date de versement, de statut payé, ni de lien vers une transaction réelle — le
  docstring du type disait déjà « enregistrer/planifier le don » mais aucun champ ne le portait.
- **Migration 0021** : `due_date`/`paid_at`/`transaction_id`/`reminded_at`, tous nullables. Même
  choix qu'en 9.4 : **pas de colonne « statut » séparée** — `paid_at IS NULL` est l'unique signal
  « encore planifié », pour ne jamais pouvoir diverger d'un enum parallèle.
  `markZakatAssessmentPaid`/`markZakatAssessmentReminded` (nouveau) rejoignent
  `createZakatAssessment`/`listZakatAssessments`, toujours pas d'`update` générique — seules ces
  deux mutations précises existent.
- **« Rattachée à la catégorie et impacte son plafond une fois versée » (critère 2)** : les
  plafonds de catégorie se calculent **uniquement** à partir de vraies lignes `Transaction`
  (`computeCategoryBudgetStatus`, jamais d'un canal parallèle « montant planifié »). Marquer un
  don comme versé crée donc une vraie dépense dans la catégorie « Zakat & dons » — c'est le seul
  moyen honnête de l'y faire compter, plutôt qu'un second système de suivi qui la contournerait.
  **Catégorie retrouvée par icône (`hand-heart`), pas par nom** — même principe déjà appliqué à la
  déduction vocale (itération 35) : robuste à un foyer qui aurait renommé sa catégorie. Un foyer
  sans catégorie « Zakat & dons » (marché hors MENA/Golfe, ou catégorie supprimée) voit le bouton
  « Marquer comme versé » remplacé par une invite à créer la catégorie d'abord — plutôt que de
  fabriquer une transaction sans catégorie valable (`categoryId` est un FK obligatoire).
- **Rappel à échéance (critère 3), même mécanisme que la tontine — pas un nouveau** : ce projet n'a
  **aucune notification programmée par l'OS à une date future** ; chaque « rappel » existant
  (plafond de catégorie, tontine) est une fonction de décision pure évaluée à **chaque démarrage
  de l'app**, qui déclenche `notificationClient.presentNow()` séance tenante si les conditions sont
  réunies. `shouldSendZakatReminder`/`processZakatReminders` (nouveaux, dans `src/zakat/`) suivent
  exactement ce patron — branchés dans `ensureAppReady`, comme `processTontineReminders`. Limite
  assumée et déjà présente ailleurs : si l'app n'est pas ouverte le jour de l'échéance, le rappel
  arrive au prochain lancement, pas pile à la date choisie.
- **Bouton renommé** « Enregistrer ce calcul » → « Enregistrer & planifier le don » (texte exact du
  critère 1), avec un champ de date de versement optionnel ajouté juste au-dessus.
- **Critère 4 (historique des années précédentes)** : déjà satisfait par la liste chronologique
  inversée existante (`listZakatAssessments`, `ORDER BY created_at DESC`) — aucun regroupement par
  année n'était nécessaire pour remplir le critère tel qu'écrit.
- Tests : nouveaux cas pour la date de planification sauvegardée, l'absence de catégorie (message
  au lieu du bouton), et le marquage payé qui crée bien une `Transaction` `expense` liée à la bonne
  catégorie et au bon montant — plus la suite dédiée `zakatReminderDecision`/`processZakatReminders`
  (12 cas, même structure que les tests tontine déjà en place).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1769/1769, 142 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 52 — Tâche 11.1 (Suivi annuel des transferts vers le pays d'origine) ✅ — phase 11 amorcée

- Nouvelle table `diaspora_transfers` (migration `0022`) — journal d'envois, séparé de la table
  `transfers` déjà existante (`0015_household_debt_transfer`) qui modélise un tout autre concept
  (virement **entre deux membres du même foyer**) : mêmes noms de fonctions étaient déjà pris
  (`createTransfer`/`listTransfers`), d'où `diasporaTransferRepository.ts` et le préfixe partout.
- **Devise du « pays d'origine »** : aucune notion de pays d'origine n'existe encore nulle part
  dans le schéma (seule `user_settings.country_code` existe, et c'est le pays de **résidence**).
  La US-064 (tâche 15.2, phase 15) est explicitement celle qui rend cette devise secondaire
  *configurable par foyer* — la construire ici aurait empiété sur son périmètre en pure perte
  (UI à refaire). Choix : `DEFAULT_ORIGIN_CURRENCY_CODE = 'MAD'` (nouveau `src/lib/rates/`),
  documenté comme un placeholder explicite en attendant 15.2 — cohérent avec le fait que le lancement
  MVP est Maroc uniquement (`SELECTABLE_MARKETS` n'a que MA ; FR/AE/SA sont juste « annoncés »),
  donc aucun vrai foyer ne peut aujourd'hui avoir une autre devise d'origine réelle.
- **Taux de change** : `src/lib/rates/mockExchangeRates.ts` — table fixe et fictive (documentée
  comme telle), exprimée en unités par dollar US pour convertir n'importe quelle paire sans table
  N×N. Respecte le garde-fou « jamais d'API de change réelle ».
- `computeAnnualTransferSummary`/`listTransferYears` (nouveau `src/transfers/`) : somme et compte
  purs sur l'année sélectionnée, recalculés en mémoire au changement d'année (aucune re-requête
  DB) — même schéma que `categoryBudgetStatus`.
- `TransfersScreen` (déjà présent comme `PlaceholderScreen` depuis la phase 9, wiré dans
  `RootNavigator`/`resolveTabs` — aucun changement de navigation nécessaire) : bandeau
  « saisie manuelle, pas un service de transfert », sélecteur d'année en `Chip`, carte total +
  contre-valeur `≈` + nombre, historique. Nouvelle entitlement `transfers` (free: false, pro: true).
- **Vérification navigateur (LTR/RTL)** tentée pour de vrai cette fois (Chromium/Playwright installés
  localement, `npm run web` lancé) — nouveau diagnostic précis du blocage récurrent des itérations
  précédentes : la racine `#root` reste vide, `pageerror` montre
  `ExpoSecureStore.default.getValueWithKeyAsync is not a function` (`expo-secure-store` n'a pas
  d'implémentation web, et ça casse le montage de `App.tsx` entier, pas juste cet écran) plus
  `SharedArrayBuffer is not defined` (`expo-sqlite` web a besoin d'isolation cross-origin que le
  serveur de dev n'active pas). **Aucun écran** ne peut donc être vérifié dans ce navigateur tant que
  ce n'est pas corrigé — hors périmètre de 11.1, pas retouché. Repli sur le même stand-in que le
  reste du projet (`HomeScreen.rtl.test.tsx`, `RootNavigator.rtl.test.tsx`) : nouveau
  `TransfersScreen.rtl.test.tsx` qui rend l'écran sous `I18nManager.isRTL` true/false. L'écran
  n'utilise que des primitives partagées (`AppScreen`, `Card`, `Chip`, `ListRow`…) sans
  `left`/`right` codé en dur.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1794/1794, 147 suites** ✅.

### Itération 53 — Tâche 11.2 (Bénéficiaires récurrents) ✅

- Migration **0023** : nouvelle table `diaspora_beneficiaries` (nom, lien de parenté, montant
  habituel nullable, rythme `monthly`/`occasional`) + `diaspora_transfers.beneficiary_id`
  (nullable, sans `ON DELETE`) — la 0022 précédait le concept de bénéficiaire, sa propre note
  l'anticipait déjà. Pas de colonne `currency_code` sur le bénéficiaire : le montant habituel se
  lit dans la devise du foyer (`households[0]?.currencyCode`), déjà la donnée que l'écran Transferts
  affiche partout ailleurs — une seconde devise par bénéficiaire aurait pu diverger de celle du
  foyer sans qu'aucun critère ne le demande.
- **Critère 3 (« modifier/supprimer sans perdre l'historique ») pris au sérieux plutôt que supposé** :
  `beneficiary_id` est nullable et sans cascade — supprimer un bénéficiaire ne touche jamais aux
  lignes `diaspora_transfers` déjà écrites (append-only, même principe que `category_id` survivant
  au renommage d'une catégorie). Testé explicitement : créer un transfert lié, supprimer le
  bénéficiaire, vérifier que `listDiasporaTransfers` renvoie toujours la ligne intacte — à la fois
  au niveau repository et de bout en bout depuis l'écran (le total annuel ne bouge pas après la
  suppression).
- **`BeneficiaryForm`** (nouveau, calqué sur `VaultForm`) : nom, lien de parenté (texte libre),
  bascule mensuel/occasionnel, montant habituel — obligatoire si mensuel, optionnel sinon (repli
  silencieux vers `null` si le champ est laissé vide en occasionnel, jamais l'inverse). Suppression
  avec confirmation inline, même mécanique que `VaultForm`.
- **`TransfersScreen`** gagne une section « Bénéficiaires » (liste avec `Avatar`, lien de parenté et
  rythme formaté — « 300,00 MAD / mois » ou « Occasionnel ») et un flux d'envoi rapide : toucher un
  bénéficiaire ouvre un formulaire pré-rempli avec son montant habituel (critère 2), qui écrit via
  `createDiasporaTransfer` en renseignant désormais `beneficiaryId`. Le futur US-047 (méthode +
  conversion manuelle) étendra ce même appel plutôt que d'en écrire un second.
- Tests : nouvelle suite `diasporaBeneficiaryRepository.test.ts` (CRUD + le cas « historique
  préservé après suppression ») ; `diasporaTransferRepository.test.ts` étendu (lien vers un
  bénéficiaire, rejet FK vers un bénéficiaire inconnu) ; `TransfersScreen.test.tsx` +7 cas
  (liste vide, rythme mensuel/occasionnel, pré-remplissage, envoi, édition et suppression sans
  perte d'historique) ; `TransfersScreen.rtl.test.tsx` étendu à la liste + au formulaire d'envoi/
  édition sous le drapeau RTL.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1818/1818, 148 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé) — repli sur
  `TransfersScreen.rtl.test.tsx` comme en 11.1.

### Itération 54 — Tâche 11.3 (Enregistrement d'un transfert, méthode & conversion) ✅ — phase 11 terminée

- **Migration 0024** : `diaspora_transfers` gagne `method` (`wise`/`cash`/`other`, `DEFAULT 'other'`
  pour que les lignes 0022/0023 déjà en base se rétro-remplissent proprement), `origin_amount_minor`
  et `rate_is_manual`. **Contre-valeur snapshotée à l'enregistrement, jamais recalculée** : même
  règle déjà appliquée aux montants de `zakat_assessments`/`tontine_rounds` — un taux qui change
  plus tard ne doit jamais réécrire silencieusement l'historique d'un transfert déjà enregistré.
- **`convertAmountMinorWithRate`** (nouveau, `src/lib/rates`) : conversion par un taux **saisi par le
  foyer** plutôt que la table mockée — critère métier « un taux manuel peut être saisi ». Respecte
  la précision décimale propre à la devise cible (testé avec le JPY, 0 décimale, pour ne pas
  supposer 2 décimales partout).
- **Formulaire unifié « Nouveau transfert »** remplace le petit formulaire d'envoi de la 11.2 : le
  bénéficiaire y est désormais un **champ du formulaire** (puces, dont « Aucun bénéficiaire »), pas
  un préalable — conforme au critère 1 qui liste bénéficiaire/montant/date/méthode comme une seule
  saisie. Choisir un bénéficiaire aux puces préremplit toujours son montant habituel, exactement
  comme le tap direct sur sa ligne dans la liste (même trajectoire de code, un seul chemin).
- **Section conversion** (critère 2, seulement si la devise du foyer diffère du MAD) : bascule
  taux automatique/manuel, aperçu **en direct** de la contre-valeur avant tout enregistrement, note
  de source/date (`transfersScreen.rateSourceNote`, MOCK_RATES_UPDATED_AT) — remplit le critère
  « la date/source doivent être indiquées » sans jamais afficher `MOCK_RATES_SOURCE` tel quel (cette
  constante est en français en dur ; l'afficher aurait violé le garde-fou i18n). Son commentaire,
  qui prétendait à tort qu'elle serait affichée, est corrigé en conséquence.
- **Historique enrichi** (critère 3) : chaque ligne affiche désormais la méthode et le nom du
  bénéficiaire (résolu par id, silencieusement absent si supprimé — même principe que la 11.2) en
  sous-titre, et la contre-valeur sous le montant si elle a été calculée. Le total annuel n'a pas
  changé de calcul : il ne lit jamais `originAmountMinor`, seulement `amountMinor` par transfert.
- **Raccourci dashboard « Envoyer au {pays} » (critère 4)** : nouveau `originMarket()` dans
  `src/market` (le marché dont la devise correspond à `DEFAULT_ORIGIN_CURRENCY_CODE`, donc le Maroc
  aujourd'hui) plutôt qu'un nom de pays codé en dur — visible seulement pour un foyer Pro dont le
  marché a le module Transferts (`marketHasModule(countryCode, 'transfers')`), jamais pour un foyer
  marocain qui verrait un raccourci d'envoi vers son propre pays. `RootTabParamList['transfers']`
  gagne un paramètre optionnel `openRecordForm` ; `TransfersScreen` l'écoute et bascule direct sur le
  formulaire (puis efface le paramètre via `navigation.setParams`, même mécanique que
  `HomeScreen`'s `navigation?.navigate('categories')` déjà en place depuis la phase 5).
- 🐛 **Trouvé en écrivant le raccourci** : rien n'existait encore pour nommer le pays d'origine —
  la seule donnée présente était `DEFAULT_ORIGIN_CURRENCY_CODE = 'MAD'`, un code devise, pas un nom
  affichable. `originMarket()` le dérive du registre existant plutôt que d'ajouter une constante
  séparée qui aurait pu diverger.
- Tests : `mockExchangeRates.test.ts` (+2, dont la précision décimale du JPY) ;
  `diasporaTransferRepository.test.ts` (+1, les 3 nouveaux champs round-trip) ; 8 nouveaux cas dans
  `TransfersScreen.test.tsx` (méthode/bénéficiaire choisis, défaut « autre », conversion auto,
  conversion manuelle, absence de section conversion en MAD, méthode+contre-valeur dans
  l'historique, ouverture directe via `openRecordForm`) ; nouveau `HomeTransfersShortcut.test.tsx`
  (4 cas : visible et nomme le Maroc, navigue avec le bon paramètre, masqué en Gratuit, masqué pour
  un marché tontine sans module Transferts) ; `TransfersScreen.rtl.test.tsx` étendu au formulaire
  unifié.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1834/1834, 149 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé, cf. itération 52).

### Itération 55 — Tâches 12.1, 12.2, 12.3 (Dettes informelles) ✅ — phase 12 terminée en une itération

Les trois tâches partagent un seul modèle de données et un seul écran (liste → formulaire →
détail), traitées ensemble plutôt qu'en trois passes séparées sur le même code.

- **Audit préalable** : `Debt`/`debtRepository` existaient déjà (tâche 1.3) mais n'étaient
  utilisés nulle part — aucun écran, aucune donnée réelle possible. Ça a permis un choix net :
  rendre `date` (date du prêt, distincte de l'échéance et du `created_at`) **obligatoire** plutôt
  que rétro-compatible, et casser franchement les 8 tests existants de `debtRepository.test.ts`
  plutôt que de la rendre optionnelle avec un flou sur sa valeur par défaut.
- **Migration 0025** : `debts` gagne `date` et `reminded_at` (même garde « une seule fois » que
  Zakat/Tontine) ; nouvelle table `debt_repayments`, journal des versements — même schéma que
  `vault_contributions`.
- 🐛 **Décision d'architecture : la colonne `debts.settled` (héritée de la 1.3) n'est plus la
  source de vérité.** Un statut booléen stocké à côté d'un journal de versements est exactement le
  piège que Zakat (`paid_at IS NULL`) et Tontine (`closed_at`) évitent déjà — deux sources qui
  peuvent diverger. `computeDebtStatus(debt, repayments)` calcule `remainingMinor` et `isSettled`
  en sommant les versements, jamais en lisant `settled`. La colonne reste dans le schéma (coûteux à
  retirer en SQLite) mais un test dédié (« never reads the legacy settled column ») fige qu'elle
  n'a plus aucun effet.
- **`computeNetDebtTotals`** (`src/debts`) : les deux totaux de la vue nette, une dette soldée n'y
  contribue plus (US-050 « sort des totaux ») — recalculé en mémoire à chaque changement, même
  schéma que `computeCategoryBreakdown`.
- **Rappel d'échéance (US-049), même mécanique que Zakat/Tontine — pas une nouvelle** :
  `shouldSendDebtReminder`/`processDebtReminders`, branchés dans `ensureAppReady`. Une dette sans
  échéance ne rappelle jamais (`dueDate === null` coupe la décision), et le message notifie le
  montant **restant dû** (`status.remainingMinor`), pas le montant initial — plus juste après un
  remboursement partiel déjà enregistré avant que l'échéance n'arrive.
- **Règle métier « aucun intérêt » appliquée structurellement, pas juste documentée** : ni
  `Debt`/`NewDebt` ni `DebtForm` n'ont de champ taux — il n'existe littéralement rien à calculer.
  Testé négativement (`queryByText(/intérêt/i)` doit être vide) pour que toute régression future qui
  ajouterait un champ taux fasse échouer le test.
- **`DebtsScreen`/`DebtForm`/`DebtDetail`** (nouveaux, calqués sur `VaultsScreen`/`VaultForm`/
  `VaultDetail`) : `DebtForm` est **création uniquement** — aucun critère des trois tâches ne
  demande de modifier/supprimer une dette une fois créée (contrairement aux coffres), donc aucun
  bouton de suppression n'a été ajouté par réflexe. `DebtDetail` propose deux façons d'enregistrer
  un remboursement : « Enregistrer un remboursement » (formulaire, partiel ou total) et
  « Marquer comme soldée » (un seul tap, crée un versement du montant restant exact) — les deux
  passent par le même `createDebtRepayment`, aucun code de statut séparé.
- Ligne de dette : avatar (`Avatar` sur `counterparty`, une personne hors foyer, pas un `Member`),
  date du prêt **et** échéance (ou « Pas d'échéance ») dans le sous-titre, montant **restant dû**
  (pas le montant initial — c'est ce que la vue nette veut faire connaître). Badge « Échéance ce
  mois » calculé en direct (`dueDate.slice(0,7) === monthKey`), jamais stocké.
- **Entrée depuis Profil** (`Famille & fonctionnalités`, à côté de Zakat) — pas d'onglet dédié,
  aucun critère ne le demandait, même choix que Coffres/Zakat déjà en place.
- Nouvel entitlement `debts` (free: false, pro: true), même porte que Transferts/Tontine/Zakat.
- Tests : `computeDebtStatus.test.ts` (10 cas), `debtReminderDecision.test.ts` (7),
  `processDebtReminders.test.ts` (5), `debtRepository.test.ts` étendu (+2, `markDebtReminded`),
  nouveau `debtRepaymentRepository.test.ts` (4), `DebtsScreen.test.tsx` (13),
  `DebtForm.test.tsx` (7), `DebtDetail.test.tsx` (9), `DebtsScreen.rtl.test.tsx` (2),
  `ProfileScreen.test.tsx` étendu (+2, l'entrée de navigation).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1908/1908, 157 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé) — repli sur
  `DebtsScreen.rtl.test.tsx`.

### Itération 56 — Tâches 13.1, 13.4, 13.5 (Foyer & membres) ✅ — 13.2/13.3 restent bloquées

**Audit préalable déterminant** : `MembersScreen`/`MemberForm` existaient déjà en profondeur (rôles
editor/viewer, ajout, édition, suppression avec réaffectation) — et l'écran « Inviter » était déjà
un **stub honnête** : « L'invitation nécessite un compte cloud (synchronisation). Activez-le
d'abord pour inviter. », bouton désactivé, déjà testé. Ce n'est pas une lacune de cette itération :
c'est la même décision déjà prise pour la 4.6 (connexion à un compte existant), documentée dans le
commentaire de `MemberPatch` depuis l'itération 19 : « les rôles n'ont de portée réelle qu'une fois
un compte cloud partagé — c'est US-052 qui doit le faire respecter, une fois l'invitation
multi-appareil en place ».

**🚨 13.2 et 13.3 laissées `done: false` — même blocage que la 4.6, pas une nouvelle limite.**
Le critère central de 13.2 — « quand l'invité accepte, il apparaît dans la liste des membres » —
suppose que deux appareils distincts partagent un jour le même foyer. Sans backend, chaque
installation a sa **propre base SQLite locale et isolée** : un lien généré sur l'appareil A n'a
**littéralement aucun moyen** d'être validé par l'appareil B, qui n'a jamais vu cette base. Ce
n'est pas un problème d'UI à construire plus soigneusement — sans compte cloud partagé (US-039/
US-040, jamais spécifié comme construit dans ce PRD), la fonctionnalité n'a pas de destinataire
possible. Fabriquer un lien qui ne relie en réalité rien serait exactement la fabrication que les
garde-fous interdisent. Le stub existant reste la réponse honnête ; rien n'a été changé ici.

**Ce qui, en revanche, était honnêtement faisable sans backend — et qui n'attendait que d'être
construit :**

- **13.1 (limite de 1 membre en Gratuit)** : `members.max` était encore un chiffre provisoire (2,
  jamais branché sur aucun garde-fou). Passé à **1**, avec la même justification que
  `categories.max: 3` en son temps — désormais fixé par le titre même de la tâche, plus une
  supposition. Le geste réel manquant : **rien ne vérifiait la limite avant d'ouvrir le formulaire
  d'ajout**. `MembersScreen` gagne le même garde que `CategoriesScreen` (7.5) : au-delà de la
  limite, « Ajouter un membre » **et** « Inviter un membre » ouvrent le `PaywallScreen` au lieu de
  leur écran respectif — les deux, pas seulement « inviter », puisque « ajouter » est aujourd'hui
  le seul chemin réellement fonctionnel pour faire grandir le foyer ; gate seulement l'un des deux
  aurait laissé la fonctionnalité payante librement accessible en pratique.
- **Rétrogradation Pro → Gratuit avec plusieurs membres (critère 3)** : nouveau
  `computeMemberAccess` (`src/household/memberRights.ts`, à côté de `canEdit`/`isAdmin` déjà là) —
  les places vont aux membres **les plus anciens** (`createdAt`), jamais à un ordre de tableau ou
  de nom, pour que la personne qui a créé le foyer ne perde jamais l'accès la première. Aucune
  donnée supprimée : un membre hors limite est marqué « Lecture seule (limite du forfait) » dans la
  liste, rien d'autre ne bouge.
- **13.4 (rôles & permissions) — la moitié construisible sans compte, construite ; l'autre moitié
  documentée comme dépendante de 13.2/13.3, pas ignorée.**
  - ✅ Critère 1 (deux rôles proposés) : le libellé du rôle éditeur était « Éditeur », le critère
    écrit dit littéralement « Peut modifier » — renommé dans les 3 langues, sans toucher à la
    valeur stockée (`role: 'editor'` inchangée).
  - ✅ Critère 3 (admin change le rôle / retire un membre à tout moment) : déjà vrai pour le rôle
    (édition existante) ; le retrait est la nouveauté réelle de cette tâche (voir ci-dessous).
  - ✅ Critère 4 (historique préservé) — **écart réel trouvé** : `deleteMember` exigeait une
    réaffectation forcée des transactions vers un autre membre avant de pouvoir supprimer, ce qui
    est l'**inverse** de ce que ce critère demande (garder l'attribution au membre retiré). Nouveau
    **suppression douce** : `members.removed_at` (migration 0026, nullable, `NULL` = actif — même
    principe « une seule source de vérité » que `debts`/Zakat, pas un second statut parallèle) +
    `removeMember` qui ne touche **jamais** `transactions.member_id`. `MemberForm` propose
    désormais « Retirer du foyer » (nouveau, doux) à côté de « Supprimer » (existant, dur avec
    réaffectation) quand le membre a des transactions — les deux restent disponibles, l'admin
    choisit.
  - 🚨 Critère 2 (« actions masquées/désactivées pour un membre en Lecture seule ») — **non
    construit, et non constructible ici** : appliquer ceci exigerait de savoir *qui tient le
    téléphone en ce moment*, un concept de session qui n'existe nulle part dans cette app
    mono-appareil. C'est exactement le blocage déjà documenté pour la tâche 6.9 (« Modification et
    suppression d'une opération »), toujours `done: false` pour la même raison. Pas un nouvel
    écart : le même trou, revu depuis un autre angle.
- **`listMembers` filtre désormais les membres retirés** (tout appelant qui choisit *parmi* les
  membres actifs — nouvelle dépense, versement, règle récurrente — ne doit jamais proposer un
  membre retiré) ; nouveau `listAllMembers` pour les **deux** endroits qui doivent encore résoudre
  le nom d'un membre retiré sur une transaction passée (`TransactionHistoryScreen`,
  `HomeScreen.memberById`) — `HomeScreen` garde `members` (actifs) pour la salutation et
  `allMembers` (tous) séparément pour cette résolution, jamais le même tableau pour les deux.
- **13.5 (liste des membres du foyer)** : la ligne « Famille » de Profil était un `ListRow` plat.
  Remplacée par un aperçu avec avatars empilés (jusqu'à 3, `marginStart` négatif + liseré de la
  couleur de surface pour l'effet de pile) et le nombre de membres ; un indice Pro s'affiche en
  dessous dès que le foyer est à sa limite de plan — vrai sur Gratuit (toujours exactement 1 membre
  par construction de 13.1), pas câblé en dur sur le nom du plan.
- 🐛 **Flake trouvé en cours de route, sans lien avec cette tâche** : `VaultDetail › adds a
  contribution` (interrogeait `getByText('Youssef')` de façon synchrone juste après l'ouverture du
  formulaire) est passé de « juste assez rapide » à intermittent une fois `listMembers` passé par
  un niveau d'indirection supplémentaire (`listAllMembers` + filtre). Même classe de bug que
  l'itération 8 : corrigé en `findByText`, pas contourné.
- Tests : `memberRepository.test.ts` étendu (+5, `removeMember`/`listAllMembers`) ; nouveau
  `household/__tests__/memberRights.test.ts` (11 cas, `computeMemberAccess` inclus) ;
  `MembersScreen.test.tsx` réécrit avec fournisseurs d'entitlements/abonnement (+8 nouveaux cas) ;
  `MemberForm.test.tsx` étendu (+3, le flux « Retirer du foyer ») ; `TransactionHistory.test.tsx`
  (+1, nom d'un membre retiré toujours visible) ; `ProfileScreen.test.tsx` étendu (+6, l'aperçu
  Famille et l'accès aux Dettes de l'itération précédente).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1939/1939, 158 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 57 — Phase 14 complète (Profil, réglages & thèmes) ✅ — 14.1 à 14.6

Beaucoup de cette phase existait déjà en profondeur (Profil, bascule sombre/senior, mode Ramadan) —
le vrai travail était d'auditer chaque critère écrit contre ce qui tournait réellement, plutôt que
de reconstruire à l'aveugle. Deux vrais bugs trouvés, trois lacunes construites, une tâche déjà
entièrement couverte.

- **14.1 (Écran Profil)** — 🐛 **même bug que la 4.5/itération 19, revenu par une autre porte** :
  la carte de profil affichait `members[0]?.name` comme nom du foyer — le PREMIER MEMBRE, pas le
  foyer. La 4.5 avait corrigé exactement ça sur le tableau de bord ; personne n'avait vérifié que
  Profil ne portait pas la même confusion. Corrigé (`households[0]?.name`), plus la devise réelle du
  foyer sur le badge (codée en dur sur `DEFAULT_CURRENCY_CODE` jusque-là — un foyer en EUR voyait
  « MAD »). Ajouts réels : le pays (`findMarket(settings.countryCode)`), un badge Pro
  (`useSubscription().plan.id === PRO_PLAN.id`), et l'entrée « Abonnement » qui devient
  « Passer à Pro » tant que le foyer est Gratuit.
- **14.2 (Changement de langue)** — critères 1 et 2 déjà acquis par l'architecture existante
  (sélecteur déjà fonctionnel ; `LanguageContext` gère déjà le bascule RTL en session, documenté
  depuis une itération antérieure). **Critère 3 (catégories par défaut retraduites, catégories
  personnalisées inchangées) était le vrai manque** : `Category.name` stocke une chaîne littérale,
  pas une clé i18n (choix déjà documenté dans `getDefaultCategories` — renommer une catégorie par
  défaut se comporte comme renommer une catégorie personnalisée). Nouveau
  `resolveCategoryDisplayName(category, language)` : une catégorie par défaut dont le nom actuel
  correspond encore à l'une des 3 traductions connues pour son icône est retraduite en direct ;
  dès qu'elle ne correspond à aucune, elle est laissée intacte pour toujours — seul signal fiable
  vu qu'aucun indicateur « jamais modifié » n'existe. Câblé dans **10 fichiers d'écran** partout où
  un nom de catégorie s'affiche (liste, détail, chips de saisie, historique, notifications) —
  jamais dans le formulaire d'édition (la valeur initiale reste la chaîne brute) ni dans la logique
  de correspondance sur « Autres »/« أخرى » (CategoryForm), qui doivent rester littérales.
- **14.3 (Sélecteur pays & devise)** — n'existait pas du tout comme écran de réglages (seul
  l'onboarding en avait un, non réutilisable). Nouveau `CountrySelectorScreen` : recherche en
  direct (nom, devise ou code pays), regroupement MENA & Golfe / Diaspora via `isMenaGulfMarket`
  déjà établi (10.3), pays actuel mis en évidence en tête avec un montant d'exemple formaté, et
  confirmation explicite avant tout changement de devise — le texte est purement informatif,
  puisque chaque transaction porte déjà sa propre `currencyCode` : rien à migrer, l'historique ne
  peut pas être réécrit par construction. Parcourt tout `MARKETS` (sélectionnables **et**
  annoncés, même logique « visible sans prétendre livrer » que l'onboarding et les packs de
  langue) — un marché annoncé est inerte, badge « Bientôt disponible », aucun `onPress`.
  ⚠️ **Pas de drapeau** : aucun système d'emoji/asset de drapeau n'existe dans le design system ;
  gardé `map-pin` (déjà utilisé partout ailleurs pour un pays) plutôt que d'introduire un élément
  visuel isolé du reste de l'app.
- **14.4 (Mode sombre)** — le bascule manuel existait ; **« l'app peut suivre le réglage système »
  n'existait pas du tout** : `ThemeProvider` ne lisait `useColorScheme()` qu'une fois au montage,
  puis un bascule manuel prenait le dessus pour toujours, sans retour possible à l'auto sans
  redémarrer l'app. Nouveau `colorSchemePreference` (`'light' | 'dark' | 'system'`, distinct du
  `colorScheme` **effectif** déjà consommé partout ailleurs dans le code — aucun appelant existant
  n'a eu à changer). `initialColorScheme` (utilisé par des dizaines de tests pour figer un thème)
  garde exactement son comportement actuel. Profil gagne un choix à 3 (Clair/Sombre/Automatique)
  au lieu d'un bascule à 2.
- **14.5 (Mode senior)** — le bascule global (police, cibles tactiles 56 pt, contrastes) était déjà
  branché depuis la 2.1-2.4 ; **`HomeScreen` n'utilisait `seniorMode` nulle part** — le tableau de
  bord restait toujours complet. Masqué en mode senior : bannière de suggestion Ramadan, chip de
  confiance, promo vocale, raccourci transferts, anneau de répartition, aperçu des objectifs.
  Conservé, comme l'exige le critère : salutation, sélecteur de mois, solde du mois,
  revenus/dépenses, dernières transactions.
- **14.6 (Thème saisonnier)** — presque tout construit à la phase 10 (bascule d'activation,
  identité du tableau de bord, suggestion proactive refusable par année hégirienne). 🐛 **Écart
  réel trouvé** : le bouton « Désactiver » n'existait que dans la carte de récapitulatif, visible
  uniquement une fois le Ramadan **terminé** — impossible de revenir à « Aucun » en cours de saison
  alors que le critère dit explicitement « je peux choisir Aucun ou Ramadan » sans réserve
  temporelle. Déplacé pour être toujours visible tant qu'un thème est actif.
- Tests : `resolveCategoryDisplayName.test.ts` (6), 3 nouveaux cas dans `CategoriesScreen.test.tsx`
  (retraduction bout-en-bout via un vrai rendu d'écran) ; `ThemeContext.test.tsx` (nouveau, 6 cas,
  `useColorScheme` mocké au niveau du module RN feuille pour éviter les modules natifs que le
  preset jest-expo ne résout pas) ; `CountrySelectorScreen.test.tsx` (10) +
  `.rtl.test.tsx` (2), avec la France rendue temporairement sélectionnable **dans le test
  seulement** (`jest.mock` partiel sur `MARKETS`) pour exercer un vrai changement de devise plutôt
  que de se limiter au seul marché MVP réellement sélectionnable ; `HomeSeniorMode.test.tsx`
  (nouveau, 4 cas) ; `RamadanScreen.test.tsx` (+1, désactivation en cours de saison) ;
  `ProfileScreen.test.tsx` étendu (+6) ; `MembersScreen`/`MemberForm` inchangés par cette itération
  mais leurs suites déjà vertes confirment qu'aucune régression n'a traversé les fichiers partagés
  (`Member`, `listMembers`).
- 🐛 **Flake indépendant trouvé en cours de route** : `RecurringRuleForm.test.tsx` ne fournissait
  pas `LanguageProvider` — invisible tant que l'écran n'appelait pas `useLanguage()`, révélé par le
  câblage de 14.2. Corrigé dans le harnais de test, pas dans le composant.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **1980/1980, 163 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé) — repli sur les
  suites `.rtl.test.tsx` comme pour chaque écran précédent.

### Itération 58 — Tâches 15.1, 15.2 (Multi-marchés & conversion) ✅ — phase 15 terminée

- **15.1 (Catégories et modules localisés par marché)** — `getDefaultCategories` proposait déjà un
  ensemble fixe de 9 catégories partout, avec un ajout Tontine/Zakat conditionnel au marché (10.3)
  mais **aucune adaptation pour la diaspora ni le Golfe** : la France n'avait ni « Transfert
  famille » ni de catégorie Zakat, et le Golfe utilisait le même nom d'« École » que le Maroc alors
  que le critère demande « Écoles des enfants ». Réécrit pour dériver la liste du marché
  (`marketHasModule`) : Tontine → ajoute Zakat & dons ; Transferts → ajoute une catégorie de
  transfert dont le libellé dépend du marché (« Transfert famille » en diaspora,
  « Transfert aux proches » au Golfe, puisque le Golfe a *aussi* la tontine et n'est donc pas une
  diaspora au sens strict) ; Golfe (tontine **et** transferts à la fois) → renomme aussi la
  catégorie « École » par défaut en « Écoles des enfants ». Ce dernier point a cassé l'hypothèse de
  `resolveCategoryDisplayName` (14.2) qu'une icône ne porte qu'une seule famille de noms {fr,ar,en}
  — « school » en porte désormais deux selon le marché où la catégorie a été créée. Résolu en
  extrayant un registre `KNOWN_CATEGORY_NAME_VARIANTS` (une famille de noms par variante, pas par
  icône) que `resolveCategoryDisplayName` parcourt pour trouver celle qui contient le nom actuel.
  🐛 **Écart réel trouvé sur le critère « les modules sont reproposés sans supprimer les données
  déjà saisies »** : rien ne recalculait les catégories par défaut d'un foyer après un changement
  de pays sur `CountrySelectorScreen` (14.3) — un foyer qui migre de France vers les Émirats restait
  bloqué avec son ancien jeu de catégories. Nouveau `reconcileMarketCategories(db, language,
  countryCode)` : calcule le jeu par défaut complet du nouveau marché, ne garde que les catégories
  dont l'**icône** n'existe pas déjà parmi les catégories par défaut du foyer, et les ajoute à la
  suite — jamais de renommage ni de suppression d'une catégorie existante, même si son nom
  ressemble à une future catégorie du nouveau marché (ex. France → Émirats : l'icône « avion » de
  « Transfert famille » existe déjà, donc seule « Zakat & dons » est ajoutée). Câblé dans
  `CountrySelectorScreen.handleConfirmChange`, juste après le changement de devise confirmé.
- **15.2 (Conversion vers la devise du pays d'origine, US-064)** — jusqu'ici
  `DEFAULT_ORIGIN_CURRENCY_CODE` était une constante figée à `'MAD'`, avec un commentaire explicite
  disant que la configurer par foyer restait à faire. Nouveau `UserSettings.originCountryCode`
  (migration `0027`, `null` par défaut) et `setOriginCountry(db, code)` — indépendant du
  pays/devise propre du foyer (`countryCode`/`currencyCode`, gérés par `saveLanguageCountry`),
  puisqu'un foyer peut vivre dans un pays et envoyer de l'argent vers un autre. `originMarket()`
  (déjà utilisé par le Dashboard et Transferts) accepte désormais ce code en paramètre optionnel,
  et retombe sur `DEFAULT_ORIGIN_CURRENCY_CODE`/Maroc si non configuré ou inconnu — aucun appelant
  existant n'a dû changer sa signature d'appel sans argument. `TransfersScreen` gagne une rangée de
  puces « Pays d'origine » (tous les marchés sauf celui du foyer) au-dessus du total annuel ; la
  sélectionner appelle `setOriginCountry` et rafraîchit aussitôt la contre-valeur affichée, le
  libellé du taux manuel (qui affichait « MAD » en dur — corrigé en `{{currency}}` interpolé dans
  les 3 langues) et l'aperçu avant enregistrement.
  🐛 **Écart de conception trouvé en cours de route, corrigé avant tout test** : `originAmountMinor`
  est un instantané figé au moment de l'enregistrement (« snapshot, don't recompute », comme les
  évaluations de zakat) — mais la devise dans laquelle il est exprimé n'était **jamais stockée**,
  seulement déduite implicitement de la constante globale. Un foyer changeant son pays d'origine
  après avoir enregistré des transferts aurait vu tout son historique se relabelliser silencieusement
  dans la nouvelle devise. Ajouté `origin_currency_code` (migration `0028`, `NULL` sur les lignes
  existantes — elles étaient bien en MAD, la constante d'alors) comme second instantané à côté
  d'`origin_amount_minor`, rempli à l'enregistrement et jamais recalculé ; l'historique affiche
  `transfer.originCurrencyCode ?? originCurrencyCode` (repli sur la devise courante uniquement pour
  les lignes pré-US-064, par construction toujours en MAD).
  ⚠️ **Limite assumée, non corrigée** : `App.tsx` ne lit `countryCode` qu'une seule fois au
  démarrage pour piloter les onglets visibles (`RootNavigator`) ; changer de pays via
  `CountrySelectorScreen` en cours de session ne rafraîchit pas la barre d'onglets sans redémarrage
  de l'app — même limite déjà documentée et acceptée pour le changement de langue RTL
  (`LanguageContext`). Corriger demanderait de faire remonter l'état par props depuis `App.tsx`
  jusqu'à `ProfileScreen`, hors proportion avec le reste de la tâche ; documenté ici plutôt que
  laissé silencieux.
- Tests : `defaultCategories.test.ts` (+7, dont le test France réécrit — son ancienne assertion
  « France = base Maroc » est devenue un vrai changement de comportement voulu, pas un bug) ;
  `resolveCategoryDisplayName.test.ts` (+3, désambiguïsation des deux familles « school ») ;
  `seedDefaultCategories.test.ts` (+6, `reconcileMarketCategories`) ;
  `CountrySelectorScreen.test.tsx` (+1) ; `userSettingsRepository.test.ts` (+5,
  `setOriginCountry`) ; `markets.test.ts` (+4, `originMarket` avec paramètre) ;
  `diasporaTransferRepository.test.ts` (+1, `origin_currency_code`) ;
  `TransfersScreen.test.tsx` (+7, nouvelle description « devise du pays d'origine ») ;
  `TransfersScreen.rtl.test.tsx` (le nouveau libellé « Pays d'origine » ajouté aux assertions
  fumée LTR/RTL existantes).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2015/2015, 163 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé) — repli sur les
  suites `.rtl.test.tsx` comme pour chaque écran précédent.

### Itération 59 — Tâche 16.1 (Paywall Pro avec tableau comparatif) ✅ — phase 16 amorcée

- `PaywallScreen` existait déjà (bascule d'essai, statut, tableau comparatif basique) — deux écarts
  réels avec les critères d'acceptation US-065 : (1) **aucun rappel « zéro connexion bancaire »**
  sur cet écran précis, alors que le critère l'exige explicitement ici (le rappel existait ailleurs
  — accueil, onboarding — mais pas sur le paywall) ; (2) **aucune ligne du tableau ne pouvait être
  mise en évidence**, alors que `CategoriesScreen`/`MembersScreen` naviguaient déjà vers
  `PaywallScreen` en plein écran au moment précis où une limite est atteinte (`atLimit →
  setView('paywall')`, découvert en explorant le code existant) — le déclencheur existait, mais
  rien n'exploitait cette information une fois sur l'écran.
- Ajouté `TrustChip` (déjà utilisé par l'accueil et l'onboarding) juste sous le sous-titre.
- Nouveau `highlightKey?: PaywallHighlightKey` sur `PaywallScreenProps`, câblé dans
  `CategoriesScreen`/`MembersScreen` (`highlightKey="categories.max"` / `"members.max"`) à leurs
  deux points de déclenchement déjà existants. La ligne correspondante gagne une bordure + fond
  teinté (même convention que la carte « pays actuel » de `CountrySelectorScreen`, 14.3).
- Tableau restructuré pour coller mot à mot aux 6 lignes du critère : fusionné Tontine+Dettes et
  Zakat+Mode Ramadan en deux lignes combinées (`matchKeys: ['tontine','debts']` /
  `['zakat','ramadan']` — `highlightKey` correspond à n'importe laquelle des deux clés d'une ligne
  combinée), et ajouté une ligne « Suivi dépenses & revenus » toujours ✓/✓ puisque c'est un socle
  jamais verrouillé, absent jusqu'ici du tableau alors que le critère le demande en premier.
- Tests : `PaywallScreen.test.tsx` (+6 : rappel bancaire, ligne socle, mise en évidence sur clé
  simple, sur l'une des deux clés d'une ligne combinée, absence de mise en évidence sans
  déclencheur — via un `testID` par ligne et une comparaison `toMatchObject({ borderWidth: 2 })`,
  même convention que `TontineScreen.test.tsx` pour son propre indicateur visuel « tour en cours ») ;
  le test existant du tableau comparatif mis à jour pour chercher « Tontine & dettes » plutôt que
  « Tontine » seul — évolution de comportement voulue, pas une régression.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2020/2020, 163 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 60 — Tâche 16.2 (Intégration mock des achats in-app) ✅

- Rien n'existait encore pour un achat réel — seul l'essai gratuit (`startTrial`) touchait déjà
  `subscriptions`. Nouveau module `src/purchases/` : `products.ts` déclare les deux produits
  (`monthly`/`annual`, US-066a/b) via `fetchAvailableProducts()` **async** pour imiter la forme
  d'un vrai SDK de store (`Purchases.getOfferings()`) sans jamais quitter l'appareil — conforme au
  garde-fou `CLAUDE.md` : aucune vraie clé RevenueCat/App Store/Play, l'achat reste un mock local.
  `mockPurchaseFlow.ts` : `purchasePro(db, productId, outcome?)` déverrouille Pro localement
  (`upsertSubscription({status:'active', productId, renewsAt})`) ; `outcome` (`'cancelled'` /
  `'network_error'`) permet aux tests d'exercer les deux échecs qu'un vrai store peut renvoyer
  (`PurchaseCancelledError`/`PurchaseNetworkError`, typées) sans qu'un appelant en production ait
  jamais à le passer — un mock n'a rien de réel contre quoi échouer tout seul.
  `restorePurchases(db)` relit l'abonnement local et rapporte s'il est toujours valide.
- Nouvelle colonne `subscriptions.product_id` (migration `0029`, `NULL` sur les lignes d'essai)
  pour que l'écran de gestion d'abonnement (16.6) puisse un jour afficher « Abonnement annuel »
  plutôt que juste « Pro ».
- ⚠️ **Limite assumée, documentée honnêtement** : « Restaurer les achats fonctionne sur un nouvel
  appareil » ne peut pas être vérifié à la lettre ici — cette app n'a ni compte ni serveur, donc le
  seul « reçu » qu'un mock local peut jamais retrouver est celui déjà présent dans la base SQLite
  de **cet** appareil. Un vrai transfert d'achat vers un appareil neuf passerait par la sauvegarde
  chiffrée de la Phase 17, pas par ce mock — `restorePurchases` fait honnêtement ce qu'un mock
  sans backend peut faire (relire l'état local et confirmer sa validité), documenté dans le code et
  ici plutôt que présenté comme une vraie restauration multi-appareil.
- ⚠️ **Aucun bouton d'achat câblé pour l'instant** : `purchasePro`/`restorePurchases` sont
  entièrement testés à la couche service, mais aucun écran ne les appelle encore — la tarification
  affichée et les boutons eux-mêmes sont explicitement la tâche 16.3, où le critère « erreurs
  gérées sans crash » sera démontré bout-en-bout (un `try/catch` UI affichant un message plutôt que
  de planter).
- Tests : `purchases/__tests__/products.test.ts` (4), `purchases/__tests__/mockPurchaseFlow.test.ts`
  (11 : succès, durées mensuelle/annuelle, écrasement d'un essai en cours, deux échecs simulés sans
  toucher à l'état, restauration trouvée/absente/expirée) ; `subscriptionRepository.test.ts` (+2,
  round-trip de `productId`).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2040/2040, 165 suites** ✅.

### Itération 61 — Tâche 16.3 (Formules tarifaires sur le paywall) ✅

- Nouveau `src/purchases/pricing.ts` : `priceFor(productId, currencyCode)` convertit le prix
  liste MAD (39/mois, 279/an) via **la même table de taux mock** que l'écran Transferts
  (`convertAmountMinor`), plutôt qu'une grille tarifaire séparée à maintenir en double — repli sur
  le prix MAD si la devise n'est pas couverte, pour ne jamais afficher un prix vide.
  `annualDiscountPercent()` calcule le badge (-40%) à partir des seuls prix MAD de base, en dehors
  de toute devise, pour éviter que l'arrondi par devise fasse dériver le badge d'un marché à
  l'autre.
- `PaywallScreen` gagne une carte « Choisissez votre formule » (visible seulement hors Pro,
  masquée dès l'achat comme le bouton d'essai) : deux options pressables (Mensuel/Annuel),
  l'Annuel pré-sélectionné et badgé, prix formatés via `formatMoney` dans la devise du foyer
  (`listHouseholds(db)[0]?.currencyCode`, même source que `TransfersScreen`/`ProfileScreen` — pas
  la devise « pays d'origine » de la 15.2, qui est un concept diaspora différent). Le bouton
  « S'abonner » appelle `purchasePro` (16.2) puis `refresh()` du contexte d'abonnement ;
  `try/catch` affiche un `AlertBanner` distinct pour l'annulation et l'échec réseau plutôt que de
  laisser planter l'écran — c'est ici que le critère « erreurs gérées sans crash » de la 16.2 est
  enfin démontré bout-en-bout, comme annoncé dans le journal de l'itération précédente.
- 🐛 **Régression détectée et corrigée avant commit** : `MembersScreen.test.tsx` (paywall atteint
  à la limite de membres) ne fournissait pas de `LanguageProvider` — invisible tant que
  `PaywallScreen` n'appelait pas `useLanguage()` (nécessaire ici pour `formatMoney`), révélé par ce
  câblage, même classe de bug que le flake `RecurringRuleForm.test.tsx` de la phase 14.
  `CategoriesScreen.test.tsx` avait déjà ce wrapper et n'a rien montré.
- Tests : `purchases/__tests__/pricing.test.ts` (5) ; `PaywallScreen.test.tsx` (+10 : prix MAD +
  badge, pré-sélection annuelle, bascule mensuel, devise EUR sur marché non-marocain, achat
  annuel/mensuel qui débloque Pro immédiatement, section masquée une fois Pro, message
  d'annulation et d'échec réseau sans plantage — mock ciblé sur `purchasePro` seul via
  `jest.requireActual` pour garder le reste du module réel, `mockClear()` en `beforeEach` pour ne
  pas fausser un `toHaveBeenCalledTimes` inter-tests — et une reprise réussie après échec).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2056/2056, 166 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 62 — Tâche 16.4 (Essai gratuit de 14 jours) ✅

- La logique de fond existait déjà et était déjà testée avant cette itération :
  `resolveActivePlan` (Pro pendant l'essai, repli Gratuit sans perte de données à l'expiration) et
  `trialAlreadyUsed` (`subscriptions` a une ligne dès le premier essai → bouton masqué) — seule la
  **surface UI** manquait pour clore les 5 critères fonctionnels.
- **Repris un travail commencé hors boucle et laissé non committé** : `ProfileScreen.tsx` et les 3
  catalogues portaient déjà `daysRemaining()` + `profileScreen.trialBadge` (jours restants affichés
  à la place du badge « Pro » nu pendant un essai actif) — code correct, juste sans commit ni test.
  Ajouté le test manquant (`ProfileScreen.test.tsx`, essai à 3 jours de la fin → badge « Essai — 3
  jour(s) restant(s) », pas de simple « Pro »).
- 🐛 **Mention « sans engagement, annulable à tout moment » absente du CTA** (1er critère de
  US-067) : `noCardRequiredNote` disait encore « Aucun abonnement payant n'est disponible pour le
  moment » — **faux** depuis 16.2/16.3, qui ont ajouté un vrai flux d'achat mocké. Renommé
  `trialCommitmentNote` avec le texte exigé par le critère (`fr`/`en`/`ar`), et **recadré son
  affichage** sur la seule condition du bouton d'essai (`!isPro && !trialAlreadyUsed`) plutôt que
  sur `!isPro` seul — la mention « sans engagement » n'a de sens qu'à côté du CTA qu'elle qualifie,
  pas après un essai déjà consommé où l'écran affiche désormais un vrai bouton d'achat.
- Tests : `PaywallScreen.test.tsx` (+2 : mention visible à côté du CTA, absente une fois l'essai
  consommé) ; `ProfileScreen.test.tsx` (+1, ci-dessus).
- Les changements non liés (app.json/eas.json/package.json — profil de build `development` +
  `expo-dev-client`) trouvés dans l'arbre de travail au début de cette itération sont **laissés
  tels quels, non committés** : aucun rapport avec US-067, à traiter dans leur propre tâche.
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2059/2059, 166 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

### Itération 63 — Tâche 16.5 (Verrouillage des fonctions Pro / gating) ✅

- **Écart trouvé sur les 5 fonctions Pro (voix, tontine, dettes, zakat, Ramadan)** : aucune ne
  respectait les 2 premiers critères. Chaque écran remplaçait **tout son contenu** par une carte
  d'upsell générique dès `!entitlements.can(clé)` — même quand des données avaient déjà été
  fetchées (`refresh()` tournait quand même), donc **aucune entrée n'était visible avec un
  cadenas** (juste une carte plate au clic) et **rien n'ouvrait jamais le vrai `PaywallScreen`**
  (`highlightKey` existait déjà côté `PaywallScreen` mais n'était appelé nulle part).
- **Règle retenue pour concilier les critères 2 et 4** (« tape une fonction verrouillée → paywall »
  vs « abonnement expiré → données lisibles ») : *une fonction sans aucune donnée existante est
  strictement verrouillée → paywall immédiat ; une fonction avec des données déjà créées pendant
  Pro reste pleinement visible, seule la création d'une **nouvelle** entité redirige vers le
  paywall.* Gérer/faire évoluer une entité déjà existante (encaisser un remboursement, cocher un
  paiement de tontine, marquer une Zakat payée, désactiver une saison) reste possible — bloquer
  cela aurait pénalisé un usage réel déjà engagé sans rapport avec « créer du contenu Pro », et
  rien dans le critère ne l'exige à la lettre.
- **Effet de bord agréable** : pour Tontine et Ramadan, cette règle ne demandait **aucune garde
  supplémentaire** — la « création d'une nouvelle entité » est déjà structurellement isolée dans
  une branche (`!group` / `!activeTheme`) inatteignable dès qu'une entité existe. Il a suffi de
  réordonner le calcul (`group`/`activeTheme` avant la porte d'entitlement) et de remplacer la
  carte d'upsell par `<PaywallScreen highlightKey=... />` quand la donnée est absente. Debts et
  Zakat, eux, avaient leur bouton de création **dans la même vue** que la liste en lecture seule —
  un garde explicite (`openAddDebt`, `setShowPaywall`) a donc été nécessaire sur ce seul point
  d'entrée.
- **Voix n'a pas de branche lecture seule** : contrairement aux 4 autres, elle ne produit aucune
  donnée persistée qui lui soit propre (les transactions créées ne sont jamais gate-ées) — le
  panneau ouvre directement `<PaywallScreen highlightKey="voice" />` dès `!can('voice')`, sans
  condition.
- **Cadenas visible aux points d'entrée (1er critère)** : ajouté sans nouveau composant générique,
  en réutilisant les emplacements déjà prévus par le design system —
  - `ProfileScreen` : `Icon name="lock"` dans le slot `trailing` déjà supporté par `ListRow`
    (Zakat, Ramadan, Dettes).
  - `FloatingTabBar` : petit badge cadenas en surimpression sur l'icône Tontine
    (`position: 'absolute'`, `end: -6` — propriété logique, se retourne seule en RTL).
  - `VoicePromoCard` (accueil) : nouvelle prop `locked?` qui badge la pastille micro d'un petit
    rond doré + cadenas, sans toucher au badge `NOUVEAU` existant (sémantique différente, gardée
    séparée) ; le bouton micro de l'état vide échange simplement son icône `mic` → `lock`.
  - Toutes ces icônes portent un `accessibilityLabel` (`a11y.proLocked`, nouvelle clé i18n ×3) —
    l'icône `Icon` ne s'expose aux lecteurs d'écran que si elle en a un (règle posée en 2.5), donc
    un cadenas muet aurait été invisible en lecture vocale.
- **3e critère (« les verrous disparaissent au plus tard à la reprise de l'app »)** : trouvé un
  vrai trou pendant l'exploration — `SubscriptionContext` ne relisait la souscription qu'au montage
  et après un achat/essai, jamais au retour au premier plan. Un essai qui expire pendant que l'app
  reste ouverte en arrière-plan restait Pro indéfiniment tant que l'app n'était pas relancée.
  Ajouté un `AppState.addEventListener('change', ...)` qui rappelle `refresh()` sur `'active'`.
  Testé en isolant un vrai piège de test : `AppState.addEventListener` est un mock partagé entre
  tous les tests du fichier (jamais reset), donc `.find()` sur ses appels récupérait le listener
  d'un test **précédent** au lieu de celui du rendu courant — `.filter(...).at(-1)` corrige.
  Timers fictifs (`jest.useFakeTimers`) écartés au profit d'un vrai petit délai (40 ms) : le
  `waitFor`/`findBy*` de RNTL sonde sur de vrais timers, que les fake timers gèlent.
- **4e critère (données lisibles après expiration), testé par mutation réelle** : chaque écran a un
  test qui seed une entité **avant** le rendu, rend en plan Gratuit, et vérifie qu'elle est visible
  **et** que créer une nouvelle entité redirige vers le paywall (`TontineScreen`, `DebtsScreen`,
  `ZakatScreen`, `RamadanScreen`).
- 🐛 **Regressions découvertes en cascade** : `VoiceEntrySheet`, `TontineScreen`, `DebtsScreen`,
  `ZakatScreen`, `RamadanScreen` embarquent maintenant `PaywallScreen`, qui lit `useSubscription()`
  — 7 fichiers de test (`VoiceEntrySheet`, `TontineScreen`, `DebtsScreen`, `ZakatScreen`,
  `RamadanScreen`, `HomeRamadan`, `HomeVoicePromo`, `HomeEmptyState`) rendaient ces écrans **sans**
  `SubscriptionProvider` dans leur wrapper — jamais nécessaire avant que `PaywallScreen` n'y
  apparaisse. Ajouté partout, plus la mise à jour des anciennes assertions qui cherchaient encore
  le texte de l'upsell générique disparu (`voiceCapture.upsellMessage`, etc.) au profit du nouveau
  comportement (`paywallScreen.title` + ligne mise en évidence).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2066/2066, 166 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé) — le nouveau
  badge cadenas utilise exclusivement des propriétés logiques (`end`, jamais `right`), cohérent
  avec la garde `noHardcodedColors`/RTL déjà en place ailleurs.

### Itération 64 — Tâche 16.6 (Gestion de l'abonnement) ✅ — phase 16 close (6/6)

- **`resolveActivePlan` avait un vrai trou pour `status: 'active'`** : il retournait Pro
  indéfiniment sans jamais comparer `renewsAt` à l'heure courante — correct pour un abonnement qui
  se renouvelle tout seul, mais aucun état ne modélisait « résilié, mais encore payé jusqu'à telle
  date » (2e critère). Nouveau statut **`cancelled`** dans `SubscriptionStatus` : même forme que
  `trial` (Pro tant que sa date n'est pas dépassée), mais indexé sur `renewsAt` au lieu de
  `trialEndsAt`.
- **`cancelSubscription(db)`** (nouveau, `src/purchases/mockPurchaseFlow.ts`) : ne fait que changer
  `status → 'cancelled'`, **conserve `renewsAt` tel quel** — rien n'est remboursé ni révoqué,
  exactement le comportement d'un vrai « gérer l'abonnement → annuler » d'App Store/Play. No-op
  défensif si rien n'est actif à résilier (le bouton n'est de toute façon proposé que dans ce cas).
  Aucun chemin de retour explicite (« reprendre l'abonnement ») n'a été ajouté : une fois
  `renewsAt` dépassé, `resolveActivePlan` repasse en Gratuit et la carte tarifaire reparaît
  naturellement — inutile de dupliquer ce chemin.
- **`PaywallScreen` gagne 2 blocs**, tous deux lisibles dès l'écran « Abonnement » du profil
  (déjà routé vers `PaywallScreen`, aucun nouveau point d'entrée nécessaire pour le 1er critère) :
  - **Carte « Gérer mon abonnement »** (visible seulement pour un vrai achat, essai exclu) : formule
    (mensuel/annuel), date de renouvellement, bouton Résilier — remplacé par une bannière
    « Résilié — reste actif jusqu'au {date} » une fois fait.
  - **Bouton « Restaurer les achats »**, dans la carte de statut, **toujours visible** (Gratuit,
    essai ou Pro) — le critère vise un changement d'appareil, où l'utilisateur ne sait justement
    pas encore dans quel état il est. `restorePurchases` (16.2) n'était jusqu'ici câblé à aucun
    bouton ; message de confirmation ou « aucun achat trouvé » selon le résultat.
- ⚠️ **Limite déjà documentée en 16.2, reconfirmée ici** : « restaurer » ne peut relire que la ligne
  SQLite déjà présente sur **cet** appareil — un vrai transfert vers un appareil neuf attendra la
  sauvegarde chiffrée de la Phase 17.
- Tests : `resolveActivePlan.test.ts` (+3, le nouveau statut `cancelled`) ; `mockPurchaseFlow.test.ts`
  (+4, `cancelSubscription`) ; `PaywallScreen.test.tsx` (+4 : plan + date affichés, résiliation qui
  garde Pro actif sans faire réapparaître la carte tarifaire, restauration trouvée/absente).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2077/2077, 166 suites** ✅.
- ⚠️ Vérification navigateur LTR/RTL non effectuée (blocage `dev-browser` inchangé).

**Phase 16 (Monétisation freemium) close : 6/6 tâches `done: true`.**

### Itération 65 — Tâche 17.1 (Garantie « aucune connexion bancaire ») ✅ — phase 17 amorcée

- **Bonne surprise à l'exploration : les 3 critères fonctionnels étaient déjà vrais**, construits
  incidemment par des tâches antérieures, mais **aucun test dédié ne les figeait** pour cette US
  précise — le PRD exige « tests unitaires couvrant les critères », pas juste qu'ils soient vrais
  par accident.
  - 2e critère (rappel à chaque étape clé) : `welcome.noBankBadge` (4.1), `privacy.commitmentBankTitle/Body`
    (4.4), `home.disclaimer` (Dashboard), `paywallScreen.noBankBadge` (16.1) — les 4 écrans nommés
    par le critère ont déjà, **chacun**, un test de rendu qui les épingle (`WelcomeScreen.test.tsx`,
    `PrivacyScreen.test.tsx`, `HomeScreen.rtl.test.tsx`/`HomeSeniorMode.test.tsx`,
    `PaywallScreen.test.tsx`). Rien à ajouter ici.
  - 1er critère (aucun champ ne demande RIB/carte/identifiants bancaires) : `grep` exhaustif sur
    `src/i18n/locales` et `src/screens` → seulement 2 occurrences, toutes deux des **négations**
    (« Aucune carte bancaire requise… », « … ne demande jamais de RIB, de carte ni d'identifiants
    bancaires »), aucun champ `TextField` ne réclame quoi que ce soit de tel.
- **Nouveau, ce qui manquait vraiment** : rien ne empêchait une régression future sur ces 3
  critères. Nouveau `src/security/__tests__/noBankIntegration.test.ts`, deux gardes :
  - **Dépendance interdite** : `package.json` (`dependencies`/`devDependencies`) scanné contre une
    liste de SDK d'agrégation bancaire connus (Plaid, Tink, Salt Edge, Budget Insight/Powens,
    Bridge API, TrueLayer, Yapily, Linxo, Nordigen/GoCardless, Finicity…). C'est la traduction
    mécanique du 3e critère (« une future intégration tierce ne peut pas contredire cette promesse
    sans opt-in explicite et documenté ») : ajouter une telle dépendance ferait échouer ce test
    immédiatement, forçant une modification **délibérée** de la liste plutôt qu'un `npm install`
    silencieux. Complète (sans le dupliquer) le garde réseau de `offlineStorage.test.ts` (1.7/US-070)
    déjà en place — celui-là interdit l'appel réseau lui-même (`fetch`/`XHR`/`WebSocket`…), celui-ci
    interdit la dépendance qui le porterait.
  - **Liste noire de formulations « demande »** (pas une interdiction de mot nu — « carte bancaire »
    apparaît légitimement dans `trialCommitmentNote`) : motifs comme « Entrez votre RIB/IBAN »,
    « Numéro de carte bancaire », « Code CVV », vérifiés sur les **3 catalogues** (valeurs
    aplaties récursivement, pas seulement les clés de premier niveau).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2081/2081, 167 suites** ✅.

### Itération 66 — Tâche 17.2 (Chiffrement et export de la sauvegarde) ✅

- 🚨 **Conflit d'architecture trouvé avant d'écrire du code** : les critères de US-071a parlent
  d'« envoi » et de « sauvegardes distantes » à supprimer — or `offlineStorage.test.ts` (1.7/US-070)
  interdit déjà tout `fetch`/`XHR`/`WebSocket` dans **tout** `src/`, et `CLAUDE.md` décrit la stack
  comme « aucune donnée n'est envoyée à un serveur ». Un vrai service cloud contredirait les deux.
  Présenté le choix à l'utilisateur (mock local façon achat in-app / laisser `done:false` / autre) →
  **décision : export/import manuel de fichier chiffré, sans notion de « distant »** — l'utilisateur
  choisit où garder le fichier (clé USB, son propre cloud…), l'app n'envoie jamais rien elle-même.
- **Nouveau module `src/backup/`**, chaque brique testée isolément :
  - `backupCrypto.ts` — AES-256-CBC (`crypto-js`, nouvelle dépendance) avec IV aléatoire à chaque
    appel, clé dérivée par **PBKDF2-SHA256** (`deriveBackupKey`) à partir d'une phrase de
    récupération + sel. 10 000 itérations (pas 100k/OWASP) : compromis délibéré pour rester
    utilisable sur un export ponctuel sans ralentir la suite de tests à l'excès — documenté dans
    le code.
  - `backupSettings.ts` — même schéma que `appLockSettings.ts` (secteur déjà éprouvé) : sel + hash
    de vérification stockés via `secureStoreClient`, **jamais la phrase elle-même**. Volontairement
    **aucune récupération possible** si la phrase est perdue — contrairement au PIN (un simple
    verrou d'accès), c'est un vrai chiffrement ; un accès de secours en annulerait l'intérêt (le
    commentaire de `pinHash.ts`, déjà présent avant cette tâche, l'annonçait explicitement).
  - `backupPayload.ts` — `buildBackupPayload` : foyer, transactions, catégories, objectifs (US-071b
    le nomme), **plus `members`** — non cité par le critère mais structurellement nécessaire
    (`Transaction.memberId` y fait référence). Tontine/dettes/zakat/réglages/abonnement **hors
    périmètre**, assumé et documenté — une extension naturelle, pas tentée ici.
  - `backupFileClient.ts` — fine enveloppe sur `expo-file-system`/`expo-sharing` (2 nouvelles
    dépendances SDK 54, plus `expo-document-picker` pour la tâche 17.3 à venir), même convention de
    testabilité que `secureStoreClient`/`biometricClient` : jamais appelée en clair dans un test,
    toujours mockée en bloc.
  - `exportBackup.ts` — orchestration : vérifie la clé, construit le payload, chiffre, écrit
    localement (sandbox de l'app — pas un vrai « distant », juste une copie de travail), ouvre la
    feuille de partage OS, horodate le succès.
- **`SecurityScreen`** gagne une carte « Sauvegarde chiffrée » : activation avec confirmation de la
  phrase + avertissement « non récupérable », export (re-saisie de la phrase, ne jamais la garder
  en mémoire au-delà de l'appel), date de dernière sauvegarde, désactivation.
- 🐛 **Trouvé et corrigé avant tout commit — vrai oubli, pas un test qui ment** : le bouton
  « Désactiver » n'appelait que `disableBackup()` (efface la clé), jamais
  `backupFileClient.deleteLocalBackup()` — le 3e critère (« la désactivation supprime les
  sauvegardes ») restait donc à moitié fait. Corrigé, testé.
- **Textes devenus faux, corrigés en cascade** : `securityScreen.forgotPinNote` et
  `storage.uninstallWarning` affirmaient tous deux « aucune sauvegarde n'existe » — plus vrai. Les
  deux mentionnent maintenant l'export chiffré comme échappatoire, dans les 3 langues.
- 🐛 **Deux pièges de mock Jest, tous deux dans les tests, pas dans le code produit** :
  - Assigner une fonction mockée **directement** comme valeur dans une factory `jest.mock()`
    (`writeLocalBackup: mockWriteLocalBackup`) échoue avec « is not a function » — il faut
    l'indirection `(x) => mockWriteLocalBackup(x)` pour ne lire la variable qu'à l'appel, pas à la
    définition de la factory (même motif que `mockPurchasePro` dans `PaywallScreen.test.tsx`).
  - `getDatabase()` n'était pas mocké dans `SecurityScreen.test.tsx` : il tentait d'ouvrir une
    vraie base SQLite (indisponible sous Jest), l'erreur résultante masquait complètement le test
    du bon chemin d'erreur (`WrongRecoveryKeyError` vs `BackupNotEnabledError`) — le export mocké
    n'était jamais atteint. Un simple `getDatabase: () => ({})` a suffi, puisque `exportBackup`
    lui-même est mocké et ne touche jamais à cet objet.
- Tests : `backupCrypto.test.ts` (7), `backupSettings.test.ts` (7), `backupPayload.test.ts` (2),
  `exportBackup.test.ts` (3), `SecurityScreen.test.tsx` (+10).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2116/2116, 171 suites** ✅.
- ⚠️ Vérification navigateur non effectuée (blocage `dev-browser` inchangé) ; de toute façon,
  `expo-file-system`/`expo-sharing` (partage OS) ne peuvent pas être exercés dans un navigateur.

### Itération 67 — Tâche 17.3 (Restauration d'une sauvegarde) ✅ — phase 17 close (3/3)

- 🚨 **Conflit d'architecture trouvé avant d'écrire du code, distinct de celui de 17.2** : le
  critère « restauration sur un appareil vierge » suppose une base de données vide — mais
  `App.tsx` redirige vers l'onboarding dès qu'aucun foyer n'existe, et l'onboarding **crée
  toujours un foyer de démarrage** avant qu'aucun écran (donc aucun bouton « Restaurer ») ne soit
  atteignable. Un appareil littéralement vierge n'a **jamais** de base vide au moment où la
  restauration devient possible — **décision : la restauration remplace les données existantes**
  (foyer, membres, catégories, transactions, objectifs — exactement ce que ce module gère, rien
  d'autre) plutôt que d'exiger une base vide. Testé dans les deux sens : sur une base réellement
  vide (le scénario nommé par le critère) et sur une base contenant déjà le foyer de démarrage
  d'un onboarding frais (le scénario réel).
  - Garde-fou : la purge (`wipeManagedData`) n'a lieu **qu'après** un déchiffrement réussi — une
    mauvaise clé de récupération ne doit jamais effacer ce qui existait déjà sur l'appareil.
- **`restoreBackup.ts`** : déchiffre, purge, puis réinsère foyer → membres → catégories →
  transactions → objectifs → versements, dans cet ordre de dépendance, avec une table de
  correspondance ancien-id → nouvel-id à chaque étape (aucun `create*` du dépôt n'accepte d'id
  explicite, et ça n'était pas nécessaire : rien en dehors du fichier de sauvegarde ne référence
  les anciens ids). Un membre « retiré » (`removedAt` non nul) est recréé actif puis retiré avec
  **la même date d'origine**, pour ne pas réécrire l'historique.
- **« Authentification » (1er critère) sans notion de compte** : cette app n'a ni compte ni
  connexion. Solution retenue : si un verrou d'app (PIN/biométrie) est déjà configuré sur
  l'appareil, il est exigé avant la restauration ; sur un appareil vraiment vierge (aucun verrou
  configuré), la clé de récupération elle-même — de toute façon nécessaire pour déchiffrer — tient
  lieu d'authentification. Documenté explicitement dans le code, pas juste supposé.
- **Après une restauration réussie, l'app se recharge entièrement** (`appReloadClient`, nouvelle
  fine enveloppe sur `expo-updates`, déjà une dépendance) plutôt que de rafraîchir chaque contexte
  à la main — `App.tsx` relit foyer/réglages au démarrage, donc un rechargement complet est le
  chemin le plus sûr pour que tout l'app reflète les données restaurées. Repli : si `reloadAsync`
  n'est pas supporté (ex. Expo Go), un message invite à redémarrer l'app manuellement plutôt que de
  planter.
- **Erreurs typées partagées entre export et import** : `WrongRecoveryKeyError`/
  `BackupNotEnabledError` déplacées dans `backupErrors.ts` (nouveau) pour être réutilisées sans
  import croisé entre `exportBackup.ts` et `restoreBackup.ts` ; `InvalidBackupFileError` ajoutée
  pour un fichier qui n'est simplement pas une sauvegarde Mizaniyati (JSON invalide ou mauvaise
  forme) — distinct d'une mauvaise clé, qui produit un déchiffrement qui échoue plutôt qu'un JSON
  mal formé dès le départ.
- **2e critère (date de dernière sauvegarde affichée) : déjà livré en 17.2** — rien à ajouter ici.
- **`backupFileClient.pickBackupFile`** (nouveau, `expo-document-picker`) : ouvre le sélecteur de
  fichiers OS, lit le contenu texte du fichier choisi ; `null` si annulé, propagé proprement
  jusqu'à l'UI (aucune action, pas d'erreur affichée pour une simple annulation).
- ⚠️ **Note pour l'avenir, non traitée ici** : la tâche 4.6 (« Connexion à un compte existant »)
  avait été laissée `done: false` à l'itération 20, explicitement bloquée par « des dépendances de
  phase 17 ». Cette phase est maintenant close — 4.6 pourrait être reconsidérée dans une itération
  future en s'appuyant sur ce module de restauration, mais ce n'est pas la tâche courante et rien
  n'a été changé sur 4.6 ici.
- Tests : `restoreBackup.test.ts` (6, dont le test d'intégration nommé par le critère : appareil
  réellement vierge → foyer/membres/catégories/transactions/objectifs reconstitués avec les bons
  ids remappés) ; `SecurityScreen.test.tsx` (+8 : bouton toujours offert même sauvegarde jamais
  activée sur cet appareil, pas de PIN demandé si aucun verrou, restauration + rechargement,
  annulation du sélecteur, mauvaise clé, fichier invalide, PIN requis et vérifié).
- `npm run typecheck` ✅, `npm run lint` ✅, `npx jest` : **2133/2133, 172 suites** ✅.
- ⚠️ Vérification navigateur non effectuée (blocage `dev-browser` inchangé ; de toute façon,
  `expo-document-picker`/`expo-updates` ne peuvent pas être exercés dans un navigateur).

**Phase 17 (Confidentialité & sauvegarde) close : 3/3 tâches `done: true`.**

## Notes / blocages connus (hors périmètre Phase 1)

- L'arbre de travail contient des changements accumulés multi-phases non
  committés (écrans/db/composants d'autres phases). Ils sont laissés à leurs
  phases respectives.
- ~~Échecs de tests pré-existants dans des features de phases ultérieures~~ →
  **résolus à l'itération 8**. Diagnostic initial erroné : notés ici comme « de
  vrais échecs fonctionnels », c'étaient en fait des assertions synchrones sur des
  écrans asynchrones. Aucun bug produit.
- **Vérification navigateur (LTR/RTL) non effectuée** : la skill `dev-browser`
  demandée par les critères d'acceptation n'est pas disponible dans cet
  environnement et aucun outil de pilotage de navigateur n'y est exposé. La
  couverture RTL repose donc sur les tests de rendu sous les deux directions
  (`components.rtl.test.tsx`, `RootNavigator.rtl.test.tsx`, `shellStrings`,
  `HomeScreen.rtl`). À refaire manuellement via `npm run web`.
  - ⚠️ **Tentative faite le 2026-07-21, `npm run web` ne rend rien dans ce sandbox — diagnostic
    complet, cause identifiée, pas un simple « outil manquant » cette fois.** Playwright (via
    npx) + un reverse-proxy maison (pour les en-têtes COOP/COEP) ont permis de contourner deux
    obstacles d'environnement (Watchman refuse le crawl avec `EPERM`, `SharedArrayBuffer`
    indisponible sans isolation cross-origin réelle) — mais la page reste blanche : `getDatabase()`
    (`src/db/client.ts`) appelle `SQLite.openDatabaseSync(...)`, qui sur web tourne dans un worker
    séparé (wa-sqlite/WASM) et communique en synchrone via `Atomics.wait` avec un budget fixe
    d'environ 1 000 000 cycles CPU (`node_modules/expo-sqlite/web/WorkerChannel.ts:96-138`). Dans ce
    sandbox, l'initialisation du worker (compilation WASM + `AccessHandlePoolVFS.isReady()` qui crée
    plusieurs handles OPFS, `node_modules/expo-sqlite/web/wa-sqlite/AccessHandlePoolVFS.js:218-231`)
    dépasse systématiquement ce budget → `Error: Sync operation timeout`, avant même le premier
    rendu. Vérifié que ce n'est **pas** un souci d'isolation (`crossOriginIsolated: true` confirmé)
    ni d'OPFS lui-même (un test isolé `createSyncAccessHandle` dans un worker nu réussit
    instantanément) ni un flake à froid (échoue identiquement après deux rechargements complets,
    le cache de compilation WASM aurait dû aider sinon). C'est une fragilité réelle de
    l'implémentation web d'`expo-sqlite` sur ce CPU virtualisé/sandboxé précis — indépendante de
    tout code de cette session, et qui n'affecte que la cible web (jamais exercée par un vrai
    utilisateur mobile, où `openDatabaseSync` est du SQLite natif instantané, pas un worker WASM).
    Aucun changement de code laissé en place (le contournement Watchman/COOP-COEP était dans
    `metro.config.js`, entièrement annulé après coup — `git status` propre).
  - Deux erreurs mineures notées au passage, non creusées (masquées par le blocage ci-dessus avant
    même d'avoir un effet visible) : `ExpoSecureStore.default.getValueWithKeyAsync is not a
    function` (le shim web d'`expo-secure-store` n'implémente pas cette méthode) et
    `[expo-notifications] Listening to push token changes is not yet fully supported on web`
    (avertissement documenté par le paquet lui-même).
  - Pour retenter : soit accepter le risque et relancer plusieurs fois (le budget de cycles CPU
    n'est pas garanti, un CPU hôte plus rapide pourrait passer), soit — si la vérification web
    devient un besoin récurrent — envisager un changement de code assumé (`openDatabaseAsync` sur
    web spécifiquement dans `src/db/client.ts`, une vraie décision produit, pas tentée ici).

## État final de la boucle — 81/87 tâches `done: true`

Après clôture des phases 16 et 17 (itérations 59-67), les 6 tâches restantes ont
été réexaminées une à une. Aucune n'est un oubli : chacune retombe sur l'un des
deux mêmes obstacles, déjà présentés à l'utilisateur, qui a tranché explicitement
le 2026-07-21 de les laisser ouvertes plutôt que de les forcer :

| Tâche | Blocage racine | Décision |
| --- | --- | --- |
| 1.7 | `expo-sqlite` n'expose aucune clé de chiffrement (pas de SQLCipher natif) | **Laissé `done: false`** — l'utilisateur a explicitement refusé le repli « chiffrement OS » (qui aurait clos la tâche sans changement de code) et refusé la migration op-sqlite+SQLCipher (gros chantier, touche toute la couche `src/db`). |
| 3.1 | `CLAUDE.md`/le PRD nomment expo-router ; l'app utilise React Navigation (fonctionnellement équivalent, déjà livré partout) | **Laissé `done: false`** — l'utilisateur a explicitement refusé de corriger le critère pour refléter la stack réelle (aucun risque, aurait clos la tâche) et refusé la migration vers expo-router (gros chantier, aucun bénéfice utilisateur visible). |
| 4.6 | Exige des « identifiants » et « un compte » — une vraie authentification multi-appareils | **Infaisable dans ce projet** : construire un backend contredirait le garde-fou central « aucune donnée n'est envoyée à un serveur ». La sauvegarde manuelle chiffrée (17.2/17.3) couvre le changement d'appareil *volontaire* avec un fichier, mais pas la reconnexion par identifiants qu'exige littéralement le critère. |
| 6.9 | 3/4 critères livrés et testés (modifier, confirmation + Annuler 5 s, recalcul du solde) ; le 4e exige un statut « Lecture seule » **appliqué à la personne qui tient le téléphone en ce moment** — et rien dans l'app n'identifie qui c'est, sur un MVP mono-appareil sans session | **Infaisable sans le même backend que 4.6/13.2/13.3** — déjà documenté à l'itération 38, revu et reconfirmé à l'itération de la tâche 13.4 (US-052) qui a heurté exactement le même mur. Inventer un sélecteur « agir en tant que » local donnerait une fausse impression de contrôle d'accès sans rien protéger réellement (personne d'autre ne peut physiquement toucher l'app sans le téléphone) — délibérément écarté aux deux itérations précédentes, pas reconsidéré ici. |
| 13.2 | Lien d'invitation utilisable une seule fois, avec expiration, **par un autre appareil** | **Infaisable dans ce projet** — nécessite un serveur pour qu'un deuxième appareil apprenne qu'un lien a été utilisé. Même contradiction qu'en 4.6 avec le garde-fou « zéro serveur ». |
| 13.3 | Écran d'invitation dont l'envoi/l'acceptation dépend de 13.2 | **Infaisable dans ce projet**, pour la même raison que 13.2. `memberInvite.cloudRequiredMessage`/`enableCloudButton` existent déjà dans les 3 catalogues i18n comme message d'attente honnête plutôt que comme un flux qui ne mènerait nulle part. |

**Conclusion** : avec ces 6 tâches tranchées comme `done: false` en connaissance de
cause, la boucle Ralph a atteint son plafond dans les contraintes du projet — le
critère de fin de `CLAUDE.md` (« Quand toutes les tâches ... sont done: true »)
n'est pas rempli, et la phrase `<promise>SAHTI_FRONTEND_COMPLETE</promise>` ne
doit donc **pas** être écrite. Toute nouvelle tâche exécutable sans backend ni
changement de stack déjà refusé a été traitée ; ce qui reste exige soit un vrai
serveur (hors du périmètre « frontend, 100% local » du projet), soit de revenir
sur une décision déjà prise explicitement par l'utilisateur.
