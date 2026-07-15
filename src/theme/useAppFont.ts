import { useTranslation } from 'react-i18next';

import { useTheme } from './ThemeContext';
import type { FontFamilySet } from './types';

/**
 * Returns the font-family set (regular/medium/semibold/bold/extrabold) for the **active language**:
 * IBM Plex Sans Arabic when the app is in Arabic, Outfit otherwise. Reads the language from
 * `react-i18next`'s global instance (`useTranslation().i18n`) rather than our `LanguageContext`, so
 * any component can call it without a `LanguageProvider` ancestor — several component tests mount a
 * screen under `ThemeProvider` alone. Consume it via the `Txt` component in almost all cases; call
 * this directly only for a bare `TextInput`/`Text` that can't use `Txt`.
 */
export function useAppFont(): FontFamilySet {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  return i18n.language === 'ar' ? theme.fonts.arabic : theme.fonts.latin;
}
