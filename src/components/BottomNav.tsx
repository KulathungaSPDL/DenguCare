import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { radius, spacing } from '../theme/spacing';
import { fontFamily } from '../theme/typography';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  fluids: 'water',
  temp: 'thermometer',
  reports: 'add-circle-outline',
  safety: 'book-outline',
};

const LABELS: Record<string, string> = {
  index: 'Dashboard',
  fluids: 'Fluids',
  temp: 'History',
  reports: 'Report',
  safety: 'Safety',
};

interface TabBarProps {
  state: { routes: { key: string; name: string }[]; index: number };
  navigation: {
    navigate: (name: string) => void;
    emit: (e: any) => any;
  };
}

export function BottomNav({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} pointerEvents="box-none">
      <LinearGradient colors={gradients.navPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          }

          return (
            <NavItem
              key={route.key}
              onPress={onPress}
              isFocused={isFocused}
              iconName={ICONS[route.name] ?? 'ellipse-outline'}
              label={LABELS[route.name] ?? route.name}
            />
          );
        })}
      </LinearGradient>
    </View>
  );
}

function NavItem({
  onPress,
  isFocused,
  iconName,
  label,
}: {
  onPress: () => void;
  isFocused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const pop = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: isFocused ? 1 : 0, useNativeDriver: true, friction: 6, tension: 220 }).start();
  }, [isFocused, pop]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View style={[styles.itemInner, isFocused && styles.itemInnerActive, { transform: [{ scale }] }]}>
        <Ionicons name={iconName} size={20} color={isFocused ? colors.primaryDark : colors.navIconInactive} />
        <Text numberOfLines={1} style={[styles.label, isFocused && styles.labelActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  item: {
    flex: 1,
    paddingHorizontal: 2,
  },
  itemInner: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  itemInnerActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    marginTop: 3,
    fontFamily: fontFamily.baseSemiBold,
    fontSize: 10,
    color: colors.navIconInactive,
  },
  labelActive: {
    color: colors.primaryDark,
  },
});