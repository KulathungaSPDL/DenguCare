import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface Props {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

/** Compact checkbox row (box + label), no card wrapper — for inline lists of
 * togglable items. See ConsentCheckbox for the card-wrapped onboarding variant. */
export function Checkbox({ checked, onToggle, label }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
});
