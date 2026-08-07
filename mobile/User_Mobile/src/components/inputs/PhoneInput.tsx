import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { fontFamilies } from '../../theme/typography';
import DelixInput, { DelixInputProps } from './DelixInput';

export interface Country {
  name: string;
  code: string;
  flag: string;
  regex: RegExp;
}

export const COUNTRIES: Country[] = [
  { name: 'Ethiopia', code: '+251', flag: '🇪🇹', regex: /^(0)?9\d{8}$/ },
  { name: 'Djibouti', code: '+253', flag: '🇩🇯', regex: /^\d{8}$/ },
];

export interface PhoneInputProps extends Omit<DelixInputProps, 'keyboardType' | 'leadingIcon'> {
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
}

export const validatePhone = (value: string, countryCode: string): boolean => {
  const normalized = value.replace(/\s/g, '');
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  return country.regex.test(normalized);
};

export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};

export const PhoneInput = ({
  countryCode = '+251',
  value = '',
  onChangeText,
  onCountryCodeChange,
  error,
  label = 'Phone Number',
  placeholder = '9XX XXX XXXX',
  ...rest
}: PhoneInputProps) => {
  const [touched, setTouched] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0],
    [countryCode]
  );

  const validationError = useMemo(() => {
    if (!touched || !value) return undefined;
    return validatePhone(value, countryCode) ? undefined : 'Enter a valid phone number';
  }, [touched, value, countryCode]);

  return (
    <>
    <DelixInput
      label={label}
      placeholder={placeholder}
      value={value}
      keyboardType="phone-pad"
      maxLength={11}
      error={error ?? validationError}
      onChangeText={(text) => onChangeText?.(formatPhone(text))}
      onBlur={() => setTouched(true)}
      leadingIcon={
        <View style={styles.countryCodeWrap}>
          <Pressable
            accessibilityRole="button"
            style={styles.flagButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCode}>{countryCode}</Text>
            <Ionicons name="caret-down" size={14} color={colors.textPrimary} style={styles.caret} />
          </Pressable>
          <Text style={styles.divider}>|</Text>
        </View>
      }
      {...rest}
    />

    <Modal visible={modalVisible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Country Code</Text>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              style={styles.countryOption}
              onPress={() => {
                onCountryCodeChange?.(c.code);
                setModalVisible(false);
              }}
            >
              <Text style={styles.flagEmoji}>{c.flag}</Text>
              <Text style={styles.countryOptionText}>{c.name} ({c.code})</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  countryCodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: fontSize.lg,
    marginRight: spacing.xs,
  },
  countryCode: {
    fontSize: fontSize.base,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
  },
  caret: {
    marginLeft: spacing.xxs,
  },
  divider: {
    marginLeft: spacing.sm,
    color: colors.border,
    fontSize: fontSize.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamilies.bold,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  countryOptionText: {
    fontSize: fontSize.base,
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
  },
});

export default PhoneInput;
