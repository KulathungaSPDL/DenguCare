import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { Banner } from '../../src/components/Banner';
import { DarkButton, OutlineButton, PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { DateTimeField } from '../../src/components/DateTimeField';
import { EmptyState } from '../../src/components/EmptyState';
import { EntryListDivider } from '../../src/components/EntryListItem';
import { FbcTrendChart } from '../../src/components/FbcTrendChart';
import { Header } from '../../src/components/Header';
import { LabeledInput } from '../../src/components/LabeledInput';
import { Screen } from '../../src/components/Screen';
import { useDeleteConfirmation } from '../../src/hooks/useDeleteConfirmation';
import { useSuccessAlert } from '../../src/hooks/useSuccessAlert';
import { formatDatePretty, formatTime24 } from '../../src/state/dateUtils';
import { usePlasmaLeakageAlert } from '../../src/state/selectors';
import { useStore } from '../../src/state/store';
import { BloodReport } from '../../src/state/types';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const illness = state.illness!;
  const [formOpen, setFormOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [when, setWhen] = useState(new Date());
  const [platelet, setPlatelet] = useState('');
  const [haematocrit, setHaematocrit] = useState('');
  const [wbc, setWbc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { atRisk, latestReport } = usePlasmaLeakageAlert(state.reports);
  const { showSuccess, modal: successModal } = useSuccessAlert();
  const { confirmDelete, modals } = useDeleteConfirmation();
  const alertedReportIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!atRisk || !latestReport) return;
    if (alertedReportIdRef.current === latestReport.id) return;
    alertedReportIdRef.current = latestReport.id;
    Alert.alert(t('fbc.plasmaLeakageTitle'), t('fbc.plasmaLeakageMessage'), [{ text: t('fbc.alertOk') }]);
  }, [atRisk, latestReport, t]);

  function openManual() {
    setPhotoUri(null);
    resetForm();
    setFormOpen(true);
  }

  function resetForm() {
    setWhen(new Date());
    setPlatelet('');
    setHaematocrit('');
    setWbc('');
    setEditingId(null);
  }

  function startEdit(report: BloodReport) {
    setPhotoUri(report.photoUri);
    setWhen(new Date(report.atISO));
    setPlatelet(report.plateletCount != null ? String(report.plateletCount) : '');
    setHaematocrit(report.haematocritPct != null ? String(report.haematocritPct) : '');
    setWbc(report.wbcCount != null ? String(report.wbcCount) : '');
    setEditingId(report.id);
    setFormOpen(true);
  }

  function deleteReport(id: string) {
    confirmDelete(() => actions.removeReport(id), {
      title: 'Delete this report?',
      message: "This blood report will be removed from your platelet and haematocrit trends. This can't be undone.",
      successMessage: 'The blood report has been removed.',
    });
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      resetForm();
      setFormOpen(true);
    }
  }

  async function chooseFile() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      resetForm();
      setFormOpen(true);
    }
  }

  function saveReport() {
    const report = {
      plateletCount: platelet.trim() ? Number(platelet) : null,
      haematocritPct: haematocrit.trim() ? Number(haematocrit) : null,
      wbcCount: wbc.trim() ? Number(wbc) : null,
      note: '',
      photoUri,
      atISO: when.toISOString(),
    };
    if (editingId) {
      actions.updateReport(editingId, report);
      showSuccess('Blood report updated.', 'Saved');
    } else {
      actions.addReport(report);
      showSuccess('Blood report saved.', 'Saved');
    }
    setFormOpen(false);
    setPhotoUri(null);
    setEditingId(null);
  }

  return (
    <Screen>
      <AppTopBar icon="document-text" title={t('topBar.bloodReports')} />
      <Header kicker="Blood reports" title="Photograph it. Type it in." subtitle="Take a picture of your full blood count for your own record, then type the numbers in." />

      <View style={styles.actionsRow}>
        <DarkButton label="Take photo" icon="camera" onPress={takePhoto} style={{ flex: 1 }} />
        <View style={{ width: spacing.md }} />
        <OutlineButton label="Choose file" icon="cloud-upload-outline" onPress={chooseFile} style={{ flex: 1 }} />
      </View>

      <OutlineButton label="Enter values manually" onPress={openManual} style={{ marginBottom: spacing.lg }} />

      <Banner icon="information-circle-outline" tone="info">
        Photos stay attached to each report, so you can compare the original lab sheet with the numbers you typed in.
      </Banner>

      {atRisk ? (
        <Banner icon="alert-circle-outline" tone="danger">
          {t('fbc.plasmaLeakageBanner')}
        </Banner>
      ) : null}

      {state.reports.length > 0 ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <FbcTrendChart reports={state.reports} feverStartISO={illness.feverStartISO} />
        </Card>
      ) : null}

      {formOpen ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={styles.cardKicker}>{editingId ? 'Edit report' : 'New report'}</Text>
          <View style={{ height: spacing.md }} />

          {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}

          <View style={styles.row}>
            <DateTimeField label="Date" mode="date" value={when} maximumDate={new Date()} onChange={(d) => setWhen((p) => combine(d, p))} />
            <View style={{ width: spacing.md }} />
            <DateTimeField label="Time" mode="time" value={when} onChange={(t) => setWhen((p) => combine(p, t))} />
          </View>

          <View style={{ height: spacing.md }} />
          <LabeledInput label="Platelet count (x10^3/uL)" keyboardType="decimal-pad" mono value={platelet} onChangeText={setPlatelet} placeholder="e.g. 145" />
          <LabeledInput label="Haematocrit (%)" keyboardType="decimal-pad" mono value={haematocrit} onChangeText={setHaematocrit} placeholder="e.g. 42" />
          <LabeledInput label="WBC count (x10^3/uL) (optional)" keyboardType="decimal-pad" mono value={wbc} onChangeText={setWbc} placeholder="e.g. 4.2" />

          <View style={styles.formActions}>
            <OutlineButton
              label="Cancel"
              onPress={() => {
                setFormOpen(false);
                resetForm();
              }}
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.md }} />
            <PrimaryButton label={editingId ? 'Save changes' : 'Save report'} onPress={saveReport} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <Card>
        {state.reports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            subtitle="Add your first blood report above - by photo or typed in - and we'll show your platelet and haematocrit trends here."
          />
        ) : (
          state.reports.map((r, i) => (
            <React.Fragment key={r.id}>
              {i > 0 && <EntryListDivider />}
              <View style={styles.reportRow}>
                <Pressable
                  onPress={() => startEdit(r)}
                  style={({ pressed }) => [styles.reportPressArea, pressed && styles.reportPressAreaPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit report"
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportDate}>
                      {formatDatePretty(new Date(r.atISO))}  -  {formatTime24(new Date(r.atISO))}
                    </Text>
                    <Text style={styles.reportValues}>
                      {r.plateletCount != null ? `Platelets ${r.plateletCount}` : 'Platelets -'}
                      {'   -   '}
                      {r.haematocritPct != null ? `HCT ${r.haematocritPct}%` : 'HCT -'}
                    </Text>
                  </View>
                  {r.photoUri ? <Image source={{ uri: r.photoUri }} style={styles.thumb} /> : null}
                </Pressable>
                <Pressable onPress={() => deleteReport(r.id)} hitSlop={10} style={styles.trash}>
                  <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </React.Fragment>
          ))
        )}
      </Card>

      {modals}
      {successModal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  cardKicker: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportPressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  reportPressAreaPressed: {
    opacity: 0.6,
  },
  trash: {
    padding: spacing.xs,
  },
  reportDate: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  reportValues: {
    marginTop: 2,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    marginLeft: spacing.md,
    backgroundColor: colors.background,
  },
});
