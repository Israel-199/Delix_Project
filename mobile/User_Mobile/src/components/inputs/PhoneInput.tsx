import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import DelixInput, { DelixInputProps } from './DelixInput';

export interface PhoneInputProps extends Omit<DelixInputProps, 'keyboardType' | 'leadingIcon'> {
  countryCode?: string;
  onCountryCodePress?: () => void;
}

const PHONE_REGEX = /^(\+251|0)?9\d{8}$/;

export const validateEthiopianPhone = (value: string): boolean => {
  const normalized = value.replace(/\s/g, '');
  return PHONE_REGEX.test(normalized);
};

export const formatEthiopianPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

export const PhoneInput = ({
  countryCode = '+251',
  value = '',
  onChangeText,
  onCountryCodePress,
  error,
  label = 'Phone Number',
  placeholder = '9XX XXX XXXX',
  ...rest
}: PhoneInputProps) => {
  const [touched, setTouched] = useState(false);

  const validationError = useMemo(() => {
    if (!touched || !value) return undefined;
    return validateEthiopianPhone(value) ? undefined : 'Enter a valid phone number';
  }, [touched, value]);

  return (
    <DelixInput
      label={label}
      placeholder={placeholder}
      value={value}
      keyboardType="phone-pad"
      maxLength={11}
      error={error ?? validationError}
      onChangeText={(text) => onChangeText?.(formatEthiopianPhone(text))}
      onBlur={() => setTouched(true)}
      leadingIcon={
        <View style={styles.countryCodeWrap}>
          <Pressable
            accessibilityRole="button"
            disabled={!onCountryCodePress}
            onPress={onCountryCodePress}
          >
            <Text style={styles.countryCode}>{countryCode}</Text>
          </Pressable>
          <Text style={styles.divider}>|</Text>
        </View>
      }
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  countryCodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  divider: {
    marginLeft: spacing.sm,
    color: colors.border,
    fontSize: fontSize.lg,
  },
});

export default PhoneInput;
