import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { ServiceModel } from '../../types';
import { moderateScale, widthScale } from '../../utils/responsive';

export interface ServiceModelCardProps {
  model: ServiceModel;
  priceLabel: string;
  selected?: boolean;
  unavailable?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ServiceModelCard = ({
  model,
  priceLabel,
  selected = false,
  unavailable = false,
  onPress,
  style,
}: ServiceModelCardProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected, disabled: unavailable }}
    disabled={unavailable}
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      selected && styles.cardSelected,
      unavailable && styles.cardUnavailable,
      pressed && !unavailable && styles.cardPressed,
      style,
    ]}
  >
    <Text style={styles.eta}>{model.eta ?? '—'}</Text>
    <Text style={styles.vehicleIcon}>🚗</Text>
    <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
      {model.name}
    </Text>
    <Text style={[styles.price, unavailable && styles.priceUnavailable]} numberOfLines={1}>
      {unavailable ? '—' : priceLabel}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    width: widthScale(100),
    minHeight: moderateScale(120),
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  cardSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  cardUnavailable: {
    opacity: 0.4,
  },
  cardPressed: {
    opacity: 0.92,
  },
  eta: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  vehicleIcon: {
    fontSize: moderateScale(22),
    marginBottom: spacing.xxs,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  nameSelected: {
    color: colors.primaryDark,
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  priceUnavailable: {
    color: colors.textPlaceholder,
  },
});

export default ServiceModelCard;
