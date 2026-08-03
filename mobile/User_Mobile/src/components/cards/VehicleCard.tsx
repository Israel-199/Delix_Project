import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { heightScale, moderateScale, widthScale } from '../../utils/responsive';
import { VehicleCardData } from '../../types';

export interface VehicleCardProps {
  vehicle: VehicleCardData;
  selected?: boolean;
  compact?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const VehicleCard = ({
  vehicle,
  selected = false,
  compact = false,
  onPress,
  style,
}: VehicleCardProps) => {
  const { name, icon, eta, price, priceLabel, unavailable } = vehicle;
  const displayPrice = priceLabel ?? (price != null ? `Br ~${price}` : '—');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: unavailable }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        selected && styles.cardSelected,
        unavailable && styles.cardUnavailable,
        pressed && !unavailable && styles.cardPressed,
        style,
      ]}
    >
      {icon ? (
        <Text style={[styles.icon, compact && styles.iconCompact]}>{icon}</Text>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      {eta ? <Text style={styles.eta}>{eta}</Text> : null}

      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {name}
      </Text>

      <Text style={[styles.price, unavailable && styles.priceUnavailable]} numberOfLines={1}>
        {displayPrice}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: widthScale(105),
    minHeight: heightScale(95),
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  cardCompact: {
    width: widthScale(90),
    minHeight: heightScale(88),
  },
  cardSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  cardUnavailable: {
    opacity: 0.45,
  },
  cardPressed: {
    opacity: 0.9,
  },
  icon: {
    fontSize: moderateScale(28),
    marginBottom: spacing.xxs,
  },
  iconCompact: {
    fontSize: moderateScale(24),
  },
  iconPlaceholder: {
    width: moderateScale(28),
    height: moderateScale(28),
    marginBottom: spacing.xxs,
  },
  eta: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
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

export default VehicleCard;
