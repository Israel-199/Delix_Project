/**
 * Typography tokens — re-exports Inter theme for design-system consumers.
 * @see src/theme/typography.ts for the source of truth.
 */
export {
  fontFamilies as fontFamily,
  fontSize,
  lineHeight,
  textStyles,
  typography,
  type TextStyleToken,
  type TypographyVariant,
} from '../theme/typography';

/** @deprecated Use fontFamilies from theme — kept for legacy imports */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '800' as const,
};
