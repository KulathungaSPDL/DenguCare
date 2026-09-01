import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { ConsentCheckbox } from '../../src/components/ConsentCheckbox';
import { EntryListDivider } from '../../src/components/EntryListItem';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/state/store';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

const BULLET_KEYS = ['consent.bullet1', 'consent.bullet2', 'consent.bullet3', 'consent.bullet4'];

const EMERGENCY_NUMBERS = [
  { labelKey: 'safetyScreen.emergency.suwaSeriya', number: '1990' },
  { labelKey: 'safetyScreen.emergency.dengueHotline', number: '1999' },
];

export default function ConsentScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const { consent } = state;
  const [expanded, setExpanded] = useState(false);

  const allChecked = consent.understandGuidance && consent.willGoToHospital && consent.agreeTerms;

  function toggle(key: 'understandGuidance' | 'willGoToHospital' | 'agreeTerms') {
    actions.setConsent({ [key]: !consent[key] });
  }

  function onContinue() {
    actions.setConsent({ agreedAtISO: new Date().toISOString() });
    router.push('/onboarding/signin');
  }

  return (
    <Screen>
      <AppTopBar variant="back" title={t('consent.title')} />

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={styles.paragraph}>{t('consent.intro')}</Text>

        <View style={styles.warningBox}>
          <View style={styles.warningHeaderRow}>
            <Ionicons name="warning" size={18} color={colors.danger} />
            <Text style={styles.warningTitle}>{t('consent.warningTitle')}</Text>
          </View>
          <Text style={styles.warningBody}>{t('consent.warningBody')}</Text>
        </View>

        <Text style={[styles.paragraph, { marginTop: spacing.lg }]}>{t('consent.finalWarning')}</Text>

        {expanded ? (
          <>
            <Text style={[styles.paragraph, { marginTop: spacing.lg }]}>{t('consent.ackIntro')}</Text>

            <View style={{ marginTop: spacing.sm }}>
              {BULLET_KEYS.map((key) => (
                <View key={key} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>-</Text>
                  <Text style={styles.bulletText}>{t(key)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.showMoreBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={expanded ? t('consent.showLess') : t('consent.showMore')}
        >
          <Text style={styles.showMoreText}>{expanded ? t('consent.showLess') : t('consent.showMore')}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </Pressable>
      </Card>

      <View style={{ marginBottom: spacing.md }}>
        <ConsentCheckbox checked={consent.understandGuidance} onToggle={() => toggle('understandGuidance')}>
          {t('consent.checkbox1')}
        </ConsentCheckbox>
        <ConsentCheckbox checked={consent.willGoToHospital} onToggle={() => toggle('willGoToHospital')}>
          {t('consent.checkbox2')}
        </ConsentCheckbox>
        <ConsentCheckbox checked={consent.agreeTerms} onToggle={() => toggle('agreeTerms')}>
          {t('consent.checkbox3')}
        </ConsentCheckbox>
      </View>

      <View style={styles.emergencyBox}>
        <View style={styles.emergencyHeaderRow}>
          <Ionicons name="call" size={16} color={colors.danger} />
          <Text style={styles.emergencyTitle}>{t('safetyScreen.emergencyNumbers')}</Text>
        </View>
        {EMERGENCY_NUMBERS.map((e, i) => (
          <React.Fragment key={e.number}>
            {i > 0 && <EntryListDivider />}
            <Pressable
              style={styles.emergencyRow}
              onPress={() => Linking.openURL(`tel:${e.number}`)}
              accessibilityRole="button"
              accessibilityLabel={`${t(e.labelKey)} ${e.number}`}
            >
              <Text style={styles.emergencyLabel}>{t(e.labelKey)}</Text>
              <Text style={styles.emergencyNumber}>{e.number}</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <PrimaryButton label={t('consent.continueButton')} disabled={!allChecked} onPress={onContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  paragraph: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.5,
  },
  warningBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    borderRadius: 16,
    padding: spacing.lg,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningTitle: {
    flex: 1,
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.md,
    color: colors.danger,
  },
  warningBody: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.danger,
    lineHeight: fontSize.sm * 1.5,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bulletDot: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  showMoreText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  emergencyBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    borderRadius: 16,
    padding: spacing.lg,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  emergencyTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.danger,
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  emergencyLabel: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  emergencyNumber: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    fontSize: fontSize.lg,
    color: colors.danger,
  },
});
