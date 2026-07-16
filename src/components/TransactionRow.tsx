import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Amount } from './Amount';
import { Card } from './Card';
import { IconTile } from './IconTile';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import type { SupportedLanguage } from '../i18n';
import { formatRelativeDate } from '../i18n/dateFormat';
import { useTheme } from '../theme';
import type { AccentName } from '../theme';

export interface TransactionRowProps {
  /** The row's label — a note, or the category name when there is no note. */
  title: string;
  /** ISO instant the transaction happened, rendered as a relative date. */
  occurredAt: string;
  /** Household member the transaction belongs to; omitted for a single-member household. */
  memberName?: string;
  /** **Signed** minor amount: negative for an expense. See `Amount`. */
  amountMinor: number;
  currencyCode: string;
  icon: IconName;
  accent?: AccentName;
  onPress?: () => void;
  /** Injectable clock, so the relative date is testable without freezing global time. */
  now?: Date;
}

/**
 * One transaction in a list (US-074b): category glyph, label, "relative date · member", and the
 * signed amount colored by sign. Replaces the hand-rolled composition each screen used to build
 * out of `ListRow`, which pasted an absolute `YYYY-MM-DD` in the subtitle.
 */
export function TransactionRow({
  title,
  occurredAt,
  memberName,
  amountMinor,
  currencyCode,
  icon,
  accent = 'teal',
  onPress,
  now,
}: TransactionRowProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;

  const dateLabel = formatRelativeDate(new Date(occurredAt), language, now);
  const subtitle = memberName ? `${dateLabel} · ${memberName}` : dateLabel;

  const body = (
    <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      <IconTile icon={icon} accent={accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt weight="semibold" size="sm">
          {title}
        </Txt>
        <Txt size="xs" color={theme.colors.textSecondary}>
          {subtitle}
        </Txt>
      </View>
      {/* US-012: an expense reads "-240,00", an income "+5 000,00" — the sign carries the
          meaning, so a user who can't tell the colours apart still can. */}
      <Amount
        amountMinor={amountMinor}
        currencyCode={currencyCode}
        showPlusSign
        weight="semibold"
        size="sm"
      />
    </Card>
  );

  if (!onPress) {
    return body;
  }
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  );
}
