import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { SettingsMenu } from './SettingsMenu';

interface Props {
  /** "root" shows the page topic with the settings menu (top-level tabs); "back" shows a back arrow (onboarding/nested screens). */
  variant?: 'root' | 'back';
  onBack?: () => void;
  /** Small icon badge next to the page title, root variant only. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** The page's own topic/heading, shown in the card in place of a repeated app wordmark. */
  title: string;
  subtitle?: string;
}

/** Floating gradient hero card used at the top of every screen except the
 * dashboard — leads with the page topic, and on tab screens carries the
 * shared settings menu (language, reminders, care mode). */
export function AppTopBar({ variant = 'root', onBack, icon, title, subtitle }: Props) {
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.card}>
      <LinearGradient colors={gradients.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d="M0,72 C70,50 140,86 210,64 C270,46 320,68 360,54 L360,140 L0,140 Z" fill="#FFFFFF" opacity={0.16} />
        <Circle cx="90%" cy="12%" r="54" fill="#FFFFFF" opacity={0.16} />
        <Circle cx="10%" cy="86%" r="30" fill="#FFFFFF" opacity={0.12} />
      </Svg>

      <View style={styles.row}>
        {variant === 'back' ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            hitSlop={10}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.goBackAria')}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
        ) : icon ? (
          <View style={styles.iconBtn}>
            <Ionicons name={icon} size={18} color={colors.primaryDark} />
          </View>
        ) : null}

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {variant === 'root' ? (
          <Pressable
            onPress={() => setMenuVisible(true)}
            hitSlop={8}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.moreOptionsAria')}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.primaryDark} />
          </Pressable>
        ) : null}
      </View>

      <SettingsMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
