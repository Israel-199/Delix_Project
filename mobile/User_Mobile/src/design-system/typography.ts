import { TextStyle } from 'react-native';
import { moderateScale } from '../utils/responsive';
import { colors } from './colors';

export const fontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
} as const;

export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  base: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(28),
  display: moderateScale(36),
} as const;

export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
  black: '900' as TextStyle['fontWeight'],
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

/** Pre-composed text styles for common UI patterns. */
export const textStyles = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
    color: colors.textPrimary,
  },
  screenTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  bodyBold: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  secondary: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    color: colors.textSecondary,
  },
  brand: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.textOnPrimary,
  },
  link: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
} as const satisfies Record<string, TextStyle>;

export type TextStyleToken = keyof typeof textStyles;
