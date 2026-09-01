import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { dateFromKey, dateKeysBetween, formatDatePretty, localDateKey } from '../state/dateUtils';
import { computeHourlyBuckets, filterByDateKey, HourBucket } from '../state/selectors';
import { DrinkEntry, IvFluidEntry, UrineEntry } from '../state/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { EmptyState } from './EmptyState';
import { HourlyBalanceChart } from './HourlyBalanceChart';

interface Props {
  allDrinks: DrinkEntry[];
  allUrine: UrineEntry[];
  allIvFluids?: IvFluidEntry[];
  now: Date;
  hourlyGoalMl: number;
  onDayChange?: (dateKey: string) => void;
}

interface Panel {
  key: string;
  label: string;
  buckets: HourBucket[];
}

const DAY_MS = 86400000;

/** Horizontally swipeable set of hourly charts — one panel per calendar day
 * from the very first logged entry through today, so the carousel grows a
 * page at a time as the record grows instead of always showing a fixed
 * 3-day window. Opens on today's panel. */
export function HourlyBalanceCarousel({ allDrinks, allUrine, allIvFluids = [], now, hourlyGoalMl, onDayChange }: Props) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const todayKey = localDateKey(now);
  const yesterdayKey = localDateKey(new Date(now.getTime() - DAY_MS));

  const panels: Panel[] = useMemo(() => {
    const allKeys = [...allDrinks, ...allUrine, ...allIvFluids].map((e) => localDateKey(new Date(e.atISO)));
    const earliestKey = allKeys.length > 0 ? allKeys.reduce((min, k) => (k < min ? k : min)) : todayKey;
    const startKey = earliestKey < todayKey ? earliestKey : todayKey;

    return dateKeysBetween(startKey, todayKey).map((key) => {
      const dayDrinks = filterByDateKey(allDrinks, key);
      const dayIvFluids = filterByDateKey(allIvFluids, key).map((f) => ({ atISO: f.atISO, amountMl: f.volumeMl }));
      return {
        key,
        label: key === todayKey ? t('common.today') : key === yesterdayKey ? t('common.yesterday') : formatDatePretty(dateFromKey(key)),
        buckets: computeHourlyBuckets([...dayDrinks, ...dayIvFluids], filterByDateKey(allUrine, key)),
      };
    });
  }, [allDrinks, allUrine, allIvFluids, todayKey, yesterdayKey]);

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== width) setWidth(w);
  }

  useEffect(() => {
    setPageIndex(panels.length - 1);
  }, [panels.length]);

  // Let the parent (fluid-in/out totals, entry list) know which day is on
  // screen so it can stay in sync as the user swipes between panels.
  useEffect(() => {
    const key = panels[pageIndex]?.key;
    if (key) onDayChange?.(key);
  }, [pageIndex, panels, onDayChange]);

  // contentOffset alone isn't reliably respected as an *initial* scroll
  // position across platforms (notably Android), so scroll to the last
  // (today's) page imperatively once the panel width is known.
  useEffect(() => {
    if (width > 0) scrollRef.current?.scrollTo({ x: (panels.length - 1) * width, animated: false });
  }, [width]);

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    setPageIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <View>
      <View onLayout={onLayout}>
        {width > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            contentOffset={{ x: (panels.length - 1) * width, y: 0 }}
          >
            {panels.map((p) => {
              const hasData = p.buckets.some((b) => b.drinkMl > 0 || b.urineMl > 0);
              return (
                <View key={p.key} style={{ width }}>
                  <Text style={styles.dayLabel}>{p.label}</Text>
                  {hasData ? (
                    <HourlyBalanceChart buckets={p.buckets} hourlyGoalMl={hourlyGoalMl} />
                  ) : (
                    <EmptyState icon="water-outline" title={t('fluidsScreen.noFluidsLogged')} subtitle={t('fluidsScreen.noFluidsLoggedSubtitle')} />
                  )}
                </View>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      <View style={styles.dotsRow}>
        {panels.map((p, i) => (
          <View key={p.key} style={[styles.dot, i === pageIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayLabel: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '700',
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
});
