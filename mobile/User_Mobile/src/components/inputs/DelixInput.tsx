import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { heightScale } from '../../utils/responsive';

export interface DelixInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const DelixInput = ({
  label,
  error,
  hint,
  leadingIcon,
  trailingIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: DelixInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error ? styles.inputRowError : null,
        ]}
      >
        {leadingIcon ? <View style={styles.leading}>{leadingIcon}</View> : null}

        <TextInput
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />

        {trailingIcon ? <View style={styles.trailing}>{trailingIcon}</View> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.transparent,
    paddingHorizontal: spacing.md,
    minHeight: heightScale(52),
  },
  inputRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  inputRowError: {
    borderColor: colors.error,
    backgroundColor: colors.errorTint,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  leading: {
    marginRight: spacing.sm,
  },
  trailing: {
    marginLeft: spacing.sm,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  hintText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

export default DelixInput;
