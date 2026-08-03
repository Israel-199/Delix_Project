import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import io from 'socket.io-client';
import { DelixButton, ScreenContainer } from '../components';
import { PaymentMethodPicker } from '../components/inputs/PaymentMethodPicker';
import { VEHICLE_CATEGORIES } from '../constants';
import { CARGO_CATEGORIES } from '../constants/cargo';
import { findServiceModel } from '../constants/serviceModels';
import { SOCKET_URL } from '../constants';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSummary'>;

const socket = io(SOCKET_URL);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
  </View>
);

const BookingSummaryScreen = ({ navigation }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const booking = useBookingStore();
  const {
    pickupLocation,
    destination,
    vehicleCategoryId,
    serviceModelId,
    distanceKm,
    travelEta,
    cargoCategory,
    cargoDescription,
    specialInstructions,
    loadingAssistance,
    unloadingAssistance,
    estimatedPrice,
    currency,
    paymentMethod,
    setPaymentMethod,
    setOrderId,
    setBookingStatus,
  } = booking;

  const category = VEHICLE_CATEGORIES.find((v) => v.id === vehicleCategoryId);
  const model = serviceModelId
    ? findServiceModel(vehicleCategoryId, serviceModelId)
    : undefined;
  const cargo = CARGO_CATEGORIES.find((c) => c.id === cargoCategory);

  const handleConfirm = () => {
    setSubmitting(true);
    setBookingStatus('searching');

    const orderId = `ORD-${Date.now()}`;
    setOrderId(orderId);

    socket.emit('request_cargo_delivery', {
      orderId,
      customerId: 'USR-MOBILE',
      cargoCategory: cargoCategory?.toUpperCase(),
      vehicleRequested: vehicleCategoryId,
      serviceModel: serviceModelId,
      pickupAddress: pickupLocation,
      destinationAddress: destination,
      distanceKm,
      paymentMethod,
      cargoDescription,
      specialInstructions,
      loadingAssistance,
      unloadingAssistance,
    });

    navigation.replace('DriverTracking', { orderId });
    setSubmitting(false);
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <Text style={styles.title}>Booking Summary</Text>
      <Text style={styles.subtitle}>Review your delivery details</Text>

      <View style={styles.card}>
        <SummaryRow label="Pickup" value={pickupLocation} />
        <SummaryRow label="Destination" value={destination} />
        <SummaryRow label="Vehicle" value={`${category?.name} · ${model?.name ?? ''}`} />
        <SummaryRow label="Cargo" value={`${cargo?.label ?? ''} — ${cargoDescription}`} />
        {specialInstructions ? (
          <SummaryRow label="Instructions" value={specialInstructions} />
        ) : null}
        <SummaryRow
          label="Assistance"
          value={[
            loadingAssistance ? 'Loading' : null,
            unloadingAssistance ? 'Unloading' : null,
          ].filter(Boolean).join(', ') || 'None'}
        />
        <SummaryRow label="Distance" value={`${distanceKm} km · ${travelEta}`} />
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Estimated total</Text>
        <Text style={styles.totalAmount}>{currency} {estimatedPrice}</Text>
      </View>

      <Text style={styles.paymentLabel}>Payment method</Text>
      <PaymentMethodPicker selected={paymentMethod} onSelect={setPaymentMethod} />

      <DelixButton
        title="Confirm Booking"
        loading={submitting}
        onPress={handleConfirm}
        style={styles.button}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  back: { marginBottom: spacing.md },
  backText: { fontSize: fontSize['2xl'], fontWeight: fontWeight.black },
  title: { ...textStyles.sectionTitle, marginBottom: spacing.xxs },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  row: { gap: spacing.xxs },
  rowLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  totalLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  totalAmount: { fontSize: fontSize['2xl'], fontWeight: fontWeight.black, color: colors.primary },
  paymentLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  button: { marginTop: spacing.md, marginBottom: spacing['2xl'] },
});

export default BookingSummaryScreen;
