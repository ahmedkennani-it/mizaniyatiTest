import { render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  AlertBanner,
  BalanceHeroCard,
  CategoryBudgetRow,
  DonutBreakdown,
  IconTile,
  ListRow,
  ProgressBar,
  TrustChip,
  VoicePromoCard,
} from '..';
import { ThemeProvider } from '../../theme';

function wrap(node: React.ReactNode) {
  return render(<ThemeProvider initialColorScheme="light">{node}</ThemeProvider>);
}

describe('component kit smoke', () => {
  it('renders IconTile + ProgressBar without crashing', async () => {
    await wrap(
      <>
        <IconTile icon="shopping-cart" accent="gold" />
        <ProgressBar progress={0.6} accent="teal" />
      </>,
    );
    expect(screen.getByTestId('icon-shopping-cart')).toBeTruthy();
  });

  it('renders a gradient BalanceHeroCard with a formatted amount', async () => {
    await wrap(
      <BalanceHeroCard
        label="Solde du mois"
        amountMinor={726000}
        currencyCode="MAD"
        progress={0.6}
      />,
    );
    expect(screen.getByText('Solde du mois')).toBeTruthy();
    expect(screen.getByText('MAD')).toBeTruthy();
    // 7 260 (localized, LTR-wrapped) — match as a substring since it carries LRM marks.
    expect(screen.getByText(/7.?260/)).toBeTruthy();
  });

  it('renders a DonutBreakdown legend + svg', async () => {
    await wrap(
      <DonutBreakdown
        centerLabel="Dépensé"
        centerValue="11 240"
        segments={[
          { label: 'Logement', value: 3800, valueLabel: '3 800', accent: 'teal' },
          { label: 'Transport', value: 1540, valueLabel: '1 540', accent: 'blue' },
        ]}
      />,
    );
    expect(screen.getByText('Logement')).toBeTruthy();
    expect(screen.getByText('Dépensé')).toBeTruthy();
  });

  it('renders ListRow, CategoryBudgetRow, AlertBanner, TrustChip, VoicePromoCard', async () => {
    await wrap(
      <>
        <ListRow
          icon="banknote"
          accent="teal"
          title="Salaire"
          subtitle="Revenu"
          value="+14 000 MAD"
        />
        <CategoryBudgetRow
          icon="utensils"
          accent="coral"
          name="Alimentation"
          amountLabel="3 200 / 2 950"
          progress={1}
          over
        />
        <AlertBanner message="Alimentation a dépassé son plafond." />
        <TrustChip label="Aucune connexion bancaire" />
        <VoicePromoCard title="Ajoute par la voix" subtitle="Dans ta langue" badge="NOUVEAU" />
      </>,
    );
    expect(screen.getByText('Salaire')).toBeTruthy();
    expect(screen.getByText('Ajoute par la voix')).toBeTruthy();
  });
});
