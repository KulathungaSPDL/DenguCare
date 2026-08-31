import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { DangerButton, OutlineButton, PrimaryButton } from './Buttons';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

type Tone = 'danger' | 'primary';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** 'danger' (default) is for destructive actions — red badge, shaking
   * warning icon, red confirm button. 'primary' is for routine yes/no
   * choices (switching a mode, confirming a log) — same card and buttons,
   * just without the alarming red styling. */
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}

const TONE_ICON: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  danger: 'warning',
  primary: 'help-circle',
};

/** Themed replacement for a native Alert.alert confirm/cancel dialog, used
 * for every yes/no/cancel prompt in the app so they share one look instead
 * of falling back to the OS's own alert styling. */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'danger',
  icon,
}: Props) {
  const { t } = useTranslation();
  const resolvedConfirmLabel = confirmLabel ?? t('confirmModal.yesDelete');
  const resolvedCancelLabel = cancelLabel ?? t('confirmModal.noKeepIt');
  const resolvedIcon = icon ?? TONE_ICON[tone];
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;
    scale.setValue(0.85);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();

    if (tone !== 'danger') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(wiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 90, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, scale, opacity, wiggle, tone]);

  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
  const ConfirmButton = tone === 'danger' ? DangerButton : PrimaryButton;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.iconBadge, tone === 'primary' && styles.iconBadgePrimary]}>
            <Animated.View style={tone === 'danger' ? { transform: [{ rotate }] } : undefined}>
              <Ionicons name={resolvedIcon} size={32} color={tone === 'danger' ? colors.danger : colors.primary} />
            </Animated.View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <OutlineButton label={resolvedCancelLabel} onPress={onCancel} style={{ flex: 1 }} />
            <View style={{ width: spacing.md }} />
            <ConfirmButton label={resolvedConfirmLabel} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 46, 46, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconBadgePrimary: {
    backgroundColor: colors.primarySoft,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    width: '100%',
  },
});
