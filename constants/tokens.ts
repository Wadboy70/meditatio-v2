/**
 * Meditatio design tokens — light mode only (MVP).
 * Use via NativeWind classes (tailwind.config.js) or direct import for StyleSheet.
 */

export const colors = {
  background: '#F8F7F4',
  surface: '#FFFFFF',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  border: '#E7E5E4',
  accent: '#6366F1',
  accentMuted: '#EEF2FF',
  success: '#16A34A',
  successMuted: '#DCFCE7',
  warning: '#D97706',
  warningMuted: '#FEF3C7',
} as const;

/** Section color keys — assigned per section during memorization flow */
export const sectionColors = [
  '#6366F1', // indigo
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EF4444', // red
  '#22C55E', // green
  '#3B82F6', // blue
] as const;

/** Soft fill for section-highlighted verses (≈18% opacity). */
export function sectionColorMuted(colorKey: number): string {
  const hex = sectionColors[colorKey % sectionColors.length];
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const shadow = {
  floatingNav: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
} as const;

/** Bottom inset so scroll content clears the floating tab bar */
export const layout = {
  floatingTabBarHeight: 72,
  floatingTabBarBottomMargin: 16,
  screenBottomPadding: 96,
} as const;

export type PassageStatus = 'in_progress' | 'completed';
