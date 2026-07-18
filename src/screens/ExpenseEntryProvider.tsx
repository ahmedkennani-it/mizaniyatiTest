import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AddExpenseForm } from './AddExpenseForm';
import type { AddExpenseFormPrefill } from './AddExpenseForm';
import { ExpenseConfirmation } from './ExpenseConfirmation';
import type { ExpenseConfirmationOverBudget } from './ExpenseConfirmation';
import { VoiceEntrySheet } from './VoiceEntrySheet';
import { UndoBanner } from '../components';
import { computeCategoryBudgetStatus, resolveCategoryDisplayName } from '../categories';
import { getDatabase } from '../db/client';
import {
  createTransaction,
  listCategories,
  listCategoryBudgets,
  listMembers,
  listTransactions,
} from '../db/repositories';
import type { Transaction } from '../db/repositories';
import { useLanguage } from '../i18n';
import { computeMonthlyBalance } from '../transactions';

/** US-024: how long "Annuler" stays offered after a deletion. */
const UNDO_DELETE_WINDOW_MS = 5000;

interface ExpenseEntryContextValue {
  /** Opens the entry sheet — pass a transaction to edit it, omit to add a new one. */
  openEntry: (transaction?: Transaction) => void;
  /** Opens the voice-capture sheet (US-020a) for a new expense. */
  openVoiceEntry: () => void;
  /** Increments after every save/delete so data-displaying screens can refetch. */
  dataVersion: number;
}

const ExpenseEntryContext = createContext<ExpenseEntryContextValue | undefined>(undefined);

type Mode = 'closed' | 'form' | 'voice' | 'confirmation';

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Hosts the add/edit-transaction flow as a full-screen overlay above the whole navigator, so the
 * floating tab bar's center FAB can open it from **any** tab (not just the dashboard, which is where
 * it used to live). On save of a *new* expense it shows the "reste du mois" confirmation (US-012);
 * editing an existing one closes straight back. `dataVersion` bumps on every mutation — screens that
 * list transactions/aggregates include it in their refresh effect so they stay in sync.
 */
interface SavedSummary {
  amountMinor: number;
  currencyCode: string;
  categoryName: string;
  memberName: string;
  occurredAt: string;
  overBudget?: ExpenseConfirmationOverBudget;
}

