import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { DEFAULT_PICKUP_COORD } from '../constants/locationCoords';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { resolveDestination, reverseGeocode } from '../services/geocodingService';
import { requestUserLocation, watchUserLocation } from '../services/locationService';
import { fetchDrivingRoute } from '../services/routingService';
import { onLiveDriverMoved } from '../services/socketService';
import { useBookingStore } from '../store/bookingStore';
import { MapMarkerData, NearbyDriver, ServiceModelId, VehicleCategoryId } from '../types';
import { vehicleCategoryFromBackend } from '../utils/driverTracking';
import { formatCurrencyLabel } from '../utils/mappers';
import { anchorRouteStartToUser } from '../utils/routeUtils';
import { heightScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'MapBooking'>;

const SHEET_HEIGHT = heightScale(812) * 0.42;

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
    vehicleCategoryId,
    serviceModelId,
    travelEta,
    arrivalTime,
    destinationCoordinate,
    userCoordinate,
    routeCoordinates,
    nearbyDrivers,
    setVehicleCategory,
    setServiceModel,
    setRouteGeometry,
    setPickupLabel,
    setUserCoordinate,
    fetchEstimatesForModels,
    estimateError,
  } = useBookingStore();

  const serviceModels = useMemo(
    () => getServiceModelsForCategory(vehicleCategoryId),
    [vehicleCategoryId]
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
  }, [vehicleCategoryId, mapReady, mapError, fetchEstimatesForModels, serviceModels]);

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
        vehicleCategory: vehicleCategoryId,
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
    vehicleCategoryId,
    arrivalTime,
    travelEta,
  ]);

  const vehicleIcon = useCallback((categoryId: VehicleCategoryId) => {
    const cat = VEHICLE_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.icon ?? '🚗';
  }, []);

  const handleContinue = () => {
    if (!serviceModelId) return;
    navigation.navigate('VehicleDetails', { vehicleId: vehicleCategoryId });
  };

  return (
    <View style={styles.root}>
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

      <InlineBottomSheet contentStyle={styles.sheet} maxHeightRatio={0.42}>
        <RouteSummaryRow
          pickup={pickupLocation}
          destination={destination}
          travelEta={travelEta}
          arrivalTime={arrivalTime}
        />

        {mapError ? <Text style={styles.error}>{mapError}</Text> : null}

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
                  vehicleIcon={vehicleIcon(vehicleCategoryId)}
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  sheet: { paddingTop: spacing.xs },
  categoryTabs: { marginBottom: spacing.md, flexGrow: 0 },
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
  modelsSection: {
    minHeight: heightScale(130),
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
    color: colors.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});

export default MapBookingScreen;
