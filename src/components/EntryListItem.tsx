import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

export function EntryListItem({
  icon,
  iconColor,
  title,
  time,
  valueLabel,
  onPress,
  onDelete,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  time: string;
  valueLabel: string;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={18} color={iconColor ?? colors.textSecondary} style={styles.icon} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <Text style={styles.value}>{valueLabel}</Text>
    </>
  );

  return (
    <View style={styles.row}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
          style={({ pressed }) => [styles.pressArea, pressed && styles.pressAreaPressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.pressArea}>{content}</View>
      )}
      {onPress ? (
        <Pressable
          onPress={onPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
          style={styles.edit}
        >
          <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10} style={styles.trash}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EntryListDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pressAreaPressed: {
    opacity: 0.6,
  },
  icon: {
    marginRight: spacing.md,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  time: {
    marginTop: 2,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  value: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  edit: {
    marginRight: spacing.sm,
  },
  trash: {
    padding: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
