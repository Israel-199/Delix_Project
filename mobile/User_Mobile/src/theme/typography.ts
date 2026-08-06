import { TextStyle } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { colors } from '../design-system/colors';
import { moderateScale } from '../utils/responsive';

/** Post-load font family names — use these in all Text styles (not fontWeight). */
export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Font files passed to expo-font / useFonts. */
export const interFontMap = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} as const;

type FontFamilyKey = keyof typeof fontFamilies;

const scale = (size: number) => moderateScale(size);

const line = (size: number, ratio = 1.25) => Math.round(scale(size) * ratio);

function type(
  size: number,
  family: FontFamilyKey,
  color: string = colors.textPrimary,
  ratio = 1.25
): TextStyle {
  return {
    fontFamily: fontFamilies[family],
    fontSize: scale(size),
    lineHeight: line(size, ratio),
    color,
  };
}

/** Core typography scale */
export const typography = {
  display: type(34, 'extrabold'),
  h1: type(30, 'bold'),
  h2: type(26, 'bold'),
  h3: type(22, 'semibold'),
  title: type(19, 'semibold'),
  subtitle: type(15, 'medium'),
  body: type(14, 'regular'),
  bodyMedium: type(16, 'medium'),
  caption: type(14, 'regular', colors.textSecondary),
  small: type(12, 'regular', colors.textSecondary),
  button: type(16, 'semibold'),

  /** Delix UI reference tokens */
  brand: type(30, 'extrabold', colors.primary),
  whereTo: type(24, 'bold'),
  locationLabel: type(20, 'semibold'),
  vehicleName: type(16, 'medium'),
  addressTitle: type(18, 'medium'),
  addressSubtitle: type(15, 'regular', colors.textSecondary),
  timeLabel: type(15, 'regular', colors.textSecondary),
  link: type(14, 'semibold', colors.primary),
  label: type(12, 'semibold', colors.textSecondary),
} as const satisfies Record<string, TextStyle>;

/** Backward-compatible aliases for existing design-system textStyles */
export const textStyles = {
  display: typography.display,
  screenTitle: typography.h1,
  sectionTitle: typography.h2,
  cardTitle: typography.title,
  subtitle: typography.subtitle,
  body: typography.bodyMedium,
  bodyBold: type(16, 'bold'),
  secondary: typography.caption,
  caption: typography.small,
  label: typography.label,
  brand: typography.brand,
  button: { ...typography.button, color: colors.textOnPrimary },
  link: typography.link,
  whereTo: typography.whereTo,
  locationLabel: typography.locationLabel,
  vehicleName: typography.vehicleName,
  addressTitle: typography.addressTitle,
  addressSubtitle: typography.addressSubtitle,
  timeLabel: typography.timeLabel,
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
export type TextStyleToken = keyof typeof textStyles;

export const fontSize = {
  xs: scale(12),
  sm: scale(14),
  md: scale(15),
  base: scale(16),
  lg: scale(18),
  xl: scale(20),
  '2xl': scale(24),
  '3xl': scale(30),
  display: scale(34),
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.25,
  relaxed: 1.4,
} as const;
