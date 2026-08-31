import React, { useEffect, useRef, useState } from 'react';
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

import { formatDatePretty, localDateKey } from '../state/dateUtils';
import { filterByDateKey, useHourlyBuckets } from '../state/selectors';
import { DrinkEntry, UrineEntry } from '../state/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { EmptyState } from './EmptyState';
import { HourlyBalanceChart } from './HourlyBalanceChart';

interface Props {
  allDrinks: DrinkEntry[];
  allUrine: UrineEntry[];
  now: Date;
  hourlyGoalMl: number;
}

const DAY_MS = 86400000;

/** Horizontally swipeable set of hourly charts — today plus the two days
 * before it — so the pattern from earlier days stays a swipe away instead
 * of only ever showing "today". Opens on today's panel. */
export function HourlyBalanceCarousel({ allDrinks, allUrine, now, hourlyGoalMl }: Props) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const [pageIndex, setPageIndex] = useState(2);
  const scrollRef = useRef<ScrollView>(null);

  const key0 = localDateKey(now);
  const key1 = localDateKey(new Date(now.getTime() - DAY_MS));
  const key2 = localDateKey(new Date(now.getTime() - 2 * DAY_MS));

  const buckets0 = useHourlyBuckets(filterByDateKey(allDrinks, key0), filterByDateKey(allUrine, key0));
  const buckets1 = useHourlyBuckets(filterByDateKey(allDrinks, key1), filterByDateKey(allUrine, key1));
  const buckets2 = useHourlyBuckets(filterByDateKey(allDrinks, key2), filterByDateKey(allUrine, key2));

  const panels = [
    { label: formatDatePretty(new Date(now.getTime() - 2 * DAY_MS)), buckets: buckets2 },
    { label: t('common.yesterday'), buckets: buckets1 },
    { label: t('common.today'), buckets: buckets0 },
  ];

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== width) setWidth(w);
  }

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
            {panels.map((p, i) => {
              const hasData = p.buckets.some((b) => b.drinkMl > 0 || b.urineMl > 0);
              return (
                <View key={i} style={{ width }}>
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
        {panels.map((_, i) => (
          <View key={i} style={[styles.dot, i === pageIndex && styles.dotActive]} />
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
