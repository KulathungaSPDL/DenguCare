import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

export function WarningSignRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!checked) {
      scale.setValue(1);
      return;
    }
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 160 }).start();
  }, [checked, scale]);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.box, checked && styles.boxChecked, { transform: [{ scale }] }]}>
        {checked ? <Ionicons name="checkmark" size={15} color={colors.textOnPrimary} /> : null}
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
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
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  label: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
});
