import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { moderateScale } from '../../utils/responsive';

export interface CargoSquareCardProps {
  title: string;
  image: ImageSourcePropType;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const CargoSquareCard = ({
  title,
  image,
  selected = false,
  onPress,
  style,
}: CargoSquareCardProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.imageWrap}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>
      <Text style={[styles.title, selected && styles.titleSelected]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.xl,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.transparent,
    ...shadows.sm,
  },
  cardSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  imageWrap: {
    width: '65%',
    height: '60%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: moderateScale(11),
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  titleSelected: {
    color: colors.primaryDark,
  },
});

export default CargoSquareCard;
