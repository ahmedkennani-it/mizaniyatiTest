import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CategoryDetail } from '../CategoryDetail';
import type { Category, CategoryBudget, Member, Transaction } from '../../db/repositories';
import { LanguageProvider } from '../../i18n';
import { ThemeProvider } from '../../theme';

const category: Category = {
  id: 'cat-1',
  name: 'Courses',
  icon: 'cart',
  color: '#0D9488',
  isDefault: false,
  orderIndex: 0,
  seasonalThemeId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const members: Member[] = [
  { id: 'member-1', name: 'Youssef', role: 'editor', removedAt: null, createdAt: '', updatedAt: '' },
];

function budget(overrides: Partial<CategoryBudget> = {}): CategoryBudget {
  return {
    id: 'budget-1',
    categoryId: category.id,
    month: '2026-07',
    capMinor: 100000,
    alertThresholdMinor: 80000,
    rolloverEnabled: false,
    lastAlertedMonth: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${Math.random()}`,
    type: 'expense',
    amountMinor: 10000,
    currencyCode: 'MAD',
    categoryId: category.id,
    memberId: 'member-1',
    occurredAt: '2026-07-10T10:00:00.000Z',
    note: null,
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T10:00:00.000Z',
    ...overrides,
  };
}

function renderDetail(props: {
  budget?: CategoryBudget;
  transactions?: Transaction[];
  onEdit?: () => void;
  onBack?: () => void;
}) {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <CategoryDetail
          category={category}
          budget={props.budget}
          transactions={props.transactions ?? []}
          members={members}
          monthKey="2026-07"
          currencyCode="MAD"
          onEdit={props.onEdit ?? jest.fn()}
          onBack={props.onBack ?? jest.fn()}
        />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('CategoryDetail (US-027)', () => {
  it('shows the ring percentage and the three tiles (dépense, plafond, reste)', async () => {
    await renderDetail({ budget: budget(), transactions: [transaction({ amountMinor: 40000 })] });

    expect(await screen.findByText('40%')).toBeTruthy();
    // `formatMoney` wraps its output with invisible LTR marks, so exact string matches miss —
    // same convention as `ExpenseConfirmation.test.tsx`. The spent/cap pair also appears once
    // under the ring and once on its own tile, hence `getAllByText`.
    expect(screen.getAllByText(/400,00 MAD/).length).toBeGreaterThan(0); // spent
    expect(screen.getAllByText(/1.000,00 MAD/).length).toBeGreaterThan(0); // cap
    expect(screen.getByText(/600,00 MAD/)).toBeTruthy(); // remaining tile (ring doesn't repeat it)
  });

  it('shows a negative-looking remaining amount once over the cap', async () => {
    await renderDetail({
      budget: budget({ capMinor: 30000 }),
      transactions: [transaction({ amountMinor: 40000 })],
    });

    expect(await screen.findByText(/-100,00 MAD/)).toBeTruthy();
  });

  it('lists this month’s transactions with member and date', async () => {
    await renderDetail({
      budget: budget(),
      transactions: [transaction({ note: 'Marché du vendredi' })],
    });

    expect(await screen.findByText('Marché du vendredi')).toBeTruthy();
    expect(screen.getByText(/Youssef/)).toBeTruthy();
  });

  it('excludes transactions from other months or other categories', async () => {
    await renderDetail({
      budget: budget(),
      transactions: [
        transaction({ note: 'Le bon', occurredAt: '2026-07-05T10:00:00.000Z' }),
        transaction({ note: 'Mois dernier', occurredAt: '2026-06-05T10:00:00.000Z' }),
        transaction({ note: 'Autre catégorie', categoryId: 'cat-2' }),
      ],
    });

    expect(await screen.findByText('Le bon')).toBeTruthy();
    expect(screen.queryByText('Mois dernier')).toBeNull();
    expect(screen.queryByText('Autre catégorie')).toBeNull();
  });

  it('shows a message instead of the ring when there is no budget', async () => {
    await renderDetail({ budget: undefined });

    expect(await screen.findByText('Aucun plafond défini pour cette catégorie ce mois-ci.')).toBeTruthy();
  });

  it('shows the rollover bonus origin when rollover added to the cap', async () => {
    await renderDetail({
      budget: budget({ rolloverEnabled: true, capMinor: 100000 }),
      transactions: [transaction({ amountMinor: 20000, occurredAt: '2026-06-05T10:00:00.000Z' })],
    });

    expect(await screen.findByText(/reportés du mois dernier/)).toBeTruthy();
  });

  it('shows the rollover deficit origin when last month overspent', async () => {
    await renderDetail({
      budget: budget({ rolloverEnabled: true, capMinor: 100000 }),
      transactions: [transaction({ amountMinor: 150000, occurredAt: '2026-06-05T10:00:00.000Z' })],
    });

    expect(await screen.findByText(/déduits du dépassement du mois dernier/)).toBeTruthy();
  });

  it('opens the cap editor when "Modifier le plafond" is pressed', async () => {
    const onEdit = jest.fn();
    await renderDetail({ budget: budget(), onEdit });

    await fireEvent.press(await screen.findByText('Modifier le plafond'));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
