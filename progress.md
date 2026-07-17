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

## État des tâches Phase 9 (Tontine / daret) — 1/5

| Tâche | Titre | Statut |
| --- | --- | --- |
| 9.1 | Vue d'ensemble d'une tontine (daret) | ✅ done |
| 9.2 | Création et paramétrage d'une tontine | ⬜ à faire |
| 9.3 | Mise en avant de mon tour | ⬜ à faire |
| 9.4 | Suivi des paiements du tour en cours | ⬜ à faire |
| 9.5 | Calendrier des tours | ⬜ à faire |

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
