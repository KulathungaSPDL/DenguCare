import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppTopBar } from '../../src/components/AppTopBar';
import { Banner } from '../../src/components/Banner';
import { DarkButton, OutlineButton, PrimaryButton } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { Checkbox } from '../../src/components/Checkbox';
import { Chip } from '../../src/components/Chip';
import { DateTimeField } from '../../src/components/DateTimeField';
import { EmptyState } from '../../src/components/EmptyState';
import { EntryListDivider } from '../../src/components/EntryListItem';
import { FbcTrendChart } from '../../src/components/FbcTrendChart';
import { Header } from '../../src/components/Header';
import { ImageViewerModal } from '../../src/components/ImageViewerModal';
import { LabeledInput } from '../../src/components/LabeledInput';
import { Screen } from '../../src/components/Screen';
import { useDeleteConfirmation } from '../../src/hooks/useDeleteConfirmation';
import { useNow } from '../../src/hooks/useNow';
import { useProUpsell } from '../../src/hooks/useProUpsell';
import { useSuccessAlert } from '../../src/hooks/useSuccessAlert';
import { formatDatePretty, formatTime24, illnessDayNumber } from '../../src/state/dateUtils';
import { usePlasmaLeakageAlert } from '../../src/state/selectors';
import { useStore } from '../../src/state/store';
import { BloodReport, DengueTestRecord, DengueTestResult, DengueTestType } from '../../src/state/types';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';
import { fontFamily, fontSize } from '../../src/theme/typography';

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

const DENGUE_TEST_TYPES: { key: DengueTestType; labelKey: string }[] = [
  { key: 'ns1', labelKey: 'reportsScreen.dengueTestType.ns1' },
  { key: 'igm', labelKey: 'reportsScreen.dengueTestType.igm' },
  { key: 'igg', labelKey: 'reportsScreen.dengueTestType.igg' },
  { key: 'pcr', labelKey: 'reportsScreen.dengueTestType.pcr' },
];

const DENGUE_TEST_RESULTS: { key: DengueTestResult; labelKey: string }[] = [
  { key: 'positive', labelKey: 'reportsScreen.dengueTestResult.positive' },
  { key: 'negative', labelKey: 'reportsScreen.dengueTestResult.negative' },
  { key: 'pending', labelKey: 'reportsScreen.dengueTestResult.pending' },
];

// Sri Lanka Ministry of Health dengue guidance: NS1 antigen is most sensitive
// in the first ~3 days of fever; after that an antibody (IgM) test is the
// recommended follow-up since NS1 sensitivity drops off.
const NS1_RELIABLE_UP_TO_DAY = 3;

type DengueTestFormEntry = { checked: boolean; result: DengueTestResult; photoUri: string | null };
type DengueTestFormState = Record<DengueTestType, DengueTestFormEntry>;

