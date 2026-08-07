import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DelixButton,
  InlineBottomSheet,
  MapContainer,
  ServiceModelCard,
} from '../components';
import { RouteSummaryRow } from '../components/cards/RouteSummaryRow';
import { CARGO_TYPE_CATEGORIES } from '../constants';
import { getServiceModelsForCategory } from '../constants/serviceModels';
import { DEFAULT_PICKUP_COORD } from '../constants/locationCoords';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { resolveDestination, reverseGeocode } from '../services/geocodingService';
import { requestUserLocation, watchUserLocation } from '../services/locationService';
import { fetchDrivingRoute } from '../services/routingService';
import { onLiveDriverMoved } from '../services/socketService';
import { useBookingStore } from '../store/bookingStore';
import { CargoTypeKey, MapMarkerData, NearbyDriver, ServiceModelId, VehicleCategoryId } from '../types';
import { vehicleCategoryFromBackend } from '../utils/driverTracking';
import { formatCurrencyLabel } from '../utils/mappers';
import { anchorRouteStartToUser } from '../utils/routeUtils';
import { heightScale, moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'MapBooking'>;

const SHEET_HEIGHT = heightScale(812) * 0.46;

const buildNearbyDrivers = (
  center: { latitude: number; longitude: number }
): NearbyDriver[] => [
  {
    id: 'driver-lada-1',
    coordinate: { latitude: center.latitude + 0.003, longitude: center.longitude + 0.002 },
    vehicleCategory: 'lada',
    etaMinutes: 2,
  },
  {
    id: 'driver-pickup-1',
    coordinate: { latitude: center.latitude - 0.002, longitude: center.longitude + 0.004 },
    vehicleCategory: 'pickup',
    etaMinutes: 3,
  },
];

const MapBookingScreen = ({ navigation }: Props) => {
  const {
    pickupLocation,
    destination,
    cargoTypeKey,
    vehicleCategoryId,
    selectedVehicleId,
    serviceModelId,
    travelEta,
    arrivalTime,
    destinationCoordinate,
    userCoordinate,
    routeCoordinates,
    nearbyDrivers,
    setCargoTypeKey,
    setSelectedVehicleId,
    setServiceModel,
    setRouteGeometry,
    setPickupLabel,
    setUserCoordinate,
    fetchEstimatesForModels,
    estimateError,
  } = useBookingStore();

  const activeCargoKey = cargoTypeKey ?? 'small';

  const activeCargoCategory = useMemo(
    () => CARGO_TYPE_CATEGORIES.find((c) => c.id === activeCargoKey) ?? CARGO_TYPE_CATEGORIES[0],
    [activeCargoKey]
  );

  useEffect(() => {
    if (!selectedVehicleId && activeCargoCategory.vehicles.length > 0) {
      setSelectedVehicleId(activeCargoCategory.vehicles[0].id);
    }
  }, [activeCargoCategory, selectedVehicleId, setSelectedVehicleId]);

  const activeVehicleId = selectedVehicleId ?? vehicleCategoryId;

  const serviceModels = useMemo(
    () => getServiceModelsForCategory(activeVehicleId),
    [activeVehicleId]
  );

  const [priceMap, setPriceMap] = useState<Record<string, { price: number; currency: string }>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [routeFollowsRoads, setRouteFollowsRoads] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [liveDrivers, setLiveDrivers] = useState<NearbyDriver[]>([]);

  useEffect(() => {
    return onLiveDriverMoved((payload) => {
      const vehicleCategory = vehicleCategoryFromBackend(payload.vehicleType);
      setLiveDrivers((prev) => {
        const next = {
          id: payload.driverId,
          coordinate: { latitude: payload.lat, longitude: payload.lng },
          vehicleCategory,
          etaMinutes: 2,
        };
        const index = prev.findIndex((d) => d.id === payload.driverId);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = next;
          return copy;
        }
        return [...prev, next];
      });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stopWatch: (() => void) | undefined;

    const loadRoute = async () => {
      setMapReady(false);
      setMapError(null);

      const userPoint = await requestUserLocation();
      if (cancelled) return;

      setUserCoordinate(userPoint ?? { ...DEFAULT_PICKUP_COORD, label: 'You' });

      stopWatch = await watchUserLocation((point) => {
        if (!cancelled) {
          setUserCoordinate(point);
        }
      });

      const destPoint = await resolveDestination(destination, destinationCoordinate);
      if (cancelled) return;

      if (!destPoint) {
        setMapError('Could not find destination on map. Try a nearby place name.');
        setMapReady(true);
        return;
      }

      const origin = userPoint ?? DEFAULT_PICKUP_COORD;

      if (userPoint) {
        const addressLabel = await reverseGeocode(userPoint.latitude, userPoint.longitude);
        if (!cancelled && addressLabel) {
          setPickupLabel(addressLabel);
        }
      } else {
        setPickupLabel('Your location (enable GPS for accuracy)');
      }

      const route = await fetchDrivingRoute(origin, destPoint);
      if (cancelled) return;

      setRouteFollowsRoads(route.followsRoads);

      setRouteGeometry({
        destinationCoordinate: destPoint,
        routeCoordinates: route.coordinates,
        distanceKm: route.distanceKm,
        travelEta: route.durationLabel,
        arrivalLabel: route.arrivalLabel,
        arrivalTime: route.arrivalTime,
        nearbyDrivers: buildNearbyDrivers(origin),
      });

      setMapReady(true);
    };

    loadRoute();

    return () => {
      cancelled = true;
      stopWatch?.();
    };
  }, [
    destination,
    destinationCoordinate,
    setRouteGeometry,
    setPickupLabel,
    setUserCoordinate,
  ]);

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

    if (mapReady && serviceModels.length > 0 && !mapError) {
      loadPrices();
    }

    return () => { cancelled = true; };
  }, [activeVehicleId, mapReady, mapError, fetchEstimatesForModels, serviceModels]);

  const displayRoute = useMemo(() => {
    if (!userCoordinate || routeCoordinates.length < 2) {
      return routeCoordinates;
    }
    return anchorRouteStartToUser(routeCoordinates, userCoordinate);
  }, [userCoordinate, routeCoordinates]);

  const mapMarkers: MapMarkerData[] = useMemo(() => {
    const markers: MapMarkerData[] = [];

    if (userCoordinate) {
      markers.push({
        id: 'user',
        coordinate: userCoordinate,
        type: 'user',
      });
    }

    if (destinationCoordinate) {
      markers.push({
        id: 'dest',
        coordinate: destinationCoordinate,
        type: 'destination',
        vehicleCategory: activeVehicleId,
        label: arrivalTime || travelEta,
      });
    }

    const driversOnMap = liveDrivers.length > 0 ? liveDrivers : nearbyDrivers;

    driversOnMap.forEach((driver) => {
      markers.push({
        id: driver.id,
        coordinate: driver.coordinate,
        type: 'driver',
        vehicleCategory: driver.vehicleCategory,
        label: driver.etaMinutes ? `${driver.etaMinutes} min` : undefined,
      });
    });

    return markers;
  }, [
    userCoordinate,
    destinationCoordinate,
    nearbyDrivers,
    liveDrivers,
    activeVehicleId,
    arrivalTime,
    travelEta,
  ]);

  const vehicleIcon = useCallback((catId: VehicleCategoryId) => {
    for (const cat of CARGO_TYPE_CATEGORIES) {
      const v = cat.vehicles.find((item) => item.id === catId);
      if (v) return v.icon;
    }
    return '🚗';
  }, []);

  const getVehicleImageForCategory = useCallback((catId: VehicleCategoryId) => {
    for (const cat of CARGO_TYPE_CATEGORIES) {
      const v = cat.vehicles.find((item) => item.id === catId);
      if (v && v.vehicleImage) return v.vehicleImage;
    }
    return null;
  }, []);

  const handleCargoCategorySelect = (key: CargoTypeKey) => {
    setCargoTypeKey(key);
    const cat = CARGO_TYPE_CATEGORIES.find((c) => c.id === key);
    if (cat && cat.vehicles.length > 0) {
      setSelectedVehicleId(cat.vehicles[0].id);
    }
  };

  const handleContinue = () => {
    if (!serviceModelId) return;
    navigation.navigate('VehicleDetails', { vehicleId: activeVehicleId });
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.mapArea}>
        {userCoordinate ? (
          <MapContainer
            markers={mapMarkers}
            routeCoordinates={displayRoute}
            routeFollowsRoads={routeFollowsRoads}
            focusCoordinate={userCoordinate}
            showBackButton
            onBackPress={() => navigation.goBack()}
            mapPaddingBottom={SHEET_HEIGHT}
          />
        ) : null}
        {!userCoordinate && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Finding your location…</Text>
          </View>
        )}
      </View>

      <InlineBottomSheet contentStyle={styles.sheet} maxHeightRatio={0.46}>
        <RouteSummaryRow
          pickup={pickupLocation}
          destination={destination}
          travelEta={travelEta}
          arrivalTime={arrivalTime}
        />

        {mapError ? <Text style={styles.error}>{mapError}</Text> : null}

        {/* Cargo Category Tabs: Small Cargo, Medium Cargo, Large Cargo */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {CARGO_TYPE_CATEGORIES.map((cat) => {
            const active = activeCargoKey === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCargoCategorySelect(cat.id)}
                style={[styles.categoryTab, active && styles.categoryTabActive]}
              >
                <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                  {cat.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Vehicle Options row for active Cargo Category with custom vehicle images */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vehicleSubRow}
          contentContainerStyle={styles.vehicleSubRowContent}
        >
          {activeCargoCategory.vehicles.map((v) => {
            const active = activeVehicleId === v.id;
            return (
              <Pressable
                key={v.id}
                onPress={() => setSelectedVehicleId(v.id as VehicleCategoryId)}
                style={[styles.vehicleChip, active && styles.vehicleChipActive]}
              >
                {v.vehicleImage ? (
                  <Image source={v.vehicleImage} style={styles.vehicleChipImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.vehicleChipIcon}>{v.icon}</Text>
                )}
                <Text style={[styles.vehicleChipText, active && styles.vehicleChipTextActive]}>
                  {v.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.modelsSection}>
          {loadingPrices && (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modelsRow}
            scrollEnabled={!loadingPrices}
          >
            {serviceModels.map((model) => {
              const estimate = priceMap[model.id];
              const priceLabel = estimate
                ? formatCurrencyLabel(estimate.currency, estimate.price)
                : loadingPrices
                  ? '…'
                  : '—';
              return (
                <ServiceModelCard
                  key={`${model.categoryId}-${model.id}`}
                  model={model}
                  priceLabel={priceLabel}
                  vehicleIcon={vehicleIcon(activeVehicleId)}
                  vehicleImage={getVehicleImageForCategory(activeVehicleId)}
                  selected={serviceModelId === model.id}
                  unavailable={!estimate && !loadingPrices}
                  onPress={() => setServiceModel(model.id)}
                />
              );
            })}
          </ScrollView>
        </View>

        {estimateError ? <Text style={styles.error}>{estimateError}</Text> : null}

        <DelixButton
          title={serviceModelId ? 'Continue' : 'Select service class'}
          disabled={!serviceModelId || !!mapError}
          onPress={handleContinue}
        />
      </InlineBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mapBackground,
  },
  mapArea: {
    flex: 1,
  },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
  },
  sheet: { paddingTop: spacing.xs },
  categoryTabs: { marginBottom: spacing.xs, flexGrow: 0 },
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
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
  },
  categoryTabTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primaryDark,
  },
  vehicleSubRow: {
    marginBottom: spacing.md,
    flexGrow: 0,
  },
  vehicleSubRowContent: {
    gap: spacing.xs,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: spacing.xs,
  },
  vehicleChipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  vehicleChipImage: {
    width: moderateScale(30),
    height: moderateScale(22),
    marginRight: spacing.xxs,
  },
  vehicleChipIcon: {
    fontSize: moderateScale(16),
    marginRight: spacing.xxs,
  },
  vehicleChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
  vehicleChipTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primaryDark,
  },
  modelsSection: {
    minHeight: heightScale(125),
    marginBottom: spacing.sm,
  },
  modelsRow: {
    paddingBottom: spacing.xs,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    top: heightScale(48),
    zIndex: 1,
  },
  error: {
    fontFamily: fontFamilies.medium,
    color: colors.error,
    fontSize: moderateScale(13),
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});

export default MapBookingScreen;
