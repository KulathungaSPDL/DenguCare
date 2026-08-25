// Gradient pairs layered on top of theme/colors.ts - used with expo-linear-gradient
// wherever a flat fill should read as soft/dimensional (headers, buttons, hero cards).
// Keep this the single source of truth for gradients - no inline color arrays in screens.
export const gradients = {
  screen: ['#F9FCFC', '#EAF6F4'] as const,
  header: ['#E4FAF8', '#B8EBE8'] as const,
  primaryButton: ['#1B7E7C', '#0B4444'] as const,
  darkButton: ['#1B3A3A', '#0A1F1F'] as const,
  navPill: ['#FFFFFF', '#EEF9F8'] as const,
  heroTeal: ['#0B4444', '#115C5C', '#1E8080'] as const,
  cardGlow: ['#FFFFFF', '#F3FBFA'] as const,
  warmGlow: ['#FBF2DE', '#F3E8D2'] as const,
  dangerGlow: ['#FBEAE7', '#F6D9D3'] as const,
  successGlow: ['#E4F5E8', '#D2ECD8'] as const,
} as const;
