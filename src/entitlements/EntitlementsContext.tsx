import React, { createContext, useContext, useMemo } from 'react';

import { createEntitlementsEngine, type EntitlementsEngine } from './engine';
import { FREE_PLAN } from './freePlan';
import type { Plan } from './types';

const EntitlementsContext = createContext<EntitlementsEngine | undefined>(undefined);

export interface EntitlementsProviderProps {
  children: React.ReactNode;
  /** Defaults to `FREE_PLAN`; pass a fetched plan once subscription state (US-042) exists. */
  plan?: Plan;
}

export function EntitlementsProvider({ children, plan = FREE_PLAN }: EntitlementsProviderProps) {
  const engine = useMemo(() => createEntitlementsEngine(plan), [plan]);

  return <EntitlementsContext.Provider value={engine}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements(): EntitlementsEngine {
  const context = useContext(EntitlementsContext);
  if (!context) {
    throw new Error('useEntitlements must be used within an EntitlementsProvider');
  }
  return context;
}
