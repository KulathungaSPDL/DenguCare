import React, { useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface Props {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const STEP_SCALE = 0.75;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** Full-screen photo viewer for an uploaded report — pinch to zoom, drag to
 * pan while zoomed, double-tap to toggle zoom, tap the X or backdrop to close.
 * Also exposes +/- buttons since pinch gestures aren't always available
 * (simulators, some Android devices) — those are the only reliable way in
 * to zoom on every setup. Needs its own GestureHandlerRootView: RN's Modal
 * renders into a separate native surface, so the one at the app root
 * doesn't reach gestures inside it. */
export function ImageViewerModal({ visible, uri, onClose }: Props) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [visible, uri, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  function stepZoom(delta: number) {
    const next = Math.min(Math.max(savedScale.value + delta, MIN_SCALE), MAX_SCALE);
    scale.value = withTiming(next);
    savedScale.value = next;
    if (next <= 1) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value <= 1) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomingIn = scale.value <= 1;
      scale.value = withTiming(zoomingIn ? DOUBLE_TAP_SCALE : 1);
      savedScale.value = zoomingIn ? DOUBLE_TAP_SCALE : 1;
      if (!zoomingIn) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const composedGesture = Gesture.Race(doubleTapGesture, Gesture.Simultaneous(pinchGesture, panGesture));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.backdrop}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        {uri ? (
          <GestureDetector gesture={composedGesture}>
            <Animated.Image source={{ uri }} style={[styles.image, animatedStyle]} resizeMode="contain" />
          </GestureDetector>
        ) : null}

        <Text style={styles.hint}>{t('imageViewer.hint')}</Text>

        <View style={styles.zoomControls}>
          <Pressable
            onPress={() => stepZoom(-STEP_SCALE)}
            style={styles.zoomBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('imageViewer.zoomOutAria')}
          >
            <Ionicons name="remove" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => stepZoom(STEP_SCALE)}
            style={styles.zoomBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('imageViewer.zoomInAria')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,12,12,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 54,
    right: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.82,
  },
  hint: {
    position: 'absolute',
    bottom: 108,
    alignSelf: 'center',
    fontFamily: fontFamily.base,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 46,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  zoomBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
