import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface Props {
  visible: boolean;
  title?: string;
  message: string;
  onDone: () => void;
  autoDismissMs?: number;
}

/** Brief self-dismissing confirmation with a bouncing checkmark and an
 * expanding "ping" ring, used after a destructive action completes. */
export function SuccessModal({ visible, title = 'Deleted', message, onDone, autoDismissMs = 1300 }: Props) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;
    scale.setValue(0.6);
    opacity.setValue(0);
    ring.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 100 }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onDone, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, onDone, scale, opacity, ring]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDone} />
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
            <View style={styles.iconBadge}>
              <Ionicons name="checkmark" size={30} color={colors.success} />
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
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
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});
