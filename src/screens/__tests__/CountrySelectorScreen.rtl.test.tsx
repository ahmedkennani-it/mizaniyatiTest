import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createHousehold, saveLanguageCountry } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { CountrySelectorScreen } from '../CountrySelectorScreen';

function renderScreen() {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <CountrySelectorScreen onBack={jest.fn()} />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

/**
 * Built entirely from shared, direction-agnostic primitives (`AppScreen`, `Card`, `ListRow`,
 * `TextField`...) with no `left`/`right` styling of its own — same RTL stand-in used across the
 * rest of the codebase (see `TransfersScreen.rtl.test.tsx`).
 */
describe('CountrySelectorScreen under RTL and LTR (US-057)', () => {
  const originalIsRTL = I18nManager.isRTL;

  beforeEach(async () => {
    mockFakeDb = createFakeDatabase().db;
    await createHousehold(mockFakeDb, { name: 'Famille Benali', currencyCode: 'MAD' });
    await saveLanguageCountry(mockFakeDb, {
      languageCode: 'fr',
      countryCode: 'MA',
      currencyCode: 'MAD',
    });
  });

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('renders the title, search field and groups in LTR', async () => {
    I18nManager.isRTL = false;
    renderScreen();

    expect(await screen.findByText(fr.countrySelector.title)).toBeTruthy();
    expect(screen.getByText(fr.countrySelector.regionMenaGulf)).toBeTruthy();
    expect(screen.getByText(fr.countrySelector.regionDiaspora)).toBeTruthy();
  });

  it('renders the title, search field and groups under the RTL layout flag', async () => {
    I18nManager.isRTL = true;
    renderScreen();

    expect(await screen.findByText(fr.countrySelector.title)).toBeTruthy();
    expect(screen.getByText(fr.countrySelector.regionMenaGulf)).toBeTruthy();
    expect(screen.getByText(fr.countrySelector.regionDiaspora)).toBeTruthy();
  });
});
