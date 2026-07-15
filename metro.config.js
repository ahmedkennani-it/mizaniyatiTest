// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation (wa-sqlite) ships a .wasm asset; Metro's default
// `assetExts` doesn't include it, which otherwise breaks `expo export --platform web`
// once any code imports `expo-sqlite` (see src/db/client.ts).
config.resolver.assetExts.push('wasm');

module.exports = config;
