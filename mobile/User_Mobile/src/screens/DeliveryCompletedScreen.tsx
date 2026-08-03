import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, ScreenContainer } from '../components';
import { VEHICLE_CATEGORIES } from '../constants';
import { CARGO_CATEGORIES } from '../constants/cargo';
import { findServiceModel } from '../constants/serviceModels';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveryCompleted'>;

const STARS = [1, 2, 3, 4, 5];

const DeliveryCompletedScreen = ({ navigation, route }: Props) => {
  const { orderId } = route.params;
  const [rating, setRating] = useState(0);
  const booking = useBookingStore();
  const {
    pickupLocation,
    destination,
    vehicleCategoryId,
    serviceModelId,
    estimatedPrice,
    currency,
    cargoCategory,
    reset,
  } = booking;

  const category = VEHICLE_CATEGORIES.find((v) => v.id === vehicleCategoryId);
  const model = serviceModelId
    ? findServiceModel(vehicleCategoryId, serviceModelId)
    : undefined;
  const cargo = CARGO_CATEGORIES.find((c) => c.id === cargoCategory);

  const handleDone = () => {
    reset();
    navigation.reset({ index: 0, routes: [{ name: 'CustomerHome' }] });
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>Delivery Completed</Text>
      <Text style={styles.subtitle}>Your cargo has been delivered successfully</Text>

      <View style={styles.receipt}>
        <Text style={styles.receiptId}>Order {orderId}</Text>
        <Text style={styles.receiptRow}>📍 {pickupLocation}</Text>
        <Text style={styles.receiptRow}>🏁 {destination}</Text>
        <Text style={styles.receiptRow}>
          {category?.name} · {model?.name} · {cargo?.label}
        </Text>
        <Text style={styles.receiptTotal}>
          Total paid: {currency} {estimatedPrice}
        </Text>
      </View>

      <Text style={styles.rateLabel}>Rate your driver</Text>
      <View style={styles.stars}>
        {STARS.map((star) => (
          <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>

      <DelixButton title="Done" onPress={handleDone} style={styles.button} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  checkmark: {
    fontSize: moderateScale(48),
    color: colors.success,
    marginBottom: spacing.md,
  },
  title: { ...textStyles.sectionTitle, marginBottom: spacing.xs },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  receipt: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  receiptId: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  receiptRow: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  receiptTotal: {
    marginTop: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  rateLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  star: {
    fontSize: moderateScale(36),
    color: colors.border,
  },
  starActive: {
    color: colors.warning,
  },
  button: { marginBottom: spacing['2xl'] },
});

export default DeliveryCompletedScreen;
