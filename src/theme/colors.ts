// DenguCare colour palette: clean clinical-modern - neutral light-grey
// canvas, deep teal brand, muted gold for fluid-output, white floating cards.
// Keep this the single source of truth for colour - no hex literals in screens.
export const colors = {
  // Backgrounds
  background: '#F6FAFA',
  backgroundEnd: '#EAF6F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EAD6', // warm gold-tinted highlight (reminder banners)
  surfaceMutedBorder: '#E4D2A8',

  // Brand
  ink: '#0F2E2E', // deep teal-black, used for dark buttons / headings
  primary: '#115C5C', // deep teal, used for accent buttons, active states, progress
  primaryDark: '#0B4444',
  primarySoft: '#DCEEEC',
  primaryMist: '#BFEDEA',

  // Fluids
  drinkIn: '#115C5C', // teal (IN / drinks)
  urineOut: '#CBA148', // muted gold (OUT / urine)
  urineOutSoft: '#F3E8D2',
  water: '#5AA9E6',
  kingCoconut: '#7FA65C',
  juice: '#4D9A9A',
  soup: '#A8794F',
  other: '#94A3A3',
  ivFluid: '#3D6FB4',

  // Status
  success: '#3F8F5F',
  successSoft: '#E0EFE0',

  // Text
  textPrimary: '#20393A', // dark teal-grey
  textSecondary: '#5C7373',
  textMuted: '#8FA3A3',
  textOnDark: '#F4F7F6',
  textOnPrimary: '#FFFFFF',

  // Utility
  border: '#DCE6E6', // light teal-grey
  borderStrong: '#C3D2D2',
  borderInfo: '#BFDDD6',
  borderDanger: '#E7B7AE',
  shadow: '#0B2A2A',
  danger: '#B3382C',
  dangerSoft: '#F6E3E0',
  warning: '#CBA148',
  accentBlue: '#256FAE',
  accentBlueSoft: '#E1F2FF',
  accentPurple: '#633DB8',
  accentPurpleSoft: '#EEE7FA',
  accentAmber: '#DD951A',
  accentAmberSoft: '#FFF0D6',

  // Chart
  chartGrid: '#E4EDED',
  chartBand: '#F3E8D2',
  chartLine: '#277B87',
  chartDashed: '#CBA148',
  plateletLine: '#7A5C99',
  hctLine: '#277B87',

  // App chrome (cyan header, floating pill nav) - the redesigned "reference" look
  headerBg: '#BEEAEA',
  headerBgBorder: '#A6DEDF',
  navBg: '#F9FFFF',
  navActive: '#74D6D6',
  navIconInactive: '#617273',

  // Badges / accents
  badgeInfoSoft: '#EAE1F8',
  badgeInfoText: '#8354BE',
  outputText: '#8A4A22',
} as const;

export type ColorToken = keyof typeof colors;
