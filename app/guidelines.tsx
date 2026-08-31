import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../src/components/AppTopBar';
import { Card } from '../src/components/Card';
import { Note } from '../src/components/Note';
import { OutlineButton } from '../src/components/Buttons';
import { Screen } from '../src/components/Screen';
import { ORDERED_WARNING_SIGN_KEYS, WARNING_SIGN_LABELS } from '../src/state/warningSigns';
import { colors } from '../src/theme/colors';
import { radius, spacing } from '../src/theme/spacing';
import { fontFamily, fontSize } from '../src/theme/typography';

type SectionKey = 'mosquito' | 'prevention' | 'symptoms' | 'careSteps' | 'diet' | 'warningSigns' | 'community';

const SECTIONS: { key: SectionKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'mosquito', icon: 'bug-outline' },
  { key: 'prevention', icon: 'shield-checkmark-outline' },
  { key: 'symptoms', icon: 'pulse-outline' },
  { key: 'careSteps', icon: 'medkit-outline' },
  { key: 'diet', icon: 'restaurant-outline' },
  { key: 'warningSigns', icon: 'alert-circle-outline' },
  { key: 'community', icon: 'people-outline' },
];

// Sourced from the CDC Public Health Image Library (US government work, public
// domain) and Wikimedia Commons (Creative Commons - credited per license terms).
const SECTION_IMAGES: Record<SectionKey, number> = {
  mosquito: require('../assets/welcome-mosquito.jpg'),
  prevention: require('../assets/guidelines/prevention.jpg'),
  symptoms: require('../assets/guidelines/symptoms.jpg'),
  careSteps: require('../assets/guidelines/care-steps.jpg'),
  diet: require('../assets/guidelines/diet.jpg'),
  warningSigns: require('../assets/guidelines/warning-signs.jpg'),
  community: require('../assets/guidelines/community.jpg'),
};

const IMAGE_CREDITS: Partial<Record<SectionKey, string>> = {
  prevention: 'CDC Public Health Image Library',
  symptoms: 'CDC Public Health Image Library',
  careSteps: 'CDC Public Health Image Library',
  diet: 'Photo: AntanO / Wikimedia Commons, CC BY 4.0',
  warningSigns: 'Photo: Donwoodyard / Wikimedia Commons, CC BY-SA 3.0',
  community: 'CDC Public Health Image Library',
};

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={{ marginTop: spacing.sm }}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** Dengue prevention/care reference, opened from the "Guide" row on the
 * Safety tab. Section pills up top switch between topics instead of one
 * long scroll, so any topic is a single tap away. */
export default function GuidelinesScreen() {
  const { t } = useTranslation();
  const [active, setActive] = useState<SectionKey>('mosquito');

  const bullets = active !== 'diet' && active !== 'warningSigns' ? (t(`guidelines.${active}.bullets`, { returnObjects: true }) as string[]) : [];

  return (
    <Screen>
      <AppTopBar variant="back" title={t('guidelines.screenTitle')} subtitle={t('guidelines.screenSubtitle')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll} contentContainerStyle={styles.navRow}>
        {SECTIONS.map((s) => {
          const selected = s.key === active;
          return (
            <Pressable
              key={s.key}
              onPress={() => setActive(s.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.navPill, selected && styles.navPillSelected]}
            >
              <Ionicons name={s.icon} size={15} color={selected ? colors.textOnPrimary : colors.textSecondary} />
              <Text style={[styles.navPillText, selected && styles.navPillTextSelected]}>{t(`guidelines.${s.key}.title`)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.heroWrap}>
        <Image source={SECTION_IMAGES[active]} style={styles.heroImage} resizeMode="cover" />
        {IMAGE_CREDITS[active] ? <Text style={styles.heroCredit}>{IMAGE_CREDITS[active]}</Text> : null}
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconCircle}>
            <Ionicons name={SECTIONS.find((s) => s.key === active)!.icon} size={18} color={colors.primaryDark} />
          </View>
          <Text style={styles.sectionTitle}>{t(`guidelines.${active}.title`)}</Text>
        </View>
        <Text style={styles.sectionIntro}>{t(`guidelines.${active}.intro`)}</Text>

        {active === 'diet' ? (
          <>
            <Text style={styles.subheading}>{t('guidelines.diet.preferTitle')}</Text>
            <BulletList items={t('guidelines.diet.preferBullets', { returnObjects: true }) as string[]} />
            <Text style={[styles.subheading, { marginTop: spacing.lg }]}>{t('guidelines.diet.avoidTitle')}</Text>
            <BulletList items={t('guidelines.diet.avoidBullets', { returnObjects: true }) as string[]} />
          </>
        ) : active === 'warningSigns' ? (
          <>
            <View style={{ marginTop: spacing.sm }}>
              {ORDERED_WARNING_SIGN_KEYS.map((key) => (
                <View key={key} style={styles.bulletRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginTop: 1 }} />
                  <Text style={[styles.bulletText, { marginLeft: spacing.sm }]}>{t(WARNING_SIGN_LABELS[key])}</Text>
                </View>
              ))}
            </View>
            <OutlineButton
              label={t('guidelines.warningSigns.checklistButton')}
              icon="checkmark-circle-outline"
              onPress={() => router.back()}
              style={{ marginTop: spacing.lg }}
            />
          </>
        ) : (
          <BulletList items={bullets} />
        )}
      </Card>

      <Note>{t('guidelines.disclaimer')}</Note>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navScroll: {
    marginTop: spacing.sm,
    flexGrow: 0,
  },
  navRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navPillText: {
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '600',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  navPillTextSelected: {
    color: colors.textOnPrimary,
  },
  heroWrap: {
    marginTop: spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  heroCredit: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.base,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '800',
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  sectionIntro: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
  },
  subheading: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.base,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: fontSize.sm * 1.5,
  },
});
