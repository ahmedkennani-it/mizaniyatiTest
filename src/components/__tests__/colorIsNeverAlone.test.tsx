import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { AlertBanner } from '../AlertBanner';
import { Amount } from '../Amount';
import { CategoryBudgetRow } from '../CategoryBudgetRow';
import { Chip } from '../Chip';
import i18n from '../../i18n/i18n';
import { ThemeProvider } from '../../theme';

async function renderIt(element: React.ReactElement) {
  await render(<ThemeProvider initialColorScheme="light">{element}</ThemeProvider>);
}

/** Strips the LTR isolation marks around an amount. */
function textOf(testID: string): string {
  return String(screen.getByTestId(testID).props.children).replace(/‎/g, '');
}

/**
 * US-075a: "une information portée par la couleur est toujours doublée d'un texte ou d'une icône".
 * Each case here answers the same question: if the user cannot tell the two colors apart, is the
 * meaning still there? So each asserts on the *non-color* carrier, never on the color.
 */
describe('no state is signalled by color alone', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  describe('Amount', () => {
    it('marks an expense with a minus sign, not just a color', async () => {
      await renderIt(<Amount testID="amount" amountMinor={-24000} currencyCode="MAD" />);
      expect(textOf('amount')).toContain('-');
    });

    it('can carry an explicit plus sign for income', async () => {
      await renderIt(<Amount testID="amount" amountMinor={24000} currencyCode="MAD" showPlusSign />);
      expect(textOf('amount')).toContain('+');
    });
  });

  describe('CategoryBudgetRow', () => {
    it('doubles the over-budget red with an alert glyph', async () => {
      await renderIt(
        <CategoryBudgetRow icon="shopping-cart" name="Courses" amountLabel="3 200 / 2 950" progress={1} over />,
      );
      expect(screen.getByTestId('icon-alert-circle')).toBeTruthy();
    });

    it('shows the percentage tag when within budget, so the two states differ in text too', async () => {
      await renderIt(
        <CategoryBudgetRow
          icon="shopping-cart"
          name="Courses"
          amountLabel="2 800 / 2 950"
          progress={0.95}
          percentLabel="95%"
        />,
      );
      expect(screen.getByText('95%')).toBeTruthy();
      expect(screen.queryByTestId('icon-alert-circle')).toBeNull();
    });
  });

  describe('AlertBanner', () => {
    it('carries an icon alongside the tone', async () => {
      await renderIt(<AlertBanner tone="warning" message="Plafond dépassé" />);
      expect(screen.getByTestId('icon-alert-triangle')).toBeTruthy();
      expect(screen.getByText('Plafond dépassé')).toBeTruthy();
    });

    it('distinguishes info from warning by its icon, not only its wash', async () => {
      await renderIt(<AlertBanner tone="info" icon="shield-check" message="Saisie manuelle" />);
      expect(screen.getByTestId('icon-shield-check')).toBeTruthy();
    });
  });

  describe('Chip', () => {
    // Selection is a teal fill; a screen reader (or a user who can't see the fill) needs the state.
    it('exposes selection as an accessibility state rather than only a fill', async () => {
      await renderIt(<Chip label="Courses" selected onPress={() => {}} />);
      expect(screen.getByRole('button', { selected: true })).toBeTruthy();
    });

    it('reports an unselected chip as such', async () => {
      await renderIt(<Chip label="Courses" selected={false} onPress={() => {}} />);
      expect(screen.getByRole('button', { selected: false })).toBeTruthy();
    });
  });
});