function emptyDengueTestForm(): DengueTestFormState {
  return {
    ns1: { checked: false, result: 'pending', photoUri: null },
    igm: { checked: false, result: 'pending', photoUri: null },
    igg: { checked: false, result: 'pending', photoUri: null },
    pcr: { checked: false, result: 'pending', photoUri: null },
  };
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { state, actions } = useStore();
  const now = useNow();
  const illness = state.illness!;

  // --- Blood report (FBC) card ---
  const [formOpen, setFormOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [when, setWhen] = useState(new Date());
  const [platelet, setPlatelet] = useState('');
  const [haematocrit, setHaematocrit] = useState('');
  const [wbc, setWbc] = useState('');
  const [neutrophils, setNeutrophils] = useState('');
  const [lymphocytes, setLymphocytes] = useState('');
  const [monocytes, setMonocytes] = useState('');
  const [mpv, setMpv] = useState('');
  const [hgb, setHgb] = useState('');
  const [moreValuesOpen, setMoreValuesOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Dengue test card (NS1/IgM/IgG/PCR) — separate entity, own save ---
  const [dengueFormOpen, setDengueFormOpen] = useState(false);
  const [dengueWhen, setDengueWhen] = useState(new Date());
  const [dengueTestsForm, setDengueTestsForm] = useState<DengueTestFormState>(emptyDengueTestForm());
  const [editingDengueId, setEditingDengueId] = useState<string | null>(null);
  const [editingDengueType, setEditingDengueType] = useState<DengueTestType | null>(null);

  // --- Full-screen zoomable photo viewer, shared by both cards ---
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const currentDay = illnessDayNumber(illness.feverStartISO, now);
  const ns1TimingPassed = currentDay > NS1_RELIABLE_UP_TO_DAY;
  const hasDengueTest = state.dengueTests.length > 0;

  const { atRisk, latestReport } = usePlasmaLeakageAlert(state.reports);
  const { showSuccess, modal: successModal } = useSuccessAlert();
  const { showProUpsell, modal: proUpsellModal } = useProUpsell();
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
    setNeutrophils('');
    setLymphocytes('');
    setMonocytes('');
    setMpv('');
    setHgb('');
    setMoreValuesOpen(false);
    setEditingId(null);
  }

  function startEdit(report: BloodReport) {
    setPhotoUri(report.photoUri);
    setWhen(new Date(report.atISO));
    setPlatelet(report.plateletCount != null ? String(report.plateletCount) : '');
    setHaematocrit(report.haematocritPct != null ? String(report.haematocritPct) : '');
    setWbc(report.wbcCount != null ? String(report.wbcCount) : '');
    setNeutrophils(report.neutrophilsCount != null ? String(report.neutrophilsCount) : '');
    setLymphocytes(report.lymphocytesCount != null ? String(report.lymphocytesCount) : '');
    setMonocytes(report.monocytesCount != null ? String(report.monocytesCount) : '');
    setMpv(report.mpv != null ? String(report.mpv) : '');
    setHgb(report.hgb != null ? String(report.hgb) : '');
    setMoreValuesOpen(
      report.neutrophilsCount != null || report.lymphocytesCount != null || report.monocytesCount != null || report.mpv != null || report.hgb != null
    );
    setEditingId(report.id);
    setFormOpen(true);
  }

  function deleteReport(id: string) {
    confirmDelete(() => actions.removeReport(id), {
      title: t('reportsScreen.deleteReportTitle'),
      message: t('reportsScreen.deleteReportMsg'),
      successMessage: t('reportsScreen.deleteReportSuccess'),
    });
  }

  function takePhoto() {
    showProUpsell(t('proUpsell.takePhotoMessage'));
  }

  function chooseFile() {
    showProUpsell(t('proUpsell.chooseFileMessage'));
  }

  function saveReport() {
    const report = {
      plateletCount: platelet.trim() ? Number(platelet) : null,
      haematocritPct: haematocrit.trim() ? Number(haematocrit) : null,
      wbcCount: wbc.trim() ? Number(wbc) : null,
      neutrophilsCount: neutrophils.trim() ? Number(neutrophils) : null,
      lymphocytesCount: lymphocytes.trim() ? Number(lymphocytes) : null,
      monocytesCount: monocytes.trim() ? Number(monocytes) : null,
      mpv: mpv.trim() ? Number(mpv) : null,
      hgb: hgb.trim() ? Number(hgb) : null,
      note: '',
      photoUri,
      atISO: when.toISOString(),
    };
    if (editingId) {
      actions.updateReport(editingId, report);
      showSuccess(t('reportsScreen.reportUpdated'), t('logging.savedTitle'));
    } else {
      actions.addReport(report);
      showSuccess(t('reportsScreen.reportSaved'), t('logging.savedTitle'));
    }
    setFormOpen(false);
    setPhotoUri(null);
    setEditingId(null);
  }

  function openDengueForm() {
    resetDengueForm();
    setDengueFormOpen(true);
  }

  function resetDengueForm() {
    setDengueWhen(new Date());
    setDengueTestsForm(emptyDengueTestForm());
    setEditingDengueId(null);
    setEditingDengueType(null);
  }

  function startEditDengueTest(record: DengueTestRecord) {
    setDengueWhen(new Date(record.atISO));
    const form = emptyDengueTestForm();
    form[record.type] = { checked: true, result: record.result, photoUri: record.photoUri };
    setDengueTestsForm(form);
    setEditingDengueId(record.id);
    setEditingDengueType(record.type);
    setDengueFormOpen(true);
  }

  function deleteDengueTest(id: string) {
    confirmDelete(() => actions.removeDengueTest(id), {
      title: t('reportsScreen.deleteDengueTestTitle'),
      message: t('reportsScreen.deleteDengueTestMsg'),
      successMessage: t('reportsScreen.deleteDengueTestSuccess'),
    });
  }

  function toggleDengueTest(type: DengueTestType) {
    setDengueTestsForm((prev) => ({ ...prev, [type]: { ...prev[type], checked: !prev[type].checked } }));
  }

  function setDengueResultFor(type: DengueTestType, result: DengueTestResult) {
    setDengueTestsForm((prev) => ({ ...prev, [type]: { ...prev[type], result } }));
  }

  function removeDenguePhoto(type: DengueTestType) {
    setDengueTestsForm((prev) => ({ ...prev, [type]: { ...prev[type], photoUri: null } }));
  }

  async function takeDenguePhoto(type: DengueTestType) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      setDengueTestsForm((prev) => ({ ...prev, [type]: { ...prev[type], photoUri: result.assets[0].uri } }));
    }
  }

  async function chooseDenguePhoto(type: DengueTestType) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      setDengueTestsForm((prev) => ({ ...prev, [type]: { ...prev[type], photoUri: result.assets[0].uri } }));
    }
  }

  const checkedDengueTypes = DENGUE_TEST_TYPES.filter((opt) => dengueTestsForm[opt.key].checked);
  const canSaveDengue = editingDengueId ? true : checkedDengueTypes.length > 0;

  function saveDengueTests() {
    if (!canSaveDengue) return;
    if (editingDengueId && editingDengueType) {
      const entry = dengueTestsForm[editingDengueType];
      actions.updateDengueTest(editingDengueId, editingDengueType, entry.result, entry.photoUri, dengueWhen.toISOString());
      showSuccess(t('reportsScreen.dengueTestUpdated'), t('logging.savedTitle'));
    } else {
      checkedDengueTypes.forEach((opt) => {
        const entry = dengueTestsForm[opt.key];
        actions.addDengueTest(opt.key, entry.result, entry.photoUri, dengueWhen.toISOString());
      });
      showSuccess(t('reportsScreen.dengueTestSaved'), t('logging.savedTitle'));
    }
    setDengueFormOpen(false);
    resetDengueForm();
  }

  const visibleDengueTypes = editingDengueType ? DENGUE_TEST_TYPES.filter((opt) => opt.key === editingDengueType) : DENGUE_TEST_TYPES;

  return (
    <Screen>
      <AppTopBar icon="document-text" title={t('topBar.bloodReports')} />
      <Header title={t('reportsScreen.headerTitle')} subtitle={t('reportsScreen.headerSubtitle')} />

      <View style={styles.actionsRow}>
        <DarkButton label={t('reportsScreen.takePhoto')} icon="camera" onPress={takePhoto} style={{ flex: 1 }} />
        <View style={{ width: spacing.md }} />
        <OutlineButton label={t('reportsScreen.chooseFile')} icon="cloud-upload-outline" onPress={chooseFile} style={{ flex: 1 }} />
      </View>

      <OutlineButton label={t('reportsScreen.enterManually')} onPress={openManual} style={{ marginBottom: spacing.lg }} />

      <Banner icon="information-circle-outline" tone="info">
        {t('reportsScreen.photoBannerNote')}
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
          <Text style={styles.cardKicker}>{editingId ? t('reportsScreen.editReport') : t('reportsScreen.newReport')}</Text>
          <View style={{ height: spacing.md }} />

          {photoUri ? (
            <Pressable onPress={() => setViewerUri(photoUri)} accessibilityRole="button" accessibilityLabel={t('reportsScreen.viewPhotoAria')}>
              <Image source={{ uri: photoUri }} style={styles.preview} />
            </Pressable>
          ) : null}

          <View style={styles.row}>
            <DateTimeField label={t('common.date')} mode="date" value={when} maximumDate={new Date()} onChange={(d) => setWhen((p) => combine(d, p))} />
            <View style={{ width: spacing.md }} />
            <DateTimeField label={t('common.time')} mode="time" value={when} onChange={(t) => setWhen((p) => combine(p, t))} />
          </View>

          <View style={{ height: spacing.md }} />
          <LabeledInput label={t('reportsScreen.plateletLabel')} keyboardType="decimal-pad" mono value={platelet} onChangeText={setPlatelet} placeholder={t('reportsScreen.plateletPlaceholder')} />
          <LabeledInput label={t('reportsScreen.haematocritLabel')} keyboardType="decimal-pad" mono value={haematocrit} onChangeText={setHaematocrit} placeholder={t('reportsScreen.haematocritPlaceholder')} />
          <LabeledInput label={t('reportsScreen.wbcLabel')} keyboardType="decimal-pad" mono value={wbc} onChangeText={setWbc} placeholder={t('reportsScreen.wbcPlaceholder')} />

          <Pressable onPress={() => setMoreValuesOpen((v) => !v)} style={styles.moreValuesToggle} accessibilityRole="button">
            <Text style={styles.moreValuesToggleText}>
              {moreValuesOpen ? t('common.hide') : t('common.show')} {t('reportsScreen.moreValuesLabel')}
            </Text>
            <Ionicons name={moreValuesOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryDark} />
          </Pressable>

          {moreValuesOpen ? (
            <>
              <LabeledInput
                label={t('reportsScreen.neutrophilsLabel')}
                keyboardType="decimal-pad"
                mono
                value={neutrophils}
                onChangeText={setNeutrophils}
                placeholder={t('reportsScreen.neutrophilsPlaceholder')}
              />
              <LabeledInput
                label={t('reportsScreen.lymphocytesLabel')}
                keyboardType="decimal-pad"
                mono
                value={lymphocytes}
                onChangeText={setLymphocytes}
                placeholder={t('reportsScreen.lymphocytesPlaceholder')}
              />
              <LabeledInput
                label={t('reportsScreen.monocytesLabel')}
                keyboardType="decimal-pad"
                mono
                value={monocytes}
                onChangeText={setMonocytes}
                placeholder={t('reportsScreen.monocytesPlaceholder')}
              />
              <LabeledInput label={t('reportsScreen.mpvLabel')} keyboardType="decimal-pad" mono value={mpv} onChangeText={setMpv} placeholder={t('reportsScreen.mpvPlaceholder')} />
              <LabeledInput label={t('reportsScreen.hgbLabel')} keyboardType="decimal-pad" mono value={hgb} onChangeText={setHgb} placeholder={t('reportsScreen.hgbPlaceholder')} />
            </>
          ) : null}

          <View style={styles.formActions}>
            <OutlineButton
              label={t('common.cancel')}
              onPress={() => {
                setFormOpen(false);
                resetForm();
              }}
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.md }} />
            <PrimaryButton label={editingId ? t('common.saveChanges') : t('reportsScreen.saveReport')} onPress={saveReport} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <Card style={{ marginBottom: spacing.lg }}>
        {state.reports.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title={t('reportsScreen.noReportsYet')}
            subtitle={t('reportsScreen.noReportsSubtitle')}
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
                  accessibilityLabel={t('reportsScreen.editReportAria')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportDate}>
                      {formatDatePretty(new Date(r.atISO))}  -  {formatTime24(new Date(r.atISO))}
                    </Text>
                    <Text style={styles.reportValues}>
                      {r.plateletCount != null ? t('reportsScreen.plateletsValue', { value: r.plateletCount }) : t('reportsScreen.plateletsDash')}
                      {'   -   '}
                      {r.haematocritPct != null ? t('reportsScreen.hctValue', { value: r.haematocritPct }) : t('reportsScreen.hctDash')}
                    </Text>
                  </View>
                  {r.photoUri ? (
                    <Pressable
                      onPress={() => setViewerUri(r.photoUri)}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={t('reportsScreen.viewPhotoAria')}
                    >
                      <Image source={{ uri: r.photoUri }} style={styles.thumb} />
                    </Pressable>
                  ) : null}
                </Pressable>
                <Pressable onPress={() => deleteReport(r.id)} hitSlop={10} style={styles.trash}>
                  <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </React.Fragment>
          ))
        )}
      </Card>

      <Text style={styles.sectionTitle}>{t('reportsScreen.dengueTestSectionTitle')}</Text>

      {!hasDengueTest ? (
        ns1TimingPassed ? (
          <Banner icon="flask-outline" tone="warning">
            {t('reportsScreen.ns1TimingNote', { day: currentDay })}
          </Banner>
        ) : (
          <Banner icon="flask-outline" tone="info">
            {t('reportsScreen.ns1EarlyNote', { day: currentDay })}
          </Banner>
        )
      ) : null}

      <OutlineButton label={t('reportsScreen.addDengueTest')} icon="add" onPress={openDengueForm} style={{ marginBottom: spacing.lg }} />

      {dengueFormOpen ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={styles.cardKicker}>{editingDengueId ? t('reportsScreen.editDengueTest') : t('reportsScreen.newDengueTest')}</Text>
          <View style={{ height: spacing.md }} />

          <View style={styles.row}>
            <DateTimeField label={t('common.date')} mode="date" value={dengueWhen} maximumDate={new Date()} onChange={(d) => setDengueWhen((p) => combine(d, p))} />
            <View style={{ width: spacing.md }} />
            <DateTimeField label={t('common.time')} mode="time" value={dengueWhen} onChange={(tm) => setDengueWhen((p) => combine(p, tm))} />
          </View>

          <View style={{ height: spacing.md }} />
          <Text style={styles.fieldLabel}>{t('reportsScreen.dengueTestLabel')}</Text>

          {visibleDengueTypes.map((opt) => {
            const entry = dengueTestsForm[opt.key];
            return (
              <View key={opt.key} style={styles.dengueTestBlock}>
                <Checkbox checked={entry.checked} onToggle={() => toggleDengueTest(opt.key)} label={t(opt.labelKey)} />

                {entry.checked ? (
                  <View style={styles.dengueTestDetail}>
                    <View style={styles.chipsRow}>
                      {DENGUE_TEST_RESULTS.map((r) => (
                        <Chip
                          key={r.key}
                          label={t(r.labelKey)}
                          selected={entry.result === r.key}
                          onPress={() => setDengueResultFor(opt.key, r.key)}
                        />
                      ))}
                    </View>

                    {entry.photoUri ? (
                      <View style={styles.dengueTestPhotoRow}>
                        <Pressable
                          onPress={() => setViewerUri(entry.photoUri)}
                          accessibilityRole="button"
                          accessibilityLabel={t('reportsScreen.viewPhotoAria')}
                        >
                          <Image source={{ uri: entry.photoUri }} style={styles.dengueTestThumb} />
                        </Pressable>
                        <Pressable
                          onPress={() => removeDenguePhoto(opt.key)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={t('reportsScreen.removePhotoAria')}
                        >
                          <Ionicons name="close-circle" size={20} color={colors.danger} />
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.dengueTestUploadRow}>
                        <Pressable onPress={() => takeDenguePhoto(opt.key)} style={styles.dengueTestUploadBtn}>
                          <Ionicons name="camera-outline" size={15} color={colors.primary} />
                          <Text style={styles.dengueTestUploadText}>{t('reportsScreen.takePhoto')}</Text>
                        </Pressable>
                        <Pressable onPress={() => chooseDenguePhoto(opt.key)} style={styles.dengueTestUploadBtn}>
                          <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />
                          <Text style={styles.dengueTestUploadText}>{t('reportsScreen.chooseFile')}</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}

          <View style={styles.formActions}>
            <OutlineButton
              label={t('common.cancel')}
              onPress={() => {
                setDengueFormOpen(false);
                resetDengueForm();
              }}
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.md }} />
            <PrimaryButton
              label={editingDengueId ? t('common.saveChanges') : t('reportsScreen.saveDengueTest')}
              onPress={saveDengueTests}
              disabled={!canSaveDengue}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : null}

      <Card>
        {state.dengueTests.length === 0 ? (
          <EmptyState
            icon="flask-outline"
            title={t('reportsScreen.noDengueTestsYet')}
            subtitle={t('reportsScreen.noDengueTestsSubtitle')}
          />
        ) : (
          state.dengueTests.map((test, i) => (
            <React.Fragment key={test.id}>
              {i > 0 && <EntryListDivider />}
              <View style={styles.reportRow}>
                <Pressable
                  onPress={() => startEditDengueTest(test)}
                  style={({ pressed }) => [styles.reportPressArea, pressed && styles.reportPressAreaPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t('reportsScreen.editReportAria')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportDate}>
                      {formatDatePretty(new Date(test.atISO))}  -  {formatTime24(new Date(test.atISO))}
                    </Text>
                    <View style={[styles.dengueBadge, test.result === 'positive' && styles.dengueBadgePositive]}>
                      {test.photoUri ? (
                        <Ionicons
                          name="image-outline"
                          size={11}
                          color={test.result === 'positive' ? colors.danger : colors.textSecondary}
                          style={{ marginRight: 3 }}
                        />
                      ) : null}
                      <Text style={[styles.dengueBadgeText, test.result === 'positive' && styles.dengueBadgeTextPositive]}>
                        {t(DENGUE_TEST_TYPES.find((o) => o.key === test.type)!.labelKey)}: {t(`reportsScreen.dengueTestResult.${test.result}`)}
                      </Text>
                    </View>
                  </View>
                  {test.photoUri ? (
                    <Pressable
                      onPress={() => setViewerUri(test.photoUri)}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={t('reportsScreen.viewPhotoAria')}
                    >
                      <Image source={{ uri: test.photoUri }} style={styles.thumb} />
                    </Pressable>
                  ) : null}
                </Pressable>
                <Pressable onPress={() => deleteDengueTest(test.id)} hitSlop={10} style={styles.trash}>
                  <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </React.Fragment>
          ))
        )}
      </Card>

      <View style={{ height: spacing.xxl }} />

      {modals}
      {successModal}
      {proUpsellModal}
      <ImageViewerModal visible={viewerUri != null} uri={viewerUri} onClose={() => setViewerUri(null)} />
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
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontFamily: fontFamily.baseExtraBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  dengueTestBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dengueTestDetail: {
    paddingLeft: 30,
    paddingBottom: spacing.sm,
  },
  dengueTestPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dengueTestThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  dengueTestUploadRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dengueTestUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  dengueTestUploadText: {
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.primaryDark,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  moreValuesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  moreValuesToggleText: {
    fontFamily: fontFamily.baseBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  dengueBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  dengueBadgePositive: {
    backgroundColor: colors.dangerSoft,
  },
  dengueBadgeText: {
    fontFamily: fontFamily.baseSemiBold,
    fontWeight: '600',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dengueBadgeTextPositive: {
    color: colors.danger,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    marginLeft: spacing.md,
    backgroundColor: colors.background,
  },
});
