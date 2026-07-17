import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AddExpenseForm } from './AddExpenseForm';
import { ExpenseConfirmation } from './ExpenseConfirmation';
import { VoiceEntrySheet } from './VoiceEntrySheet';
import { getDatabase } from '../db/client';
import { listTransactions } from '../db/repositories';
import type { Transaction } from '../db/repositories';
import { DEFAULT_CURRENCY_CODE } from '../money';
import { computeMonthlyBalance } from '../transactions';

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
export function ExpenseEntryProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('closed');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [remainingBalanceMinor, setRemainingBalanceMinor] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);

  const openEntry = useCallback((transaction?: Transaction) => {
    setEditing(transaction ?? null);
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
                onSaved={async () => {
                  const loaded = await listTransactions(getDatabase());
                  setDataVersion((v) => v + 1);
                  if (editing) {
                    close();
                  } else {
                    setRemainingBalanceMinor(computeMonthlyBalance(loaded, currentMonthKey()));
                    setMode('confirmation');
                  }
                }}
                onCancel={close}
                onDeleted={() => {
                  setDataVersion((v) => v + 1);
                  close();
                }}
              />
            ) : mode === 'voice' ? (
              <VoiceEntrySheet
                onClose={close}
                onFallbackToKeyboard={() => {
                  setEditing(null);
                  setMode('form');
                }}
              />
            ) : (
              <ExpenseConfirmation
                remainingBalanceMinor={remainingBalanceMinor}
                currencyCode={DEFAULT_CURRENCY_CODE}
                onAddAnother={() => {
                  setEditing(null);
                  setMode('form');
                }}
                onDone={close}
              />
            )}
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
});
