import { moderateScale } from '../utils/responsive';

export const radius = {
  xs: moderateScale(8),
  sm: moderateScale(12),
  md: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(28),
  sheet: moderateScale(32),
  full: moderateScale(999),
} as const;

export type RadiusToken = keyof typeof radius;
