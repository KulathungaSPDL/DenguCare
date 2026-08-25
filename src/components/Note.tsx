import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

/** Left-accent muted note, used for disclaimers throughout the app. */
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar} />
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
  },
});
