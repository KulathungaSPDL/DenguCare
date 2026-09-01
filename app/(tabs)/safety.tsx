import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { Banner } from '../../src/components/Banner';
import { Card } from '../../src/components/Card';
import { DangerButton, DarkButton } from '../../src/components/Buttons';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { DoctorReportModal } from '../../src/components/DoctorReportModal';
import { EntryListDivider } from '../../src/components/EntryListItem';
import { LinkRow } from '../../src/components/LinkRow';
import { Note } from '../../src/components/Note';
import { Screen } from '../../src/components/Screen';
import { WarningSignRow } from '../../src/components/WarningSignRow';
import { useNow } from '../../src/hooks/useNow';
import { sumMl } from '../../src/state/calculations';
import { localDateKey } from '../../src/state/dateUtils';
import { filterByDateKey, useFluidSummary, useLowUrineOutputWarning } from '../../src/state/selectors';
import { useStore } from '../../src/state/store';
import { ORDERED_WARNING_SIGN_KEYS, WARNING_SIGN_LABELS } from '../../src/state/warningSigns';
import { WarningSignKey } from '../../src/state/types';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

const EMERGENCY_NUMBERS = [
  { labelKey: 'safetyScreen.emergency.suwaSeriya', number: '1990' },
  { labelKey: 'safetyScreen.emergency.dengueHotline', number: '1999' },
  { labelKey: 'safetyScreen.emergency.govInfoCentre', number: '1919' },
];

const SIGN_STYLE: Record<WarningSignKey, { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  abdominal_pain: { icon: 'body-outline', bg: colors.dangerSoft, fg: colors.danger },
  persistent_vomiting: { icon: 'water-outline', bg: colors.badgeInfoSoft, fg: colors.badgeInfoText },
  bleeding: { icon: 'water', bg: colors.dangerSoft, fg: colors.danger },
  confused_restless: { icon: 'help-circle-outline', bg: colors.surfaceMuted, fg: colors.textSecondary },
  dizzy_faint: { icon: 'body', bg: colors.primarySoft, fg: colors.primary },
  cold_clammy: { icon: 'snow-outline', bg: colors.primarySoft, fg: colors.primary },
  no_urine_6h: { icon: 'flask-outline', bg: colors.urineOutSoft, fg: colors.outputText },
  breathless_swelling: { icon: 'fitness-outline', bg: colors.badgeInfoSoft, fg: colors.badgeInfoText },
  fever_settled_worse: { icon: 'thermometer-outline', bg: colors.dangerSoft, fg: colors.danger },
};

export default function SafetyScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const now = useNow();

  const { inMl, outMl } = useFluidSummary(state, now);
  const isAdmitted = state.careMode === 'admitted';
  const todayIvMl = isAdmitted
    ? sumMl(filterByDateKey(state.ivFluids, localDateKey(now)).map((f) => ({ amountMl: f.volumeMl })))
    : 0;
  const showLowUrineOutputWarning = useLowUrineOutputWarning(inMl + todayIvMl, outMl);

  const anyChecked = ORDERED_WARNING_SIGN_KEYS.some((k) => state.warningSigns[k]);
  const [reportVisible, setReportVisible] = useState(false);
  const [newRecordConfirmVisible, setNewRecordConfirmVisible] = useState(false);

  function callEmergency() {
    Linking.openURL(`tel:${EMERGENCY_NUMBERS[0].number}`);
  }

  function confirmNewRecord() {
    setNewRecordConfirmVisible(true);
  }

  function startNewRecord() {
    setNewRecordConfirmVisible(false);
    actions.resetIllness();
    router.replace('/onboarding/fever-start');
  }

  return (
    <Screen>
      <AppTopBar icon="shield-checkmark" title={t('topBar.safety')} />

      <LinkRow
        icon="book-outline"
        label={t('guidelines.button')}
        onPress={() => router.push('/guidelines')}
      />
      <View style={{ height: spacing.lg }} />

      <Card style={styles.introCard}>
        <View style={styles.introHeaderRow}>
          <View style={styles.introIconCircle}>
            <Ionicons name="warning" size={20} color={colors.danger} />
          </View>
          <Text style={styles.introTitle}>{t('safetyScreen.criticalWarningSigns')}</Text>
        </View>
        <Text style={styles.introBody}>{t('safetyScreen.introBody')}</Text>
      </Card>

      {anyChecked ? (
        <Banner icon="alert-circle-outline" tone="danger">
          {t('safetyScreen.goToHospitalBanner')}
        </Banner>
      ) : null}

      {showLowUrineOutputWarning ? (
        <Banner icon="flask-outline" tone="danger">
          {t('safetyScreen.lowUrineOutputBanner')}
        </Banner>
      ) : null}

      <View>
        {ORDERED_WARNING_SIGN_KEYS.map((key) => (
          <WarningSignRow
            key={key}
            label={t(WARNING_SIGN_LABELS[key])}
            icon={SIGN_STYLE[key].icon}
            iconBg={SIGN_STYLE[key].bg}
            iconColor={SIGN_STYLE[key].fg}
            checked={state.warningSigns[key]}
            onToggle={() => actions.setWarningSign(key, !state.warningSigns[key])}
          />
        ))}
      </View>

      <DangerButton label={t('safetyScreen.callEmergency')} icon="call" onPress={callEmergency} style={{ marginTop: spacing.sm }} />

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardKicker}>{t('safetyScreen.emergencyNumbers')}</Text>
        {EMERGENCY_NUMBERS.map((e, i) => (
          <React.Fragment key={e.number}>
            {i > 0 && <EntryListDivider />}
            <Pressable style={styles.numberRow} onPress={() => Linking.openURL(`tel:${e.number}`)}>
              <Text style={styles.numberLabel}>{t(e.labelKey)}</Text>
              <Text style={styles.numberValue}>{e.number}</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </Card>

      <DarkButton
        label={t('doctorSummary.button')}
        icon="document-text-outline"
        onPress={() => setReportVisible(true)}
        style={{ marginTop: spacing.lg }}
      />
      <DoctorReportModal visible={reportVisible} onClose={() => setReportVisible(false)} />

      <Pressable
        onPress={confirmNewRecord}
        style={({ pressed }) => [styles.newRecordBtn, pressed && styles.newRecordBtnPressed]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primaryDark} />
        <Text style={styles.newRecordLabel}>{t('safetyScreen.startNewRecord')}</Text>
      </Pressable>

      <Note>{t('safetyScreen.finalNote')}</Note>

      <ConfirmModal
        visible={newRecordConfirmVisible}
        title={t('safetyScreen.confirmNewRecordTitle')}
        message={t('safetyScreen.confirmNewRecordMsg')}
        confirmLabel={t('safetyScreen.startNewRecordBtn')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        icon="refresh"
        onConfirm={startNewRecord}
        onCancel={() => setNewRecordConfirmVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  introCard: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    marginBottom: spacing.lg,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  introIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  introTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.lg,
    color: colors.danger,
  },
  introBody: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  numberLabel: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  numberValue: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.primaryDark,
  },
  newRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: 16,
    marginTop: spacing.lg,
    backgroundColor: colors.primarySoft,
  },
  newRecordBtnPressed: {
    opacity: 0.85,
  },
  newRecordLabel: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.primaryDark,
  },
});
