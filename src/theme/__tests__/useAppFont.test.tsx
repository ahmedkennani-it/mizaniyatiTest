import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import i18n from '../../i18n/i18n';
import { ThemeProvider } from '../ThemeContext';
import { useAppFont } from '../useAppFont';

function Probe() {
  const font = useAppFont();
  return <Text>{font.regular}</Text>;
}

async function renderProbeIn(language: 'fr' | 'ar' | 'en') {
  await i18n.changeLanguage(language);
  await render(
    <ThemeProvider initialColorScheme="light">
      <Probe />
    </ThemeProvider>,
  );
}

/** US-061a: the app ships two font families and picks between them by language — IBM Plex Sans
 * Arabic for the Arabic script, Outfit for the latin ones. */
describe('useAppFont', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('uses IBM Plex Sans Arabic in Arabic', async () => {
    await renderProbeIn('ar');
    expect(screen.getByText('IBMPlexSansArabic_400Regular')).toBeTruthy();
  });

  it.each(['fr', 'en'] as const)('uses Outfit in %s', async (language) => {
    await renderProbeIn(language);
    expect(screen.getByText('Outfit_400Regular')).toBeTruthy();
  });
});
