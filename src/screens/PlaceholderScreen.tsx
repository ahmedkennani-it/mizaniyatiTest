import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

export interface PlaceholderScreenProps {
  title: string;
  message: string;
}

/** Generic "not built yet" screen body for tabs whose real content lands in a later user story. */
export function PlaceholderScreen({ title, message }: PlaceholderScreenProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontSize: theme.typography.sizes.xxl,
          fontWeight: theme.typography.weightBold,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.sizes.md,
          marginTop: theme.spacing.sm,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
