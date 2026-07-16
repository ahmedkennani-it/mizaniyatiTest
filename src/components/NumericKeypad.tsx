import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from './Icon';
import { Txt } from './Txt';
import { acceptsAmountInput, currencyDecimals } from '../money';
import { useTheme } from '../theme';

export interface NumericKeypadProps {
  /** The amount being typed, in plain `123.45` form — never a formatted string. */
  value: string;
  onChange: (next: string) => void;
  /** Decides whether a decimal key exists at all, and how many decimals it accepts. */
  currencyCode: string;
}

/** The decimal key is `.` in the value; the label follows the locale (a comma in French). */
const DECIMAL_KEY = '.';

/**
 * The amount keypad (US-016). Custom rather than the OS keyboard: the amount is the one field
 * that matters here, and the OS decimal pad differs per platform and locale — including which
 * decimal separator it offers, which is how "42,50" becomes unparseable on one device and fine on
 * another.
 *
 * A currency with no decimals gets **no decimal key**, rather than one that silently does nothing.
 */
export function NumericKeypad({ value, onChange, currencyCode }: NumericKeypadProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const decimals = currencyDecimals(currencyCode);

  function press(key: string) {
    const next = key === DECIMAL_KEY && value === '' ? '0.' : `${value}${key}`;
    if (acceptsAmountInput(next, currencyCode)) {
      onChange(next);
    }
  }

  function backspace() {
    onChange(value.slice(0, -1));
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <View style={{ gap: theme.spacing.sm }} testID="numeric-keypad">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {keys.map((key) => (
          <KeypadKey key={key} label={key} onPress={() => press(key)} />
        ))}

        {decimals > 0 ? (
          <KeypadKey
            label={t('expenseForm.decimalSeparator')}
            accessibilityLabel={t('expenseForm.decimalKey')}
            onPress={() => press(DECIMAL_KEY)}
          />
        ) : (
          <View style={{ flexGrow: 1, flexBasis: '30%' }} />
        )}

        <KeypadKey label="0" onPress={() => press('0')} />

        <KeypadKey
          icon="delete"
          accessibilityLabel={t('expenseForm.backspaceKey')}
          onPress={backspace}
        />
      </View>
    </View>
  );
}

function KeypadKey({
  label,
  icon,
  accessibilityLabel,
  onPress,
}: {
  label?: string;
  icon?: 'delete';
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={{
        flexGrow: 1,
        flexBasis: '30%',
        minHeight: theme.minTouchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      {icon ? (
        <Icon name={icon} size={20} color={theme.colors.textPrimary} />
      ) : (
        <Txt weight="semibold" size="lg">
          {label}
        </Txt>
      )}
    </Pressable>
  );
}
