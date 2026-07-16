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

## État des tâches Phase 5 (Dashboard — Solde du mois)

| Tâche | Titre | Statut |
| --- | --- | --- |
| 5.1 | Hero solde du mois restant | ✅ done |
| 5.2 | Sélecteur de mois | ✅ done |
| 5.3 | Anneau de répartition par catégorie | ✅ done |
| 5.4 | Dernières transactions | ✅ done |
| 5.5 | État vide du dashboard | ✅ done |
| 5.6 | Chip de confiance « saisie manuelle » | ✅ done |
| 5.7 | Aperçu des objectifs | ⏳ |
| 5.8 | Bandeau de découverte vocale | ⏳ |

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
