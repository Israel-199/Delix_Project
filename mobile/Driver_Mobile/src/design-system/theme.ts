import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { screenPadding, spacing } from './spacing';
import {
  fontFamilies,
  fontSize,
  lineHeight,
  textStyles,
  typography,
} from '../theme/typography';

export const theme = {
  colors,
  spacing,
  screenPadding,
  radius,
  shadows,
  typography: {
    fontFamily: fontFamilies,
    fontSize,
    lineHeight,
    textStyles,
    tokens: typography,
  },
} as const;

export type Theme = typeof theme;

export default theme;
