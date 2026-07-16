import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager, StyleSheet } from 'react-native';

import { BalanceHeroCard } from '../BalanceHeroCard';
import { Button } from '../Button';
import { Card } from '../Card';
import { Chip } from '../Chip';
import { DonutBreakdown } from '../DonutBreakdown';
import { ListRow } from '../ListRow';
import { MonthSelector } from '../MonthSelector';
import { ProgressBar } from '../ProgressBar';
import { ScreenHeader } from '../ScreenHeader';
import { TextField } from '../TextField';
import { ThemeProvider } from '../../theme';

// Physical edges bake a reading direction into the layout, so a component using them looks correct
// in French and wrong in Arabic. The logical equivalents (`start`/`end`, `marginStart`…) follow
// `I18nManager.isRTL` instead, which is what makes the same tree mirror for free (US-061b).
const DIRECTIONAL_KEYS = [
  'left',
  'right',
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
];

/** Every host element in the tree, so a stray `right:` on a nested decoration is caught too. */
function collectStyles(node: unknown): object[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectStyles);
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  const element = node as { props?: { style?: unknown }; children?: unknown };
  const own = element.props?.style ? [StyleSheet.flatten(element.props.style) as object] : [];
  return [...own, ...collectStyles(element.children)];
}

function assertNoDirectionalStyles() {
  const styles = collectStyles(screen.toJSON());
  expect(styles.length).toBeGreaterThan(0);
  for (const style of styles) {
    for (const key of DIRECTIONAL_KEYS) {
      expect(style).not.toHaveProperty(key);
    }
  }
}

/** One tree with every base component the mockup builds screens from: header, rows, chips, the
 * progress bar, the donut ring, the month selector and the form controls. */
async function renderKit() {
  await render(
    <ThemeProvider initialColorScheme="light">
      <Card testID="card">
        <ScreenHeader
          title="Catégories"
          onBack={() => {}}
          actions={[{ icon: 'bell', accessibilityLabel: 'Alertes', badge: true }]}
        />
        <MonthSelector label="Juin 2026" onPrev={() => {}} onNext={() => {}} />
        <BalanceHeroCard label="Solde" amountMinor={123456} currencyCode="MAD" cornerIcon="moon" />
        <ListRow title="Courses" subtitle="Alimentation" icon="shopping-cart" value="240" chevron />
        <ProgressBar progress={0.4} />
        <DonutBreakdown
          segments={[{ label: 'Courses', value: 240, valueLabel: '240', accent: 'teal' }]}
          centerLabel="Dépensé"
          centerValue="240"
        />
        <Button label="Ajouter" onPress={() => {}} />
        <TextField label="Libellé" placeholder="Courses" />
        <Chip label="Courses" selected={false} onPress={() => {}} />
      </Card>
    </ThemeProvider>,
  );
}

describe('base components under RTL and LTR', () => {
  const originalIsRTL = I18nManager.isRTL;

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  it('renders correctly in LTR (French)', async () => {
    I18nManager.isRTL = false;
    await renderKit();

    expect(screen.getByText('Ajouter')).toBeTruthy();
    expect(screen.getByLabelText('Libellé')).toBeTruthy();
    assertNoDirectionalStyles();
  });

  it('renders correctly in RTL (Arabic)', async () => {
    I18nManager.isRTL = true;
    await renderKit();

    expect(screen.getByText('Ajouter')).toBeTruthy();
    expect(screen.getByLabelText('Libellé')).toBeTruthy();
    assertNoDirectionalStyles();
  });
});
