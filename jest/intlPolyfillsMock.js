/**
 * Stands in for `src/i18n/intlPolyfills.ts` under Jest.
 *
 * Node ships the full ICU, so every `Intl` API the app polyfills for Hermes is already native here
 * and each `@formatjs` polyfill would no-op anyway. Loading them regardless costs a megabyte of
 * parsing per suite, and their published bundles use static class blocks, which this project's
 * Babel config doesn't transform for Jest (Metro does, so the app itself bundles them fine).
 *
 * The trade-off worth knowing: `intlPolyfills.ts` is therefore *not* exercised by the test suite.
 * `npm run typecheck` still validates its imports, and a real bundle (`npx expo export`) is what
 * proves it loads — which mirrors reality, since a Node-based test could never have caught the
 * missing-`Intl` crash this module exists to fix in the first place.
 */
module.exports = {};
