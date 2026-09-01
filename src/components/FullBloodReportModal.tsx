import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { formatDatePretty, formatTime24, illnessDayNumber } from '../state/dateUtils';
import { BloodReport } from '../state/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
  reports: BloodReport[];
  feverStartISO: string | null;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2;
const STEP_SCALE = 0.5;

const LOW_PLATELET_THRESHOLD = 100; // matches the plasma-leakage check elsewhere - flag it here too

const COL = {
  dateTime: 130,
  day: 48,
  wbc: 66,
  neut: 66,
  lymph: 66,
  mono: 66,
  plt: 66,
  mpv: 66,
  hgb: 66,
  hct: 66,
  note: 170,
};

/** Full-screen, pinch-zoomable trend table for every blood report on
 * record - a doctor-facing "everything in one place" grid since the
 * stacked entry list above the FBC chart doesn't scan well once there
 * are many readings. Panning works at any zoom level since the table is
 * almost always wider than the screen. Needs its own
 * GestureHandlerRootView since RN's Modal renders into a separate native
 * surface (mirrors ImageViewerModal's zoom rig). */
export function FullBloodReportModal({ visible, onClose, reports, feverStartISO }: Props) {
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
  }, [visible, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  function stepZoom(delta: number) {
    const next = Math.min(Math.max(savedScale.value + delta, MIN_SCALE), MAX_SCALE);
    scale.value = withTiming(next);
    savedScale.value = next;
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
      const next = scale.value <= 1 ? DOUBLE_TAP_SCALE : 1;
      scale.value = withTiming(next);
      savedScale.value = next;
    });

  const composedGesture = Gesture.Race(doubleTapGesture, Gesture.Simultaneous(pinchGesture, panGesture));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.backdrop}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('fullReportModal.title')}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {reports.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('reportsScreen.noReportsYet')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.viewport}>
              <GestureDetector gesture={composedGesture}>
                <Animated.View style={[styles.table, animatedStyle]}>
                  <View style={styles.row}>
                    <Cell width={COL.dateTime} header>
                      {t('fullReportModal.dateTimeHeader')}
                    </Cell>
                    <Cell width={COL.day} header>
                      {t('fullReportModal.dayHeader')}
                    </Cell>
                    <Cell width={COL.wbc} header>
                      {t('fullReportModal.wbcHeader')}
                    </Cell>
                    <Cell width={COL.neut} header>
                      {t('fullReportModal.neutHeader')}
                    </Cell>
                    <Cell width={COL.lymph} header>
                      {t('fullReportModal.lymphHeader')}
                    </Cell>
                    <Cell width={COL.mono} header>
                      {t('fullReportModal.monoHeader')}
                    </Cell>
                    <Cell width={COL.plt} header>
                      {t('fullReportModal.pltHeader')}
                    </Cell>
                    <Cell width={COL.mpv} header>
                      {t('fullReportModal.mpvHeader')}
                    </Cell>
                    <Cell width={COL.hgb} header>
                      {t('fullReportModal.hgbHeader')}
                    </Cell>
                    <Cell width={COL.hct} header>
                      {t('fullReportModal.hctHeader')}
                    </Cell>
                    <Cell width={COL.note} header last>
                      {t('fullReportModal.noteHeader')}
                    </Cell>
                  </View>

                  {reports.map((r) => {
                    const d = new Date(r.atISO);
                    const dayNumber = feverStartISO ? illnessDayNumber(feverStartISO, d) : null;
                    const lowPlatelet = r.plateletCount != null && r.plateletCount < LOW_PLATELET_THRESHOLD;
                    return (
                      <View key={r.id} style={styles.row}>
                        <Cell width={COL.dateTime}>{`${formatDatePretty(d)}  ${formatTime24(d)}`}</Cell>
                        <Cell width={COL.day}>{dayNumber != null ? String(dayNumber) : '—'}</Cell>
                        <Cell width={COL.wbc}>{r.wbcCount != null ? String(r.wbcCount) : '—'}</Cell>
                        <Cell width={COL.neut}>{r.neutrophilsCount != null ? String(r.neutrophilsCount) : '—'}</Cell>
                        <Cell width={COL.lymph}>{r.lymphocytesCount != null ? String(r.lymphocytesCount) : '—'}</Cell>
                        <Cell width={COL.mono}>{r.monocytesCount != null ? String(r.monocytesCount) : '—'}</Cell>
                        <Cell width={COL.plt} danger={lowPlatelet}>
                          {r.plateletCount != null ? String(r.plateletCount) : '—'}
                        </Cell>
                        <Cell width={COL.mpv}>{r.mpv != null ? String(r.mpv) : '—'}</Cell>
                        <Cell width={COL.hgb}>{r.hgb != null ? String(r.hgb) : '—'}</Cell>
                        <Cell width={COL.hct}>{r.haematocritPct != null ? String(r.haematocritPct) : '—'}</Cell>
                        <Cell width={COL.note} last>
                          {r.note || '—'}
                        </Cell>
                      </View>
                    );
                  })}
                </Animated.View>
              </GestureDetector>
            </View>

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
          </>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

function Cell({
  width,
  header,
  last,
  danger,
  children,
}: {
  width: number;
  header?: boolean;
  last?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.cell, { width }, header && styles.cellHeader, last && styles.cellLast]}>
      <Text style={[styles.cellText, header && styles.cellTextHeader, danger && styles.cellTextDanger]} numberOfLines={3}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,12,12,0.94)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  table: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  cellHeader: {
    backgroundColor: colors.background,
  },
  cellLast: {
    borderRightWidth: 1,
  },
  cellText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textPrimary,
  },
  cellTextHeader: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cellTextDanger: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    color: colors.danger,
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
    alignSelf: 'center',
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
