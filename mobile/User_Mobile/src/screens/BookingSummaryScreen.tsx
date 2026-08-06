import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, ScreenContainer } from '../components';
import { PaymentMethodPicker } from '../components/inputs/PaymentMethodPicker';
import { CARGO_TYPE_CATEGORIES, VEHICLE_CATEGORIES } from '../constants';
import { CARGO_CATEGORIES } from '../constants/cargo';
import { findServiceModel } from '../constants/serviceModels';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { ApiError } from '../services/apiClient';
import { createOrder } from '../services/orderService';
import { emitCargoDeliveryRequest } from '../services/socketService';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSummary'>;

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
  </View>
);

const BookingSummaryScreen = ({ navigation }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const phone = useAuthStore((s) => s.phone);

  const booking = useBookingStore();
  const {
    pickupLocation,
    destination,
    vehicleCategoryId,
    selectedVehicleId,
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
    pickupCoordinate,
    userCoordinate,
    destinationCoordinate,
    setPaymentMethod,
    setOrderId,
    setBookingStatus,
    isEstimating,
  } = booking;

  const activeVehicleId = selectedVehicleId ?? vehicleCategoryId;

  const categoryName = useMemo(() => {
    const oldCat = VEHICLE_CATEGORIES.find((v) => v.id === activeVehicleId);
    if (oldCat) return oldCat.name;
    for (const c of CARGO_TYPE_CATEGORIES) {
      const found = c.vehicles.find((v) => v.id === activeVehicleId);
      if (found) return found.name;
    }
    return activeVehicleId;
  }, [activeVehicleId]);

  const model = serviceModelId
    ? findServiceModel(activeVehicleId, serviceModelId)
    : undefined;
  const cargo = CARGO_CATEGORIES.find((c) => c.id === cargoCategory);

  const handleConfirm = async () => {
    if (!cargoCategory) {
      setError('Cargo category is missing');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const response = await createOrder(
        {
          customerId: phone || 'USR-MOBILE',
          cargoCategory,
          vehicleCategoryId: activeVehicleId,
          serviceModelId,
          pickupAddress: pickupLocation,
          pickupLat: pickupCoordinate?.latitude ?? userCoordinate?.latitude,
          pickupLng: pickupCoordinate?.longitude ?? userCoordinate?.longitude,
          destinationAddress: destination,
          destinationLat: destinationCoordinate?.latitude,
          destinationLng: destinationCoordinate?.longitude,
          distanceKm,
          loadingAssistance,
          unloadingAssistance,
          paymentMethod,
          cargoDescription,
          specialInstructions,
        },
        accessToken
      );

      const orderId = response.order.id;
      setOrderId(orderId);
      setBookingStatus('searching');

      emitCargoDeliveryRequest({
        ...response.order,
        orderId,
        customerId: phone,
      });

      navigation.replace('DriverTracking', { orderId });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create booking');
    } finally {
      setSubmitting(false);
    }
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
        <SummaryRow label="Vehicle" value={`${categoryName} · ${model?.name ?? 'Standard'}`} />
        <SummaryRow label="Cargo" value={`${cargo?.label ?? ''} — ${cargoDescription}`} />
        {specialInstructions ? (
          <SummaryRow label="Driver Instructions" value={specialInstructions} />
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
        <Text style={styles.totalAmount}>
          {isEstimating ? '...' : `${currency} ${estimatedPrice}`}
        </Text>
      </View>

      <Text style={styles.paymentLabel}>Payment method</Text>
      <PaymentMethodPicker selected={paymentMethod} onSelect={setPaymentMethod} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <DelixButton
        title="Confirm Booking"
        loading={submitting || isEstimating}
        onPress={handleConfirm}
        style={styles.button}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  back: { marginBottom: spacing.md },
  backText: { fontFamily: fontFamilies.bold, fontSize: moderateScale(22) },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(22),
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
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
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
  rowValue: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
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
  totalLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  totalAmount: {
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(22),
    color: colors.primary,
  },
  paymentLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  error: {
    fontFamily: fontFamilies.medium,
    color: colors.error,
    fontSize: moderateScale(13),
    marginBottom: spacing.sm,
  },
  button: { marginTop: spacing.md, marginBottom: spacing['2xl'] },
});

export default BookingSummaryScreen;
