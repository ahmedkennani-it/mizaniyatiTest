import React from 'react';

import { Pill } from './Pill';
import { useTheme } from '../theme';

export interface TrustChipProps {
  label: string;
}

/**
 * Privacy trust chip ("saisie manuelle · aucune connexion bancaire" / "بدون ربط بالبنك") — the
 * recurring reassurance required by `.claude/rules/legal-disclaimers.md` on the dashboard and
 * onboarding. A teal-wash `Pill` with a shield icon.
 */
export function TrustChip({ label }: TrustChipProps) {
  const { theme } = useTheme();
  return (
    <Pill
      icon="shield-check"
      label={label}
      background={theme.accents.teal.wash}
      color={theme.accents.teal.ink}
      style={{ alignSelf: 'center' }}
    />
  );
}
