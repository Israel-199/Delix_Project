import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, InlineBottomSheet, MapContainer } from '../components';
import { VEHICLE_CATEGORIES } from '../constants';
import { DEFAULT_PICKUP_COORD } from '../constants/locationCoords';
import { findServiceModel } from '../constants/serviceModels';
import { colors, spacing } from '../design-system';
import { fontSize, fontWeight } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { watchUserLocation } from '../services/locationService';
import { onLiveDriverMoved, onOrderStatusChanged } from '../services/socketService';
import { useBookingStore } from '../store/bookingStore';
import { MapMarkerData, VehicleCategoryId } from '../types';
import { vehicleCategoryFromBackend } from '../utils/driverTracking';
import { heightScale, moderateScale, widthScale } from '../utils/responsive';
import { anchorRouteStartToUser } from '../utils/routeUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverTracking'>;

const SHEET_HEIGHT = heightScale(812) * 0.38;

const offsetCoordinate = (
  base: { latitude: number; longitude: number },
  dLat: number,
  dLng: number
) => ({
  latitude: base.latitude + dLat,
  longitude: base.longitude + dLng,
});

const DriverTrackingScreen = ({ navigation, route }: Props) => {
  const { orderId } = route.params;
  const {
    bookingStatus,
    vehicleCategoryId,
    serviceModelId,
    pickupLocation,
    destination,
    userCoordinate,
    pickupCoordinate,
    destinationCoordinate,
    routeCoordinates,
    arrivalTime,
    travelEta,
    setBookingStatus,
    setUserCoordinate,
  } = useBookingStore();

  const category = VEHICLE_CATEGORIES.find((v) => v.id === vehicleCategoryId);
  const model = serviceModelId
    ? findServiceModel(vehicleCategoryId, serviceModelId)
    : undefined;

  const isSearching = bookingStatus === 'searching';
  const isAssigned = bookingStatus === 'driver_assigned' || bookingStatus === 'in_transit';

  const userPoint = userCoordinate ?? pickupCoordinate ?? DEFAULT_PICKUP_COORD;
  const destPoint = destinationCoordinate;

  const [driverCoordinate, setDriverCoordinate] = useState(() =>
    offsetCoordinate(userPoint, 0.004, 0.003)
  );
  const [driverEta, setDriverEta] = useState('3 min');
  const [driverVehicle, setDriverVehicle] = useState<VehicleCategoryId>(vehicleCategoryId);
  const [liveDriverActive, setLiveDriverActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stopWatch: (() => void) | undefined;

    watchUserLocation((point) => {
      if (!cancelled) setUserCoordinate(point);
    }).then((stop) => {
      stopWatch = stop;
    });

    return () => {
      cancelled = true;
      stopWatch?.();
    };
  }, [setUserCoordinate]);

  useEffect(() => {
    const unsubscribe = onOrderStatusChanged((payload) => {
      if (payload.orderId && payload.orderId !== orderId) return;

      if (payload.status === 'DRIVER_ACCEPTED') {
        setBookingStatus('driver_assigned');
      }
      if (payload.status === 'DELIVERY_COMPLETED') {
        setBookingStatus('completed');
        navigation.replace('DeliveryCompleted', { orderId });
      }
    });

    const demoTimer = setTimeout(() => {
      if (useBookingStore.getState().bookingStatus === 'searching') {
        setBookingStatus('driver_assigned');
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(demoTimer);
    };
  }, [orderId, setBookingStatus, navigation]);

  useEffect(() => {
    const unsubscribe = onLiveDriverMoved((payload) => {
      setLiveDriverActive(true);
      setDriverCoordinate({ latitude: payload.lat, longitude: payload.lng });
      if (payload.vehicleType) {
        setDriverVehicle(vehicleCategoryFromBackend(payload.vehicleType));
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAssigned || liveDriverActive) return;

    const startTarget =
      useBookingStore.getState().userCoordinate ??
      useBookingStore.getState().pickupCoordinate ??
      DEFAULT_PICKUP_COORD;

    setDriverCoordinate(offsetCoordinate(startTarget, 0.004, 0.003));

    const interval = setInterval(() => {
      const target =
        useBookingStore.getState().userCoordinate ??
        useBookingStore.getState().pickupCoordinate ??
        DEFAULT_PICKUP_COORD;

      setDriverCoordinate((prev) => {
        const latDiff = target.latitude - prev.latitude;
        const lngDiff = target.longitude - prev.longitude;
        const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (dist < 0.0004) {
          setDriverEta('Arriving');
          return prev;
        }

        const step = 0.00035;
        const ratio = step / dist;
        setDriverEta(`${Math.max(1, Math.round(dist * 111000 / 500))} min`);
        return {
          latitude: prev.latitude + latDiff * ratio,
          longitude: prev.longitude + lngDiff * ratio,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAssigned, liveDriverActive]);

  const displayRoute = useMemo(() => {
    if (!userPoint || routeCoordinates.length < 2) {
      return routeCoordinates;
    }
    return anchorRouteStartToUser(routeCoordinates, userPoint);
  }, [userPoint, routeCoordinates]);

  const mapMarkers: MapMarkerData[] = useMemo(() => {
    const markers: MapMarkerData[] = [
      {
        id: 'user',
        coordinate: userPoint,
        type: 'user',
      },
    ];

    if (destPoint) {
      markers.push({
        id: 'dest',
        coordinate: destPoint,
        type: 'destination',
        vehicleCategory: vehicleCategoryId,
        label: arrivalTime || travelEta,
      });
    }

    if (isAssigned) {
      markers.push({
        id: 'driver',
        coordinate: driverCoordinate,
        type: 'driver',
        vehicleCategory: driverVehicle,
        label: driverEta,
      });
    }

    return markers;
  }, [
    userPoint,
    destPoint,
    vehicleCategoryId,
    arrivalTime,
    travelEta,
    isAssigned,
    driverCoordinate,
    driverEta,
    driverVehicle,
  ]);

  const handleCompleteDelivery = () => {
    setBookingStatus('completed');
    navigation.replace('DeliveryCompleted', { orderId });
  };

  return (
    <View style={styles.root}>
      <MapContainer
        markers={mapMarkers}
        routeCoordinates={displayRoute.length > 1 ? displayRoute : undefined}
        routeFollowsRoads
        focusCoordinate={userPoint}
        mapPaddingBottom={SHEET_HEIGHT}
        showBackButton
        onBackPress={() => navigation.navigate('CustomerHome')}
      />

      {isSearching && (
        <InlineBottomSheet contentStyle={styles.searchingContent} maxHeightRatio={0.38}>
          <Text style={styles.searchingTitle}>Locating nearby driver...</Text>
          <Text style={styles.searchingSub}>
            Notifying {category?.name} {model?.name} drivers near {pickupLocation}
          </Text>
          {destination ? (
            <Text style={styles.routeHint}>Route to {destination}</Text>
          ) : null}
          <Text style={styles.orderRef}>Order {orderId}</Text>
          <View style={styles.loaderPulse} />
        </InlineBottomSheet>
      )}

      {isAssigned && (
        <InlineBottomSheet maxHeightRatio={0.38}>
          <View style={styles.driverHeader}>
            <Text style={styles.driverTitle}>Driver is arriving!</Text>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{driverEta} away</Text>
            </View>
          </View>

          <View style={styles.driverCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>{category?.icon ?? '🚗'}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>Yared Moges</Text>
              <Text style={styles.driverMeta}>
                ★ 4.9 · AA-3-90812 ({category?.name})
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call driver"
              style={styles.phoneBtn}
              onPress={() => Linking.openURL('tel:+251911234567')}
            >
              <Text style={styles.phoneIcon}>📞</Text>
            </Pressable>
          </View>

          <DelixButton
            title="Mark as Delivered"
            variant="secondary"
            onPress={handleCompleteDelivery}
            style={styles.completeBtn}
          />
        </InlineBottomSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchingContent: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  searchingTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black },
  searchingSub: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  routeHint: {
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  orderRef: {
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    marginTop: spacing.xs,
  },
  loaderPulse: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: colors.primary,
    opacity: 0.5,
    marginTop: spacing.lg,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  driverTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black },
  etaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: widthScale(10),
    paddingVertical: heightScale(6),
    borderRadius: spacing.sm,
  },
  etaText: { color: colors.textOnPrimary, fontWeight: fontWeight.extrabold, fontSize: fontSize.sm },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: spacing.md,
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: colors.avatarBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarIcon: { fontSize: moderateScale(24) },
  driverInfo: { flex: 1 },
  driverName: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold },
  driverMeta: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xxs },
  phoneBtn: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.phoneButtonBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneIcon: { fontSize: moderateScale(20) },
  completeBtn: { marginTop: spacing.lg },
});

export default DriverTrackingScreen;
