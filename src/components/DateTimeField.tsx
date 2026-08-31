import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { fontFamily, fontSize } from '../theme/typography';
import { formatDatePretty, formatTime24 } from '../state/dateUtils';
import { PrimaryButton } from './Buttons';

interface Props {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
  defaultValue?: Date;
}

export function DateTimeField({
  label,
  mode,
  value,
  onChange,
  maximumDate,
  minimumDate,
  placeholder,
  defaultValue,
}: Props) {
  const { t } = useTranslation();
  const [iosVisible, setIosVisible] = useState(false);
  const openValue = value ?? defaultValue ?? new Date();
  const [draft, setDraft] = useState(openValue);

  const displayText = value
    ? mode === 'date'
      ? formatDatePretty(value)
      : formatTime24(value)
    : placeholder ?? (mode === 'date' ? t('common.selectDate') : t('common.selectTime'));

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: openValue,
        mode,
        maximumDate,
        minimumDate,
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) onChange(selected);
        },
      });
    } else {
      setDraft(openValue);
      setIosVisible(true);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={openPicker} style={styles.field} accessibilityRole="button">
        <Text style={[styles.value, !value && styles.placeholder]}>{displayText}</Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={iosVisible} transparent animationType="slide" onRequestClose={() => setIosVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <DateTimePicker
                value={draft}
                mode={mode}
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={(_, selected) => selected && setDraft(selected)}
              />
              <PrimaryButton
                label={t('common.done')}
                onPress={() => {
                  onChange(draft);
                  setIosVisible(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  label: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInfo,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  value: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
});