import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Txt } from './Txt';
import type { IconName } from './Icon';
import { useTheme } from '../theme';

export interface HeaderAction {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Small dot badge (e.g. unread notifications). */
  badge?: boolean;
  /** Optional short text shown next to the icon (e.g. "FR" language pill). */
  text?: string;
}

export interface ScreenHeaderProps {
  /** Large page title (list/detail screens). Omit when using `greeting`+`name`. */
  title?: string;
  /** Greeting header variant: avatar + "greeting, name" + the household underneath. */
  greeting?: string;
  name?: string;
  /** The household this person belongs to — shown under the greeting (US-005). */
  householdName?: string;
  /** Back chevron on the reading-start side. */
  onBack?: () => void;
  /** Trailing action buttons (bell, language, add…). */
  actions?: HeaderAction[];
}

function ActionButton({ action }: { action: HeaderAction }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      // The badge dot is decorative to a screen reader, so what it *means* rides on the label.
      accessibilityLabel={
        action.badge
          ? `${action.accessibilityLabel}, ${t('a11y.unreadNotifications')}`
          : action.accessibilityLabel
      }
      onPress={action.onPress}
      // The mockup's 34px button is below the 44px minimum touch target, so the tap area is
      // widened without touching the visual size.
      hitSlop={8}
      style={{
        minHeight: 34,
        paddingHorizontal: action.text ? 12 : 0,
        width: action.text ? undefined : 34,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
      }}
    >
      <View>
        <Icon name={action.icon} size={16} color={theme.colors.textPrimary} />
        {action.badge ? (
          <View
            style={{
              position: 'absolute',
              top: -3,
              end: -3,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: theme.accents.coral.solid,
            }}
          />
        ) : null}
      </View>
      {action.text ? (
        <Txt weight="semibold" size="xs">
          {action.text}
        </Txt>
      ) : null}
    </Pressable>
  );
}

/**
 * Two header shapes from the mockup: (a) a **greeting** header (avatar + "Bonjour" + household name
 * + trailing actions) for the dashboard, and (b) a **title** header (large title, optional back
 * chevron, trailing actions) for list/detail screens. `flexDirection: 'row'` mirrors under RTL and
 * the back chevron auto-flips (shared `Icon`). Pass either `title` or `greeting`+`name`.
 */
export function ScreenHeader({
  title,
  greeting,
  name,
  householdName,
  onBack,
  actions,
}: ScreenHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('a11y.back')}
            onPress={onBack}
            hitSlop={8}
            style={{
              width: 34,
              height: 34,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="chevron-left" size={18} color={theme.colors.textPrimary} />
          </Pressable>
        ) : null}

        {greeting !== undefined ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}
          >
            <Avatar name={name ?? ''} />
            <View style={{ flex: 1 }}>
              <Txt weight="semibold" size="md">
                {name ? `${greeting}, ${name}` : greeting}
              </Txt>
              {householdName ? (
                <Txt size="xs" color={theme.colors.textSecondary}>
                  {householdName}
                </Txt>
              ) : null}
            </View>
          </View>
        ) : (
          <Txt weight="extrabold" size="xl" style={{ flex: 1 }}>
            {title}
          </Txt>
        )}
      </View>

      {actions && actions.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {actions.map((action, index) => (
            <ActionButton key={`${action.icon}-${index}`} action={action} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
