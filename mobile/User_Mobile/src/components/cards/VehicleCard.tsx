import React from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { moderateScale, widthScale } from '../../utils/responsive';
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
  const { name, icon, imageUri, unavailable } = vehicle;

  const cardWidth = compact ? widthScale(84) : widthScale(102);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: unavailable }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { width: cardWidth },
        unavailable && styles.containerUnavailable,
        pressed && !unavailable && styles.containerPressed,
        style,
      ]}
    >
      <View
        style={[
          styles.squareBox,
          compact && styles.squareBoxCompact,
          selected && styles.squareBoxSelected,
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        ) : icon ? (
          <Text style={[styles.icon, compact && styles.iconCompact]}>{icon}</Text>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginRight: spacing.sm,
  },
  containerUnavailable: {
    opacity: 0.45,
  },
  containerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  squareBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F2F3F7',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  squareBoxCompact: {
    borderRadius: radius.lg,
  },
  squareBoxSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  icon: {
    fontSize: moderateScale(36),
  },
  iconCompact: {
    fontSize: moderateScale(28),
  },
  iconPlaceholder: {
    width: moderateScale(36),
    height: moderateScale(36),
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  nameSelected: {
    color: colors.primaryDark,
  },
});

export default VehicleCard;
