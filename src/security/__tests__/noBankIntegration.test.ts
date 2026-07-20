import { readFileSync } from 'fs';
import { join } from 'path';

import { ar } from '../../i18n/locales/ar';
import { en } from '../../i18n/locales/en';
import { fr } from '../../i18n/locales/fr';

const REPO_ROOT = join(__dirname, '..', '..', '..');

/**
 * US-072's 3rd criterion — "une future intégration tierce ne peut pas contredire cette promesse
 * sans opt-in explicite et documenté". A real bank/aggregator integration always ships as a named
 * SDK dependency before it ever calls out (which `offlineStorage.test.ts`'s network-API scan
 * already forbids outright, US-070's mechanical half of the same guardrail) — this list is the
 * *explicit, documented* checkpoint: adding one of these packages to `package.json` is exactly the
 * "opt-in" the criterion describes, and it must be a deliberate edit to this test, not a silent
 * `npm install`.
 */
describe('no banking/aggregator SDK dependency (US-072)', () => {
  const BANNED_PACKAGE_PATTERNS = [
    /plaid/i,
    /\btink\b/i,
    /salt-?edge/i,
    /budget-?insight/i,
    /\bpowens\b/i,
    /bridgeapi/i,
    /truelayer/i,
    /\byapily\b/i,
    /\blinxo\b/i,
    /nordigen/i,
    /gocardless/i,
    /\bfinicity\b/i,
    /\bmx\b.*bank/i,
  ];

  it('lists no banking-aggregator SDK in dependencies or devDependencies', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];

    for (const name of names) {
      for (const pattern of BANNED_PACKAGE_PATTERNS) {
        expect(name).not.toMatch(pattern);
      }
    }
  });
});

/**
 * US-072's 1st criterion — "aucun écran ne demande d'identifiants bancaires, de RIB ou de carte
 * hors tunnel d'abonnement de la plateforme". A curated blocklist of *request*-shaped phrases (not
 * a bare word ban — "carte bancaire" legitimately appears in the trial's own no-card-required
 * copy, `paywallScreen.trialCommitmentNote`) across all three catalogs, so a future field asking
 * for one of these can't ship without this test catching it.
 */
describe('no banking-credential request copy in any catalog (US-072)', () => {
  const REQUEST_PHRASES_BY_LOCALE: Record<string, RegExp[]> = {
    fr: [
      /entrez votre (rib|iban)/i,
      /num[ée]ro de (compte bancaire|carte bancaire)/i,
      /code cvv/i,
      /identifiants? bancaires? (requis|obligatoire)/i,
    ],
    en: [/enter your (iban|bank account)/i, /card number/i, /cvv code/i, /bank(ing)? credentials? required/i],
    ar: [/رقم (الحساب البنكي|البطاقة)/i, /رمز cvv/i],
  };

  function flattenValues(node: unknown, out: string[] = []): string[] {
    if (typeof node === 'string') {
      out.push(node);
    } else if (node && typeof node === 'object') {
      for (const value of Object.values(node)) {
        flattenValues(value, out);
      }
    }
    return out;
  }

  it.each([
    ['fr', fr],
    ['en', en],
    ['ar', ar],
  ])('%s catalog', (locale, catalog) => {
    const patterns = REQUEST_PHRASES_BY_LOCALE[locale];
    const strings = flattenValues(catalog);
    for (const pattern of patterns) {
      for (const value of strings) {
        expect(value).not.toMatch(pattern);
      }
    }
  });
});
