import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DelixButton,
  InlineBottomSheet,
  MapContainer,
  ServiceModelCard,
} from '../components';
import { RouteSummaryRow } from '../components/cards/RouteSummaryRow';
import { VEHICLE_CATEGORIES } from '../constants';
import { getServiceModelsForCategory } from '../constants/serviceModels';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { MapMarkerData, ServiceModelId } from '../types';
import { formatCurrencyLabel } from '../utils/mappers';

type Props = NativeStackScreenProps<RootStackParamList, 'MapBooking'>;

const PICKUP_COORD = { latitude: 9.0205, longitude: 38.7469 };
const DEST_COORD = { latitude: 9.0305, longitude: 38.7669 };

const MapBookingScreen = ({ navigation }: Props) => {
  const {
    pickupLocation,
    destination,
    vehicleCategoryId,
    serviceModelId,
    travelEta,
    setVehicleCategory,
    setServiceModel,
    fetchEstimatesForModels,
    estimateError,
  } = useBookingStore();

  const serviceModels = getServiceModelsForCategory(vehicleCategoryId);
  const [priceMap, setPriceMap] = useState<Record<string, { price: number; currency: string }>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const mapMarkers: MapMarkerData[] = [
    { id: 'pickup', coordinate: PICKUP_COORD, label: '3 min', type: 'pickup' },
    { id: 'dest', coordinate: DEST_COORD, label: 'Arrive 10:34 AM', type: 'destination' },
  ];

  useEffect(() => {
    let cancelled = false;
    const loadPrices = async () => {
      setLoadingPrices(true);
      const modelIds = serviceModels.map((m) => m.id as ServiceModelId);
      const estimates = await fetchEstimatesForModels(modelIds);
      if (!cancelled) {
        setPriceMap(estimates);
        setLoadingPrices(false);
      }
    };
    loadPrices();
    return () => { cancelled = true; };
  }, [vehicleCategoryId, pickupLocation, fetchEstimatesForModels, serviceModels]);

  const handleContinue = () => {
    if (!serviceModelId) return;
    navigation.navigate('VehicleDetails', { vehicleId: vehicleCategoryId });
  };

  return (
    <View style={styles.root}>
      <MapContainer
        markers={mapMarkers}
        routeCoordinates={[PICKUP_COORD, DEST_COORD]}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <InlineBottomSheet contentStyle={styles.sheet}>
        <RouteSummaryRow
          pickup={pickupLocation}
          destination={destination}
          travelEta={travelEta}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {VEHICLE_CATEGORIES.map((cat) => {
            const active = vehicleCategoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setVehicleCategory(cat.id)}
                style={[styles.categoryTab, active && styles.categoryTabActive]}
              >
                <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loadingPrices ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modelsRow}
          >
            {serviceModels.map((model) => {
              const estimate = priceMap[model.id];
              const priceLabel = estimate
                ? formatCurrencyLabel(estimate.currency, estimate.price)
                : '—';
              return (
                <ServiceModelCard
                  key={`${model.categoryId}-${model.id}`}
                  model={model}
                  priceLabel={priceLabel}
                  selected={serviceModelId === model.id}
                  unavailable={!estimate && !loadingPrices}
                  onPress={() => setServiceModel(model.id)}
                />
              );
            })}
          </ScrollView>
        )}

        {estimateError ? <Text style={styles.error}>{estimateError}</Text> : null}

        <DelixButton
          title={serviceModelId ? 'Continue' : 'Select service class'}
          disabled={!serviceModelId}
          onPress={handleContinue}
        />
      </InlineBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: { paddingTop: spacing.xs },
  categoryTabs: { marginBottom: spacing.md },
  categoryTabsContent: { gap: spacing.xs },
  categoryTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundTertiary,
    marginRight: spacing.xs,
  },
  categoryTabActive: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryTabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  categoryTabTextActive: {
    color: colors.primaryDark,
    fontWeight: fontWeight.bold,
  },
  modelsRow: {
    paddingBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});

export default MapBookingScreen;
