import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nManager } from 'react-native';

import { createFakeDatabase } from '../../db/testUtils/createFakeDatabase';

let mockFakeDb = createFakeDatabase().db;

jest.mock('../../db/client', () => ({
  getDatabase: () => mockFakeDb,
}));

// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { createCategory, createMember, createTransaction } from '../../db/repositories';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { LanguageProvider } from '../../i18n';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { fr } from '../../i18n/locales/fr';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ThemeProvider } from '../../theme';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { HomeScreen } from '../HomeScreen';
// eslint-disable-next-line import/first -- must come after jest.mock('../../db/client', ...) above
import { ExpenseEntryProvider } from '../ExpenseEntryProvider';

// HomeScreen is now a pure dashboard: the add/edit/confirm flow lives in the app-wide
// `ExpenseEntryProvider` overlay (opened by the tab bar's FAB, the empty-state CTA, or a
// transaction-row tap via `useExpenseEntry`), so the screen mounts inside that provider here.
function renderHome() {
  return render(
    <LanguageProvider>
      <ThemeProvider initialColorScheme="light">
        <ExpenseEntryProvider>
          <HomeScreen />
        </ExpenseEntryProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe('HomeScreen under RTL and LTR', () => {
  const originalIsRTL = I18nManager.isRTL;

  beforeEach(() => {
    mockFakeDb = createFakeDatabase().db;
  });

  afterEach(() => {
    I18nManager.isRTL = originalIsRTL;
  });

  // React Navigation/RN mirror layout for RTL from `I18nManager.isRTL` directly (set by
  // `LanguageProvider` on a real language switch, US-003) — this proves the dashboard's own
  // content (disclaimer, add button, empty state) still renders correctly under both native RTL
  // settings without crashing, the same stand-in for a device/browser pass used by
  // `RootNavigator.rtl.test.tsx` (US-008). Real-device verification with the Arabic UI is still
  // recommended once this ships, per that file's own caveat.
  it('renders the dashboard summary, disclaimer, balance card and empty state in LTR', async () => {
    I18nManager.isRTL = false;
    await renderHome();

    expect(await screen.findByText('Dépense')).toBeTruthy();
    expect(screen.getByText(fr.home.disclaimer)).toBeTruthy();
    expect(screen.getByText('Solde du mois — restant')).toBeTruthy();
    // Revenus/Dépenses footer stats both read 0,00 MAD on an empty month.
    expect(screen.getAllByText(/0,00/).length).toBeGreaterThan(0);
    expect(screen.getByText('Ajoute ta première opération pour démarrer')).toBeTruthy();
  });

  it('renders the dashboard summary, disclaimer, balance card and empty state under the RTL layout flag', async () => {
    I18nManager.isRTL = true;
    await renderHome();

    expect(await screen.findByText('Dépense')).toBeTruthy();
    expect(screen.getByText(fr.home.disclaimer)).toBeTruthy();
    expect(screen.getByText('Solde du mois — restant')).toBeTruthy();
    expect(screen.getByText('Ajoute ta première opération pour démarrer')).toBeTruthy();
  });

  it('scopes the whole dashboard to the selected month, list included (US-008)', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const now = new Date();
    const thisMonthKey = now.toISOString().slice(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 100000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: lastMonth.toISOString(),
      note: 'Loyer du mois dernier',
    });
    await createTransaction(mockFakeDb, {
      type: 'income',
      amountMinor: 500000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-05T10:00:00.000Z`,
      note: 'Salaire',
    });

    await renderHome();

    // The balance reflects this month's income only; last month's expense doesn't drag it down.
    expect((await screen.findAllByText(/5.000,00/)).length).toBe(2);
    expect(screen.getByText('Salaire')).toBeTruthy();
    // US-008: "solde, catégories, transactions et objectifs reflètent ce mois". This test used to
    // assert the opposite for the list ("historique conservé") — a plausible reading, but the
    // criterion is explicit, and a month selector that leaves the list unscoped is confusing.
    // The full history lives behind "Voir tout" (US-012).
    expect(screen.queryByText('Loyer du mois dernier')).toBeNull();
  });

  it('shows the category breakdown sorted by descending total, scoped to this month (US-014)', async () => {
    const courses = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    const transport = await createCategory(mockFakeDb, {
      name: 'Transport',
      icon: 'car',
      color: '#222222',
    });
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const now = new Date();
    const thisMonthKey = now.toISOString().slice(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    // Small transport expense this month.
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 5000,
      currencyCode: 'MAD',
      categoryId: transport.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-03T10:00:00.000Z`,
    });
    // Two Courses expenses this month, summing higher than Transport.
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 8000,
      currencyCode: 'MAD',
      categoryId: courses.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-01T10:00:00.000Z`,
    });
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 4000,
      currencyCode: 'MAD',
      categoryId: courses.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-10T10:00:00.000Z`,
    });
    // Income this month must not appear in the breakdown ("où part l'argent").
    await createTransaction(mockFakeDb, {
      type: 'income',
      amountMinor: 500000,
      currencyCode: 'MAD',
      categoryId: courses.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-02T10:00:00.000Z`,
    });
    // A Transport expense from last month must not count towards this month's breakdown.
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 900000,
      currencyCode: 'MAD',
      categoryId: transport.id,
      memberId: member.id,
      occurredAt: lastMonth.toISOString(),
    });

    await renderHome();

    await screen.findByText('Répartition par catégorie');
    const rendered = screen.toJSON();
    const coursesIndex = JSON.stringify(rendered).indexOf('"Courses"');
    const transportIndex = JSON.stringify(rendered).indexOf('"Transport"');
    expect(coursesIndex).toBeGreaterThan(-1);
    expect(transportIndex).toBeGreaterThan(coursesIndex);

    // Breakdown legend shows clean number-only major amounts (currency shown once in the center),
    // matching the design. Courses total: 8000 + 4000 minor = 120 MAD.
    expect(screen.getByText(/120/)).toBeTruthy();
    // Transport's single matching transaction this month shows as -50,00 MAD in "Dernières
    // opérations". Last month's 900.000,00 MAD Transport expense is excluded from *this month's*
    // breakdown (only 120 + 50 = 170 counted), even though it still appears in the recent list.
    expect(screen.getByText(/-50,00/)).toBeTruthy();
  });

  it('limits Dernières opérations to the 4 most recent transactions (US-012)', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const thisMonthKey = new Date().toISOString().slice(0, 7);

    for (let day = 1; day <= 7; day += 1) {
      await createTransaction(mockFakeDb, {
        type: 'expense',
        amountMinor: 1000 * day,
        currencyCode: 'MAD',
        categoryId: category.id,
        memberId: member.id,
        occurredAt: `${thisMonthKey}-${String(day).padStart(2, '0')}T10:00:00.000Z`,
        note: `Opération jour ${day}`,
      });
    }

    await renderHome();

    await screen.findByText('Dernières opérations');
    // US-012 asks for the last four: days 7 down to 4. `listTransactions` orders by `occurredAt`
    // DESC; the rest is one tap away behind "Voir tout".
    for (const day of [7, 6, 5, 4]) {
      expect(screen.getByText(`Opération jour ${day}`)).toBeTruthy();
    }
    for (const day of [3, 2, 1]) {
      expect(screen.queryByText(`Opération jour ${day}`)).toBeNull();
    }
  });

  it('distinguishes income (no sign) from expense (minus sign) in the recent list (US-015)', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const thisMonthKey = new Date().toISOString().slice(0, 7);

    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 2000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-01T10:00:00.000Z`,
      note: 'Courses',
    });
    await createTransaction(mockFakeDb, {
      type: 'income',
      amountMinor: 300000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-02T10:00:00.000Z`,
      note: 'Salaire',
    });

    await renderHome();

    expect(await screen.findByText(/-20,00/)).toBeTruthy();
    // Now that the list is month-scoped, the income also feeds the hero's Revenus total, so it
    // renders twice — what matters is that neither carries a minus.
    expect(screen.getAllByText(/3\.000,00/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/-3\.000,00/)).toBeNull();
  });

  it('editing a transaction from the recent list updates the aggregates in place (US-016)', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const thisMonthKey = new Date().toISOString().slice(0, 7);
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 2000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-05T10:00:00.000Z`,
      note: 'Courses',
    });

    await renderHome();

    // The balance hero (clean number-only "-20") and the recent-list row ("-20,00 MAD") both
    // reflect the one expense.
    expect((await screen.findAllByText(/-20/)).length).toBe(2);

    // "Courses" appears twice (the breakdown card's category name, then the recent-ops row's
    // note) — the second one is the tappable row.
    const coursesRows = await screen.findAllByText('Courses');
    await fireEvent.press(coursesRows[1]);
    expect(await screen.findByText('Modifier la dépense')).toBeTruthy();
    expect(screen.getByLabelText('Montant (MAD)').props.value).toBe('20');

    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '75');
    await fireEvent.press(screen.getByText('Enregistrer'));

    // Back on the summary (the edit overlay closes straight away — no confirmation screen for an
    // edit), the balance reflects the new amount — no duplicate row, and no stale -20,00 value.
    expect((await screen.findAllByText(/-75/)).length).toBe(2);
    expect(screen.queryByText('Modifier la dépense')).toBeNull();
    expect(screen.queryByText(/-20,00/)).toBeNull();
  });

  it('deleting a transaction from the edit form recalculates the dashboard (US-016)', async () => {
    const category = await createCategory(mockFakeDb, {
      name: 'Courses',
      icon: 'cart',
      color: '#111111',
    });
    const member = await createMember(mockFakeDb, { name: 'Moi' });
    const thisMonthKey = new Date().toISOString().slice(0, 7);
    await createTransaction(mockFakeDb, {
      type: 'expense',
      amountMinor: 2000,
      currencyCode: 'MAD',
      categoryId: category.id,
      memberId: member.id,
      occurredAt: `${thisMonthKey}-05T10:00:00.000Z`,
      note: 'Courses',
    });

    await renderHome();

    const coursesRows = await screen.findAllByText('Courses');
    await fireEvent.press(coursesRows[1]);
    expect(await screen.findByText('Modifier la dépense')).toBeTruthy();

    await fireEvent.press(screen.getByText('Supprimer'));
    await fireEvent.press(await screen.findByText('Oui, supprimer'));

    // Back on the summary, the dashboard reflects the deletion: no residual balance, empty state
    // showing again — no silent data-loss surprise, the deletion required an explicit confirm.
    expect(await screen.findByText('Ajoute ta première opération pour démarrer')).toBeTruthy();
    expect(screen.getByText('Solde du mois — restant')).toBeTruthy();
    expect(screen.getAllByText(/0,00/).length).toBeGreaterThan(0);
  });

  it('shows the confirmation screen with the recalculated reste du mois after saving (US-012)', async () => {
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Moi' });
    await renderHome();

    await fireEvent.press(await screen.findByText('Dépense'));
    expect(await screen.findByText('Nouvelle dépense')).toBeTruthy();

    await fireEvent.press(screen.getByText('Courses'));
    // A single-member household never shows a member chip (US-018) — "Moi" is already
    // auto-assigned.
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '15');
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText('Opération enregistrée !')).toBeTruthy();
    // -15,00 shows on the confirmation card and on the now-refreshed dashboard row underneath.
    expect(screen.getAllByText(/-15,00/).length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByText('Ajouter une autre'));
    expect(await screen.findByText('Nouvelle dépense')).toBeTruthy();
  });

  it('returns to the dashboard summary from the confirmation screen', async () => {
    await createCategory(mockFakeDb, { name: 'Courses', icon: 'cart', color: '#111111' });
    await createMember(mockFakeDb, { name: 'Moi' });
    await renderHome();

    await fireEvent.press(await screen.findByText('Dépense'));
    // `findBy*`: the form loads its category chips from the db, so they land a tick after it opens.
    await fireEvent.press(await screen.findByText('Courses'));
    await fireEvent.changeText(screen.getByLabelText('Montant (MAD)'), '15');
    await fireEvent.press(screen.getByText('Enregistrer'));

    await fireEvent.press(await screen.findByText("Retour à l'accueil"));

    // Back on the dashboard: the confirmation overlay is gone and the newly added expense is now
    // listed (so the empty state — and its "Ajouter une opération" CTA — no longer show).
    expect((await screen.findAllByText('Courses')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Opération enregistrée !')).toBeNull();
    expect(screen.queryByText(/Aucune opération pour le moment/)).toBeNull();
  });
});
