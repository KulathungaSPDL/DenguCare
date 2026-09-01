import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { EntryListDivider, EntryListItem } from './EntryListItem';
import { SegmentedToggle } from './SegmentedToggle';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { formatTime24 } from '../state/dateUtils';
import { drinkKindColor } from '../state/drinkKinds';
import { DrinkEntry, IvFluidEntry, UrineEntry } from '../state/types';

type EntryTab = 'drinks' | 'urine' | 'iv';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  drinks: DrinkEntry[];
  urine: UrineEntry[];
  ivFluids: IvFluidEntry[];
  showIv: boolean;
  onEditDrink: (entry: DrinkEntry) => void;
  onDeleteDrink: (id: string) => void;
  onEditUrine: (entry: UrineEntry) => void;
  onDeleteUrine: (id: string) => void;
  onEditIv: (entry: IvFluidEntry) => void;
  onDeleteIv: (id: string) => void;
}

/** Centered popup opened from the hourly chart's info icon - shows every
 * entry behind whichever day the chart is currently on, split into
 * Drinks / Urine / IV Fluid tabs. Tapping a row edits it; the trash icon
 * deletes it. Only the entry list scrolls; the header and tabs stay put. */
export function DayEntriesModal({
  visible,
  onClose,
  title,
  drinks,
  urine,
  ivFluids,
  showIv,
  onEditDrink,
  onDeleteDrink,
  onEditUrine,
  onDeleteUrine,
  onEditIv,
  onDeleteIv,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<EntryTab>('drinks');
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setTab('drinks');
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 90 }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [visible, scale, opacity]);

  const options: { value: EntryTab; label: string }[] = [
    { value: 'drinks', label: t('dayEntriesModal.drinksTab') },
    { value: 'urine', label: t('dayEntriesModal.urineTab') },
    ...(showIv ? [{ value: 'iv' as const, label: t('dayEntriesModal.ivTab') }] : []),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <SegmentedToggle options={options} value={tab} onChange={setTab} />
          <View style={{ height: spacing.md }} />

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {tab === 'drinks' &&
              (drinks.length === 0 ? (
                <Text style={styles.empty}>{t('dayEntriesModal.noDrinks')}</Text>
              ) : (
                drinks.map((d, i) => (
                  <React.Fragment key={d.id}>
                    {i > 0 && <EntryListDivider />}
                    <EntryListItem
                      icon="water-outline"
                      iconColor={drinkKindColor(d.kind)}
                      title={t(`drinkKinds.${d.kind}`)}
                      time={formatTime24(new Date(d.atISO))}
                      valueLabel={`${d.amountMl} ml`}
                      onPress={() => onEditDrink(d)}
                      onDelete={() => onDeleteDrink(d.id)}
                    />
                  </React.Fragment>
                ))
              ))}

            {tab === 'urine' &&
              (urine.length === 0 ? (
                <Text style={styles.empty}>{t('dayEntriesModal.noUrine')}</Text>
              ) : (
                urine.map((u, i) => (
                  <React.Fragment key={u.id}>
                    {i > 0 && <EntryListDivider />}
                    <EntryListItem
                      icon="flask-outline"
                      iconColor={colors.urineOut}
                      title={t('dayEntriesModal.urineTab')}
                      time={formatTime24(new Date(u.atISO))}
                      valueLabel={`${u.amountMl} ml`}
                      onPress={() => onEditUrine(u)}
                      onDelete={() => onDeleteUrine(u.id)}
                    />
                  </React.Fragment>
                ))
              ))}

            {tab === 'iv' &&
              (ivFluids.length === 0 ? (
                <Text style={styles.empty}>{t('ivFluids.empty')}</Text>
              ) : (
                ivFluids.map((f, i) => (
                  <React.Fragment key={f.id}>
                    {i > 0 && <EntryListDivider />}
                    <EntryListItem
                      icon="medkit-outline"
                      iconColor={colors.ivFluid}
                      title={t(`ivFluids.fluidTypes.${f.fluidType}`)}
                      time={formatTime24(new Date(f.atISO))}
                      valueLabel={
                        f.rateMlPerHr != null ? `${f.volumeMl} ml  -  ${f.rateMlPerHr} ml/hr` : `${f.volumeMl} ml`
                      }
                      onPress={() => onEditIv(f)}
                      onDelete={() => onDeleteIv(f.id)}
                    />
                  </React.Fragment>
                ))
              ))}
          </ScrollView>
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
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
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
  list: {
    maxHeight: 340,
  },
  empty: {
    fontFamily: fontFamily.base,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
});
