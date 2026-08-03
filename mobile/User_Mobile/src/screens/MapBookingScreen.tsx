import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DelixButton,
  InlineBottomSheet,
  MapContainer,
  ServiceModelCard,
} from '../components';
import { RouteSummaryRow } from '../components/cards/RouteSummaryRow';
import { VEHICLE_CATEGORIES } from '../constants';
import { calculatePrice, getServiceModelsForCategory } from '../constants/serviceModels';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { MapMarkerData } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MapBooking'>;

const PICKUP_COORD = { latitude: 9.0205, longitude: 38.7469 };
const DEST_COORD = { latitude: 9.0305, longitude: 38.7669 };

const MapBookingScreen = ({ navigation }: Props) => {
  const {
    pickupLocation,
    destination,
    vehicleCategoryId,
    serviceModelId,
    distanceKm,
    travelEta,
    setVehicleCategory,
    setServiceModel,
  } = useBookingStore();

  const isDjibouti = pickupLocation.toLowerCase().includes('djibouti');
  const serviceModels = getServiceModelsForCategory(vehicleCategoryId);

  const mapMarkers: MapMarkerData[] = [
    { id: 'pickup', coordinate: PICKUP_COORD, label: '3 min', type: 'pickup' },
    { id: 'dest', coordinate: DEST_COORD, label: 'Arrive 10:34 AM', type: 'destination' },
  ];

  const modelsWithPrices = useMemo(
    () =>
      serviceModels.map((model) => {
        const { price, currency } = calculatePrice(distanceKm, model.id, isDjibouti);
        return {
          model,
          priceLabel: `${currency} ~${price}`,
        };
      }),
    [serviceModels, distanceKm, isDjibouti]
  );

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modelsRow}
        >
          {modelsWithPrices.map(({ model, priceLabel }) => (
            <ServiceModelCard
              key={`${model.categoryId}-${model.id}`}
              model={model}
              priceLabel={priceLabel}
              selected={serviceModelId === model.id}
              onPress={() => setServiceModel(model.id)}
            />
          ))}
        </ScrollView>

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
});

export default MapBookingScreen;
