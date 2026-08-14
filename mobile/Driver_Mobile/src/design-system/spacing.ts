import { moderateScale, widthScale, heightScale } from '../utils/responsive';

/**
 * 8-point spacing system scaled for device size.
 */
export const spacing = {
  none: 0,
  xxs: moderateScale(4),
  xs: moderateScale(8),
  sm: moderateScale(12),
  md: moderateScale(16),
  lg: moderateScale(20),
  xl: moderateScale(24),
  '2xl': moderateScale(32),
  '3xl': moderateScale(40),
  '4xl': moderateScale(48),
  '5xl': moderateScale(64),
} as const;

/** Horizontal screen padding used on most screens. */
export const screenPadding = {
  horizontal: widthScale(20),
  vertical: heightScale(16),
} as const;

export type SpacingToken = keyof typeof spacing;
