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

## État des tâches Phase 2 (Design system & accessibilité)

| Tâche | Titre | Statut |
| --- | --- | --- |
| 2.1 | Design tokens et palette | ✅ done |
| 2.2 | Composants de base : Header, Bouton, Tag, Card | ⏳ |
| 2.3 | Composants financiers : Montant, Progression, Anneau, Ligne, Avatar | ⏳ |
| 2.4 | Contraste et mise à l'échelle des textes | ⏳ |
| 2.5 | Libellés pour lecteurs d'écran | ⏳ |

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
