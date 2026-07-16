/**
 * Hermes (React Native's JS engine) ships only a subset of `Intl`: `NumberFormat` and
 * `DateTimeFormat` are built in, but `RelativeTimeFormat`, `PluralRules`, `Locale` and
 * `getCanonicalLocales` are **not**. Reaching for a missing one yields `undefined`, and
 * `new undefined(...)` surfaces as `TypeError: Cannot read property 'prototype' of undefined` —
 * which is how `formatRelativeDate` (`dateFormat.ts`) crashed every screen rendering a
 * `TransactionRow`.
 *
 * Node — what Jest runs on — has the full ICU, so **no test can catch this**: the suite stays green
 * while the device crashes. That asymmetry is the reason this file exists rather than a fix at the
 * call site.
 *
 * Each `polyfill.js` self-checks (`shouldPolyfill()`) and installs nothing where the engine already
 * provides the API, so importing them unconditionally is a no-op under Jest and on any engine with
 * a complete `Intl`.
 *
 * Import order is load-bearing and matches the dependency chain, so keep it: `RelativeTimeFormat`
 * calls `getCanonicalLocales` when resolving its locale argument and `new Intl.Locale().minimize()`
 * when registering locale data, and it delegates plural selection to `PluralRules`. Locale data
 * follows its own polyfill; only the app's three languages are loaded, since the full CLDR set is
 * megabytes.
 */
import '@formatjs/intl-getcanonicallocales/polyfill.js';
import '@formatjs/intl-locale/polyfill.js';

import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/ar.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/fr.js';

import '@formatjs/intl-relativetimeformat/polyfill.js';
import '@formatjs/intl-relativetimeformat/locale-data/ar.js';
import '@formatjs/intl-relativetimeformat/locale-data/en.js';
import '@formatjs/intl-relativetimeformat/locale-data/fr.js';
