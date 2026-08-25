// Screens lean on two families: Inter for headings/body copy, and JetBrains
// Mono for numbers, dates and times (weights, ml,  C, clock). Both are
// loaded as static weight files in app/_layout.tsx via useFonts - see
// GOOGLE_FONTS_TO_LOAD below.
export const fontFamily = {
  base: 'Inter_400Regular',
  baseMedium: 'Inter_500Medium',
  baseSemiBold: 'Inter_600SemiBold',
  baseBold: 'Inter_700Bold',
  baseExtraBold: 'Inter_800ExtraBold',
  baseExtraBoldItalic: 'Inter_800ExtraBold_Italic',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
};

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 34,
};
