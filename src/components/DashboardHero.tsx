import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useStore } from '../state/store';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { initialsFor } from '../utils/initials';
import { SettingsMenu } from './SettingsMenu';

interface Props {
  needsAttention?: boolean;
}

// Natural pixel size of assets/welcome-background.png — used to scale it to
// exactly cover the card (measured via onLayout, not CSS percentages: RN's
// layout engine doesn't reliably resolve height:'100%' on an absolutely
// positioned child of a minHeight-only parent, so we compute real pixels).
const BG_W = 1774;
const BG_H = 887;

export function DashboardHero({ needsAttention }: Props) {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const { profile } = state;

  // Captured once at mount so the first-open welcome copy stays on screen for
  // this visit even after markDashboardWelcomeSeen() flips the persisted flag —
  // it should only disappear on the *next* app open, not mid-session.
  const [showWelcome] = useState(() => !state.dashboardWelcomeSeen);

  useEffect(() => {
    if (!state.dashboardWelcomeSeen) actions.markDashboardWelcomeSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onCardLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setCardSize({ width, height });
  }

  // Cover-fit, anchored to the bottom-right corner so the shield illustration
  // (which sits right-of-centre in the artwork) always lands in that corner
  // and any crop comes off the empty top-left instead.
  const scale = Math.max(cardSize.width / BG_W, cardSize.height / BG_H, 0);
  const bgWidth = BG_W * scale;
  const bgHeight = BG_H * scale;

  return (
    <View style={styles.card} onLayout={onCardLayout}>
      {cardSize.width > 0 && cardSize.height > 0 ? (
        <Image
          source={require('../../assets/welcome-background.png')}
          style={[styles.bgImage, { width: bgWidth, height: bgHeight }]}
          resizeMode="stretch"
        />
      ) : null}

      <View style={styles.topRow}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsFor(profile.name)}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.name.trim() || t('topBar.patientFallback')}
            </Text>
          </View>
        </View>

        <View style={styles.iconColumn}>
          <Pressable
            onPress={() => actions.setRemindersOn(!state.remindersOn)}
            hitSlop={8}
            style={styles.bellBtn}
            accessibilityRole="button"
            accessibilityLabel={t('settingsMenu.hourlyRemindersAria')}
          >
            <Ionicons name={state.remindersOn ? 'notifications' : 'notifications-outline'} size={19} color={colors.primaryDark} />
            {needsAttention ? <View style={styles.badgeDot} /> : null}
          </Pressable>
          <Pressable
            onPress={() => setMenuVisible(true)}
            hitSlop={8}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.moreOptionsAria')}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.primaryDark} />
          </Pressable>
        </View>
      </View>

      <View style={styles.greetingBlock}>
        {showWelcome ? (
          <>
            <Text style={styles.greeting}>
              {t('dashboard.firstWelcome', { name: profile.name.trim() || t('topBar.patientFallback') })}
            </Text>
            <Text style={styles.welcomeSubtitle}>{t('dashboard.welcomeDescription')}</Text>
          </>
        ) : (
          <>
            <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
            <Text style={styles.subtitle}>{t('dashboard.heroSubtitle')}</Text>
          </>
        )}
      </View>

      <SettingsMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  card: {
    minHeight: 188,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.headerBg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.xl,
    color: colors.primaryDark,
  },
  identityText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.xxl,
    color: colors.ink,
  },
  iconColumn: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  bellBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBlock: {
    marginTop: spacing.xl,
    maxWidth: '68%',
  },
  greeting: {
    fontFamily: fontFamily.baseExtraBold,
    fontWeight: '800',
    fontSize: fontSize.xxl,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.4,
    color: colors.textPrimary,
  },
  welcomeSubtitle: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.4,
    color: colors.primaryDark,
  },
});