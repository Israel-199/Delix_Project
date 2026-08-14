import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const shadows = {
  none: {} as ViewStyle,

  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  } satisfies ViewStyle,

  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  } satisfies ViewStyle,

  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  } satisfies ViewStyle,

  sheet: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  } satisfies ViewStyle,
} as const;

export type ShadowToken = keyof typeof shadows;
