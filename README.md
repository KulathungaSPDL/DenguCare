# DenguCare

A cross-platform (iOS + Android, via Expo Go) dengue home-care companion app: consent →
sign-in → profile → "when did the fever start" onboarding, then a 5-tab tracker (Today,
Fluids, Temp, Reports, Safety) for logging fluids/urine, temperature, blood report
values, and warning signs against national dengue home-care guidance.

This build implements the screens from the reference screenshots end-to-end with local
(on-device) state — there is no backend yet. It's built to run in **Expo Go**, no native
build step required.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Or press `a` / `i` in
the terminal for an emulator/simulator, or `w` for web.

## Tech stack

- **Expo SDK 57**, TypeScript, **Expo Router** (file-based navigation) — `app/`
- Local state: React Context + `useReducer`, persisted to `@react-native-async-storage/async-storage`
  as a single JSON blob (`src/state/store.tsx`). No backend/API calls yet.
- Charts (fever curve, hourly fluid balance): hand-rolled with `react-native-svg` — no
  charting library dependency.
- Date/time pickers: `@react-native-community/datetimepicker`.
- Photo capture for blood reports: `expo-image-picker`.
- Icons: `@expo/vector-icons` (Ionicons).

## Project structure

```
app/
  _layout.tsx            Root stack + providers
  index.tsx               Redirect router (consent → sign-in → profile → fever-start → tabs)
  onboarding/
    consent.tsx
    signin.tsx
    profile.tsx
    fever-start.tsx
  (tabs)/
    _layout.tsx            Bottom tab bar
    index.tsx               Today
    fluids.tsx
    temp.tsx
    reports.tsx
    safety.tsx
src/
  components/              Reusable UI (Buttons, Card, charts, form fields, ...)
  state/                   Types, store/actions, date & fluid-target math, selectors
  theme/                   Colours, spacing, type scale
  hooks/                   useNow()
```

## What's real vs. stubbed

**Real / functional:**
- Full onboarding flow with validation, gating logic, and AsyncStorage persistence.
- Today/Fluids/Temp tabs: logging drinks, urine, and temperature readings; day-strip
  navigation; hourly and daily fluid-balance math; fever-curve and hourly-balance charts
  driven by real logged data.
- Reports tab: camera / photo-library capture (`expo-image-picker`) or manual entry,
  saved locally with the photo kept as a reference image.
- Safety tab: warning-sign checklist, tap-to-call emergency numbers, "start a new
  illness record" reset flow.

**Stubbed / placeholder, called out for the next pass:**
- **Sign-in** (`onboarding/signin.tsx`) is simulated — no real Google/Apple/OTP auth
  yet. Swap in Firebase Auth or Supabase Auth per the on-screen note.
- **Automatic blood-report reading** (photo → extracted platelet/haematocrit values) is
  not implemented. The Reports tab banner references `EXPO_PUBLIC_ANTHROPIC_API_KEY`
  (see `.env.example`) for where that would plug in.
- **Push/local notifications** for the hourly drink reminder are not wired up — the bell
  icon on Today is currently a visual toggle only.
- **Fluid/urine target formulas** (`src/state/calculations.ts`) are placeholders chosen
  to land close to the reference numbers, clearly commented as such. Per the app's own
  consent and Safety-tab disclaimers, every threshold needs clinical-panel review before
  real patients rely on it.

## Notes on a few product decisions

- All "which day am I on" / "what hour is it" logic is anchored to `Asia/Colombo`
  (`src/state/dateUtils.ts`), not the device's timezone, since the app targets Sri Lanka.
- The day-strip on Today (1–10, shaded 3–7) is tap-to-preview; only the *current*
  calendar day accepts new log entries.
- "Start a new illness record" (Safety tab) clears fluid/temp/report/warning-sign
  history but keeps the saved profile, and sends the user back through the "when did the
  fever start" step.

Let me know what you'd like built next and I'll pick this back up.
