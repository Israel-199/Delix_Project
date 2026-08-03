import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { PAYMENT_METHODS } from '../../constants';
import { PaymentMethodId } from '../../types';

interface PaymentMethodPickerProps {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}

export const PaymentMethodPicker = ({ selected, onSelect }: PaymentMethodPickerProps) => (
  <View style={styles.row}>
    {PAYMENT_METHODS.map((method) => {
      const active = selected === method.id;
      return (
        <Pressable
          key={method.id}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          onPress={() => onSelect(method.id)}
          style={[styles.chip, active && styles.chipActive]}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>
            {method.icon} {method.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.transparent,
  },
  chipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
});

export default PaymentMethodPicker;
