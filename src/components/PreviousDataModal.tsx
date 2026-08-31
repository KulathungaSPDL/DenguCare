import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from './EmptyState';
import { EntryListDivider } from './EntryListItem';
import { ReportBody } from './ReportBody';
import { getFluidTargets } from '../state/calculations';
import { buildArchivedReportData } from '../state/doctorReport';
import { formatDatePretty } from '../state/dateUtils';
import { useStore } from '../state/store';
import { ArchivedIllness } from '../state/types';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function entryCount(a: ArchivedIllness): number {
  return a.drinks.length + a.urine.length + a.ivFluids.length + a.temps.length + a.reports.length + a.medicationDoses.length;
}

/** Browses illness records archived by "Start New Illness Record" — the
 * data that used to be wiped outright is now kept here so a patient (or
 * their doctor) can still look back at a past episode. List view picks a
 * record; detail view is the same ReportBody the live Doctor Report uses,
 * anchored to that illness's own dates instead of the current moment. */
export function PreviousDataModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { state } = useStore();
  const [selected, setSelected] = useState<ArchivedIllness | null>(null);

  function handleClose() {
    setSelected(null);
    onClose();
  }

  const targets = selected ? getFluidTargets(state.profile.weightKg, state.profile.dobISO, new Date()) : null;
  const detailData = selected ? buildArchivedReportData(selected, state.profile.dobISO, new Date()) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            {selected ? (
              <Pressable onPress={() => setSelected(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('previousDataModal.backAria')}>
                <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
              </Pressable>
            ) : (
              <View style={{ width: 22 }} />
            )}
            <Text style={styles.title}>{t('previousDataModal.title')}</Text>
            <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('doctorReportModal.closeAria')}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {selected && detailData && targets ? (
              <ReportBody data={detailData} profile={state.profile} targets={targets} visible={visible} />
            ) : state.archivedIllnesses.length === 0 ? (
              <EmptyState icon="time-outline" title={t('previousDataModal.emptyTitle')} subtitle={t('previousDataModal.emptySubtitle')} />
            ) : (
              state.archivedIllnesses.map((a, i) => (
                <React.Fragment key={a.illness.id}>
                  {i > 0 && <EntryListDivider />}
                  <Pressable
                    onPress={() => setSelected(a)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    accessibilityRole="button"
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>
                        {formatDatePretty(new Date(a.illness.feverStartISO))}
                        {a.illness.endedAtISO ? `  –  ${formatDatePretty(new Date(a.illness.endedAtISO))}` : ''}
                      </Text>
                      <Text style={styles.rowSubtitle}>{t('previousDataModal.entryCount', { count: entryCount(a) })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </Pressable>
                </React.Fragment>
              ))
            )}

            <View style={{ height: spacing.lg }} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    marginTop: 2,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
