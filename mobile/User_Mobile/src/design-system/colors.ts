/**
 * Delix brand color palette — derived from the existing User App orange theme.
 */
export const colors = {
  // Brand
  primary: '#FF5722',
  primaryDark: '#E64A19',
  primaryLight: '#FF8A65',
  primaryTint: '#FFF1EC',
  primarySubtle: '#FFEFEA',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  mapBackground: '#E5E5E0',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textPlaceholder: '#9CA3AF',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Borders & dividers
  border: '#E5E7EB',
  borderLight: '#EEF2F7',
  divider: '#F3F4F6',

  // Semantic
  error: '#EF4444',
  errorTint: '#FEF2F2',
  warning: '#F59E0B',
  warningTint: '#FFFBEB',
  success: '#22C55E',
  successTint: '#F0FDF4',
  info: '#3B82F6',
  infoTint: '#EFF6FF',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.45)',
  overlayLight: 'rgba(0, 0, 0, 0.12)',

  // Misc
  transparent: 'transparent',
  shadow: '#000000',
  avatarBackground: '#E5E7EB',
  phoneButtonBackground: '#EFF6FF',
} as const;

export type ColorToken = keyof typeof colors;
