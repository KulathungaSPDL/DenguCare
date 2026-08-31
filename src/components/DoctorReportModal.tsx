import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ReportBody } from './ReportBody';
import { getFluidTargets } from '../state/calculations';
import { buildDoctorReportData } from '../state/doctorReport';
import { useStore } from '../state/store';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Full-detail "Doctor Report" popup, opened from the Safety tab, for the
 * current illness. Shows everything relevant for a clinician in one
 * scrollable page — patient info, active warning signs, fluid balance, and
 * the full temperature, medication, and blood-report history — instead of
 * a shared PDF, since printing/sharing turned out to be unreliable across
 * web and Android. Past illnesses are the same view, reached from
 * PreviousDataModal instead of here. */
export function DoctorReportModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { state } = useStore();
  const data = buildDoctorReportData(state, new Date());
  const targets = getFluidTargets(state.profile.weightKg, state.profile.dobISO, data.now);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('doctorReportModal.title')}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('doctorReportModal.closeAria')}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <ReportBody data={data} profile={state.profile} targets={targets} visible={visible} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,20,18,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '92%',
  },
  scroll: {
    flexGrow: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
});
