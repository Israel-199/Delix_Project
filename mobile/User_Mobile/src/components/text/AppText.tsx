import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { typography, TypographyVariant } from '../../theme/typography';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  style?: StyleProp<TextStyle>;
}

/** Text component that applies centralized Inter typography variants. */
export const AppText = ({ variant = 'body', style, ...props }: AppTextProps) => (
  <Text style={[typography[variant], style]} {...props} />
);

export default AppText;
