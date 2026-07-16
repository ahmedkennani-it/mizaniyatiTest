import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { Amount } from '../Amount';
import { BalanceHeroCard } from '../BalanceHeroCard';
import { CategoryBudgetRow } from '../CategoryBudgetRow';
import { DonutBreakdown } from '../DonutBreakdown';
import { Icon } from '../Icon';
import { MonthSelector } from '../MonthSelector';
import { ProgressBar } from '../ProgressBar';
import { ScreenHeader } from '../ScreenHeader';
import i18n from '../../i18n/i18n';
import { ar } from '../../i18n/locales/ar';
import { en } from '../../i18n/locales/en';
import { fr } from '../../i18n/locales/fr';
import { ThemeProvider } from '../../theme';

async function renderIt(element: React.ReactElement, language: 'fr' | 'ar' | 'en' = 'fr') {
  await i18n.changeLanguage(language);
  await render(<ThemeProvider initialColorScheme="light">{element}</ThemeProvider>);
}

/**
 * Testing Library models the accessibility tree: its queries skip hidden elements unless asked
 * for them. So "absent from a normal query but present with `includeHiddenElements`" *is* the
 * assertion that something is hidden from a screen reader — not a proxy for it.
 */
function isHiddenFromScreenReaders(testID: string): boolean {
  return (
    screen.queryByTestId(testID) === null &&
    screen.queryByTestId(testID, { includeHiddenElements: true }) !== null
  );
}

afterEach(async () => {
  await i18n.changeLanguage('fr');
});

/**
 * US-075b. The rule cuts both ways: a glyph that carries meaning must say what it means, and one
 * that only decorates must stay quiet. Announcing everything is as unusable as announcing nothing.
 */
describe('decorative elements are hidden from screen readers', () => {
  it('hides an icon that merely accompanies its own label', async () => {
    await renderIt(<Icon name="shopping-cart" />);
    expect(isHiddenFromScreenReaders('icon-shopping-cart')).toBe(true);
  });

  // It used to announce its kebab-case name — "shopping-cart", in English, in every language.
  it('never announces the raw icon name', async () => {
    await renderIt(<Icon name="shopping-cart" />);
    expect(screen.queryByLabelText('shopping-cart')).toBeNull();
  });

  it('hides the hero card’s decorative blob', async () => {
    await renderIt(
      <BalanceHeroCard label="Solde" amountMinor={120000} currencyCode="MAD" progress={0.5} />,
    );
    expect(screen.getByText('Solde')).toBeTruthy();
  });

  it('hides a bare progress bar, which says nothing a screen reader can use', async () => {
    await renderIt(<ProgressBar testID="bar" progress={0.4} />);
    expect(isHiddenFromScreenReaders('bar')).toBe(true);
  });

  it('hides the donut ring but keeps its centered figure readable', async () => {
    await renderIt(
      <DonutBreakdown
        segments={[{ label: 'Courses', value: 240, valueLabel: '240', accent: 'teal' }]}
        centerLabel="Dépensé"
        centerValue="240"
      />,
    );
    // The ring restates the legend; the figure in the middle is the real content, and stays read.
    expect(screen.getByText('Dépensé')).toBeTruthy();
    expect(screen.getAllByText('240').length).toBeGreaterThan(0);
  });
});

describe('meaningful icons expose an explicit label', () => {
  it('exposes an icon given a label', async () => {
    await renderIt(<Icon name="alert-circle" accessibilityLabel="Plafond dépassé" />);
    expect(screen.getByLabelText('Plafond dépassé')).toBeTruthy();
    // Reachable by a plain query, unlike its decorative siblings above.
    expect(screen.getByTestId('icon-alert-circle')).toBeTruthy();
  });

  it('names the over-budget glyph, which replaces the percentage text', async () => {
    await renderIt(
      <CategoryBudgetRow icon="shopping-cart" name="Courses" amountLabel="3 200 / 2 950" progress={1} over />,
    );
    expect(screen.getByLabelText(fr.a11y.overBudget)).toBeTruthy();
  });

  it.each([
    ['ar', ar],
    ['en', en],
  ] as const)('translates the over-budget label into %s', async (language, catalog) => {
    await renderIt(
      <CategoryBudgetRow icon="shopping-cart" name="Courses" amountLabel="3 200" progress={1} over />,
      language,
    );
    expect(screen.getByLabelText(catalog.a11y.overBudget)).toBeTruthy();
  });
});

describe('amounts expose a spoken label', () => {
  it('strips the invisible bidi marks from what is read out', async () => {
    await renderIt(<Amount testID="amount" amountMinor={-123450} currencyCode="MAD" />);

    const label = screen.getByTestId('amount').props.accessibilityLabel as string;
    expect(label).not.toMatch(/‎/);
    expect(label).toContain('234,50');
  });

  it('lets a caller add the context a bare amount lacks', async () => {
    await renderIt(
      <Amount
        testID="amount"
        amountMinor={120000}
        currencyCode="MAD"
        accessibilityLabel="Reste du mois : 1 200 dirhams"
      />,
    );
    expect(screen.getByLabelText('Reste du mois : 1 200 dirhams')).toBeTruthy();
  });
});

describe('icon-only controls are reachable and named', () => {
  it('folds the unread badge into the button’s label, since the dot itself is silent', async () => {
    await renderIt(
      <ScreenHeader
        title="Accueil"
        actions={[{ icon: 'bell', accessibilityLabel: 'Notifications', badge: true }]}
      />,
    );
    expect(screen.getByLabelText(`Notifications, ${fr.a11y.unreadNotifications}`)).toBeTruthy();
  });

  it('leaves a badge-less action’s label alone', async () => {
    await renderIt(
      <ScreenHeader title="Accueil" actions={[{ icon: 'bell', accessibilityLabel: 'Notifications' }]} />,
    );
    expect(screen.getByLabelText('Notifications')).toBeTruthy();
  });

  // The mockup's 34px buttons and 17px chevrons are under the 44px minimum touch target.
  it('widens the header buttons past their visual size', async () => {
    await renderIt(
      <ScreenHeader
        title="Catégories"
        onBack={jest.fn()}
        actions={[{ icon: 'bell', accessibilityLabel: 'Notifications' }]}
      />,
    );
    expect(screen.getByLabelText(fr.a11y.back).props.hitSlop).toBe(8);
    expect(screen.getByLabelText('Notifications').props.hitSlop).toBe(8);
  });

  it('widens the month chevrons past their visual size', async () => {
    await renderIt(<MonthSelector label="Juillet 2026" onPrev={jest.fn()} onNext={jest.fn()} />);
    expect(screen.getByLabelText(fr.a11y.previousMonth).props.hitSlop).toBe(14);
    expect(screen.getByLabelText(fr.a11y.nextMonth).props.hitSlop).toBe(14);
  });

  it.each([
    ['ar', ar],
    ['en', en],
  ] as const)('translates the icon-only control labels into %s', async (language, catalog) => {
    await renderIt(<MonthSelector label="2026" onPrev={jest.fn()} onNext={jest.fn()} />, language);
    expect(screen.getByLabelText(catalog.a11y.previousMonth)).toBeTruthy();
    expect(screen.getByLabelText(catalog.a11y.nextMonth)).toBeTruthy();
  });
});
