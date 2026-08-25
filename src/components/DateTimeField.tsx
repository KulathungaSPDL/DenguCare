import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const [iosVisible, setIosVisible] = useState(false);
  const openValue = value ?? defaultValue ?? new Date();
  const [draft, setDraft] = useState(openValue);

  const displayText = value
    ? mode === 'date'
      ? formatDatePretty(value)
      : formatTime24(value)
    : placeholder ?? (mode === 'date' ? 'Select a date' : 'Select a time');

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
      <Pressable onPress={openPicker} style={styles.field}>
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
                label="Done"
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
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
});
