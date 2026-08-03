import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { screenPadding, spacing } from './spacing';
import { fontFamily, fontSize, fontWeight, lineHeight, textStyles } from './typography';

export const theme = {
  colors,
  spacing,
  screenPadding,
  radius,
  shadows,
  typography: {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    textStyles,
  },
} as const;

export type Theme = typeof theme;

export default theme;
