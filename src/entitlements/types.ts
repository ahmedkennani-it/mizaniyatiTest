export type EntitlementType = 'limit' | 'feature';

/** Mirrors the `entitlement` row shape from `docs/specs/plans-abonnements.md`, one row per key. */
export interface Entitlement {
  key: string;
  type: EntitlementType;
  numericValue?: number;
  booleanValue?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  isDefaultFree: boolean;
  entitlements: Entitlement[];
}
