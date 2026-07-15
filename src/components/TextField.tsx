import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { Txt } from './Txt';
import { useAppFont, useTheme } from '../theme';

export interface TextFieldProps extends TextInputProps {
  label: string;
  errorMessage?: string;
}

export function TextField({
  label,
  errorMessage,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { theme } = useTheme();
  const font = useAppFont();
  const [focused, setFocused] = useState(false);

  const borderColor = errorMessage
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.wrapper}>
      <Txt size="sm" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            borderColor,
            borderRadius: theme.radius.md,
            color: theme.colors.textPrimary,
            fontFamily: font.regular,
            fontSize: theme.typography.sizes.md,
            minHeight: theme.minTouchTarget,
            paddingHorizontal: theme.spacing.md,
            backgroundColor: theme.colors.surface,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textSecondary}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
      {errorMessage ? (
        <Txt size="xs" color={theme.colors.danger} style={{ marginTop: theme.spacing.xs }}>
          {errorMessage}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    width: '100%',
  },
});
