import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../../design-system';
import { textStyles } from '../../theme/typography';
import { heightScale } from '../../utils/responsive';

export type DelixButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

export interface DelixButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: DelixButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const DelixButton = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  ...pressableProps
}: DelixButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant].container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'text' ? colors.primary : colors.textOnPrimary}
          size="small"
        />
      ) : (
        <Text style={[textStyles.button, variantStyles[variant].label, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

const variantStyles = {
  primary: {
    container: { backgroundColor: colors.primary },
    label: { color: colors.textOnPrimary },
  },
  secondary: {
    container: {
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    label: { color: colors.primary, fontFamily: textStyles.button.fontFamily },
  },
  danger: {
    container: { backgroundColor: colors.error },
    label: { color: colors.textOnPrimary },
  },
  text: {
    container: {
      backgroundColor: colors.transparent,
      minHeight: heightScale(40),
      paddingHorizontal: spacing.sm,
    },
    label: { color: colors.primary, fontFamily: textStyles.button.fontFamily },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    minHeight: heightScale(56),
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

export default DelixButton;