export function ExpenseEntryProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [mode, setMode] = useState<Mode>('closed');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [prefill, setPrefill] = useState<AddExpenseFormPrefill | undefined>(undefined);
  const [remainingBalanceMinor, setRemainingBalanceMinor] = useState(0);
  const [savedSummary, setSavedSummary] = useState<SavedSummary | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [pendingUndo, setPendingUndo] = useState<Transaction | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);
  useEffect(() => clearUndoTimer, [clearUndoTimer]);

  const openEntry = useCallback((transaction?: Transaction) => {
    setEditing(transaction ?? null);
    setPrefill(undefined);
    setMode('form');
  }, []);

  const openVoiceEntry = useCallback(() => {
    setEditing(null);
    setMode('voice');
  }, []);

  const close = useCallback(() => {
    setEditing(null);
    setMode('closed');
  }, []);

  /** Shared by the keyboard form and the voice review — a *new* expense always shows the "reste
   *  du mois" confirmation (US-022); only an edit closes straight back. */
  const handleNewExpenseSaved = useCallback(async (transaction: Transaction) => {
    const db = getDatabase();
    const [loaded, categories, members, budgets] = await Promise.all([
      listTransactions(db),
      listCategories(db),
      listMembers(db),
      listCategoryBudgets(db),
    ]);
    setDataVersion((v) => v + 1);
    setRemainingBalanceMinor(computeMonthlyBalance(loaded, currentMonthKey()));

    const category = categories.find((candidate) => candidate.id === transaction.categoryId);
    const budget = budgets.find((candidate) => candidate.categoryId === transaction.categoryId);
    const overBudget = (() => {
      if (!budget || transaction.type !== 'expense') {
        return undefined;
      }
      const status = computeCategoryBudgetStatus(loaded, budget, currentMonthKey());
      return status.isOverBudget
        ? {
            categoryName: category ? resolveCategoryDisplayName(category, language) : '',
            overageMinor: status.overageMinor,
          }
        : undefined;
    })();

    setSavedSummary({
      amountMinor: transaction.amountMinor,
      currencyCode: transaction.currencyCode,
      categoryName: category ? resolveCategoryDisplayName(category, language) : '',
      memberName: members.find((candidate) => candidate.id === transaction.memberId)?.name ?? '',
      occurredAt: transaction.occurredAt,
      overBudget,
    });
    setMode('confirmation');
  }, [language]);

  /** US-024: the deletion already happened — this only offers 5s to bring it back. */
  const handleDeleted = useCallback(
    (deleted: Transaction) => {
      setDataVersion((v) => v + 1);
      close();
      clearUndoTimer();
      setPendingUndo(deleted);
      undoTimerRef.current = setTimeout(() => {
        setPendingUndo(null);
        undoTimerRef.current = null;
      }, UNDO_DELETE_WINDOW_MS);
    },
    [close, clearUndoTimer],
  );

  const handleUndoDelete = useCallback(async () => {
    if (!pendingUndo) {
      return;
    }
    clearUndoTimer();
    const restored = pendingUndo;
    setPendingUndo(null);
    await createTransaction(getDatabase(), {
      type: restored.type,
      amountMinor: restored.amountMinor,
      currencyCode: restored.currencyCode,
      categoryId: restored.categoryId,
      memberId: restored.memberId,
      occurredAt: restored.occurredAt,
      note: restored.note ?? undefined,
    });
    setDataVersion((v) => v + 1);
  }, [pendingUndo, clearUndoTimer]);

  const value = useMemo<ExpenseEntryContextValue>(
    () => ({ openEntry, openVoiceEntry, dataVersion }),
    [openEntry, openVoiceEntry, dataVersion],
  );

  return (
    <ExpenseEntryContext.Provider value={value}>
      <View style={styles.fill}>
        {children}
        {mode !== 'closed' ? (
          <View style={StyleSheet.absoluteFill}>
            {mode === 'form' ? (
              <AddExpenseForm
                transaction={editing ?? undefined}
                prefill={prefill}
                onSaved={async (created) => {
                  if (editing) {
                    setDataVersion((v) => v + 1);
                    close();
                  } else if (created) {
                    await handleNewExpenseSaved(created);
                  }
                }}
                onCancel={close}
                onDeleted={handleDeleted}
              />
            ) : mode === 'voice' ? (
              <VoiceEntrySheet
                onClose={close}
                onFallbackToKeyboard={() => {
                  setEditing(null);
                  setPrefill(undefined);
                  setMode('form');
                }}
                onCaptured={(captured) => {
                  setEditing(null);
                  setPrefill(captured);
                  setMode('form');
                }}
                onSavedFromReview={handleNewExpenseSaved}
              />
            ) : savedSummary ? (
              <ExpenseConfirmation
                amountMinor={savedSummary.amountMinor}
                currencyCode={savedSummary.currencyCode}
                categoryName={savedSummary.categoryName}
                memberName={savedSummary.memberName}
                occurredAt={savedSummary.occurredAt}
                overBudget={savedSummary.overBudget}
                remainingBalanceMinor={remainingBalanceMinor}
                onAddAnother={() => {
                  setEditing(null);
                  setMode('form');
                }}
                onDone={close}
              />
            ) : null}
          </View>
        ) : null}
        {pendingUndo ? (
          <View style={styles.undoBannerWrap} pointerEvents="box-none">
            <UndoBanner
              message={t('expenseForm.deletedUndoMessage')}
              actionLabel={t('expenseForm.cancel')}
              onAction={handleUndoDelete}
            />
          </View>
        ) : null}
      </View>
    </ExpenseEntryContext.Provider>
  );
}

export function useExpenseEntry(): ExpenseEntryContextValue {
  const context = useContext(ExpenseEntryContext);
  if (!context) {
    throw new Error('useExpenseEntry must be used within an ExpenseEntryProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  undoBannerWrap: {
    position: 'absolute',
    start: 16,
    end: 16,
    bottom: 100,
  },
});
