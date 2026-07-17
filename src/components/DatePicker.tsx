import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { MonthSelector } from './MonthSelector';
import { Txt } from './Txt';
import { buildCalendarGrid, nextMonthKey, previousMonthKey } from '../calendar';
import { useLanguage } from '../i18n';
import { formatMonthLabel } from '../i18n/dateFormat';
import { resolveIntlLocale } from '../i18n/numberFormat';
import { useTheme } from '../theme';

export interface DatePickerProps {
  /** Selected date, ISO `YYYY-MM-DD`. */
  value: string;
  onChange: (date: string) => void;
  /** Days after this one are shown disabled — defaults to today (US-019: no future date). */
  maxDate: string;
}

/** Sunday-first short weekday labels in the active language ("dim.", "Sun", "أحد"…). */
function weekdayLabels(language: ReturnType<typeof useLanguage>['language']): string[] {
  const { locale } = resolveIntlLocale(language);
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // 2023-01-01 was a Sunday — an arbitrary known Sunday to read the week's short names off of.
  return Array.from({ length: 7 }, (_unused, index) =>
    formatter.format(new Date(Date.UTC(2023, 0, 1 + index))),
  );
}

/**
 * Compact month-grid date picker (US-019) — built rather than a native picker, same call as
 * `NumericKeypad` (US-016): a consistent, testable control across platforms instead of three
 * different native widgets. Future days (past `maxDate`) are shown but disabled, not merely
 * validated after the fact — the same "answer known before asked" principle as the keypad's
 * disabled Save.
 */
export function DatePicker({ value, onChange, maxDate }: DatePickerProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [viewMonth, setViewMonth] = useState(value.slice(0, 7));

  const grid = useMemo(() => buildCalendarGrid(viewMonth, maxDate), [viewMonth, maxDate]);
  const labels = useMemo(() => weekdayLabels(language), [language]);
  const disableNext = nextMonthKey(viewMonth) > maxDate.slice(0, 7);

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <MonthSelector
        label={formatMonthLabel(viewMonth, language)}
        onPrev={() => setViewMonth((month) => previousMonthKey(month))}
        onNext={() => setViewMonth((month) => nextMonthKey(month))}
        disableNext={disableNext}
      />
      <View style={{ flexDirection: 'row' }}>
        {labels.map((label, index) => (
          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
            <Txt size="xs" color={theme.colors.textSecondary}>
              {label}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {grid.map((cell, index) => {
          if (!cell) {
            return <View key={index} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          }
          const selected = cell.date === value;
          return (
            <View key={cell.date} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={cell.date}
                accessibilityState={{ selected, disabled: cell.isFuture }}
                disabled={cell.isFuture}
                onPress={() => onChange(cell.date)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: theme.radius.full,
                  backgroundColor: selected ? theme.colors.primary : 'transparent',
                  opacity: cell.isFuture ? 0.35 : 1,
                }}
              >
                <Txt
                  size="sm"
                  weight={cell.isToday && !selected ? 'bold' : 'regular'}
                  color={selected ? theme.colors.primaryText : theme.colors.textPrimary}
                >
                  {Number(cell.date.slice(8, 10))}
                </Txt>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
