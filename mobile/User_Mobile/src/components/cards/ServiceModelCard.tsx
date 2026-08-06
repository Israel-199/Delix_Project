import React from 'react';
import { Image, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontFamilies } from '../../theme/typography';
import { ServiceModel } from '../../types';
import { moderateScale, widthScale } from '../../utils/responsive';

export interface ServiceModelCardProps {
  model: ServiceModel;
  priceLabel: string;
  vehicleIcon?: string;
  vehicleImage?: any;
  selected?: boolean;
  unavailable?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ServiceModelCard = ({
  model,
  priceLabel,
  vehicleIcon = '🚗',
  vehicleImage,
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
    {vehicleImage ? (
      <Image source={vehicleImage} style={styles.vehicleImage} resizeMode="contain" />
    ) : (
      <Text style={styles.vehicleIcon}>{vehicleIcon}</Text>
    )}
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
    width: widthScale(105),
    minHeight: moderateScale(125),
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.lg,
    padding: spacing.xs,
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
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(12),
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  vehicleImage: {
    width: moderateScale(42),
    height: moderateScale(30),
    marginBottom: spacing.xxs,
  },
  vehicleIcon: {
    fontSize: moderateScale(22),
    marginBottom: spacing.xxs,
  },
  name: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(13),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  nameSelected: {
    color: colors.primaryDark,
  },
  price: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  priceUnavailable: {
    color: colors.textPlaceholder,
  },
});

export default ServiceModelCard;
