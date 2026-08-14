import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DelixButton, InlineBottomSheet, MapContainer } from '../components';
import { VEHICLE_CATEGORIES } from '../constants';
import { findServiceModel } from '../constants/serviceModels';
import { colors, spacing } from '../design-system';
import { fontSize, fontWeight } from '../design-system/typography';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { watchUserLocation } from '../services/locationService';
import {
  emitOrderCompleted,
  joinOrderRoom,
  leaveOrderRoom,
  onLiveDriverMoved,
  onOrderStatusChanged,
  onSocketConnectionState,
  onSocketReconnect,
  SocketConnectionState,
} from '../services/socketService';
import { fetchOrderById } from '../services/orderService';
import { getAuthToken } from '../services/apiClient';
import { useBookingStore } from '../store/bookingStore';
import { MapMarkerData, VehicleCategoryId } from '../types';
import { vehicleCategoryFromBackend } from '../utils/driverTracking';
import { heightScale, moderateScale, widthScale } from '../utils/responsive';
import { anchorRouteStartToUser } from '../utils/routeUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverTracking'>;

const SHEET_HEIGHT = heightScale(812) * 0.38;

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
  const noDrivers = bookingStatus === 'no_drivers';
  const isAssigned =
    bookingStatus === 'driver_assigned' ||
    bookingStatus === 'in_transit';

  const userPoint = userCoordinate ?? pickupCoordinate;
  const destPoint = destinationCoordinate;
  const mapFocus = userPoint ?? destPoint;

  const [driverCoordinate, setDriverCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverEta, setDriverEta] = useState('—');
  const [driverVehicle, setDriverVehicle] = useState<VehicleCategoryId>(vehicleCategoryId);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [driverPlate, setDriverPlate] = useState<string | null>(null);
  const [driverPhone, setDriverPhone] = useState<string | null>(null);
  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
  const [socketState, setSocketState] = useState<SocketConnectionState>('connected');

  const syncOrderFromBackend = useCallback(async () => {
    const order = await fetchOrderById(orderId, getAuthToken());
    if (!order) return;

    if (order.status === 'SEARCHING_DRIVER') {
      setBookingStatus('searching');
      return;
    }

    if (order.status === 'DRIVER_ACCEPTED' || order.status === 'ARRIVED_PICKUP') {
      setBookingStatus('driver_assigned');
    } else if (order.status === 'IN_TRANSIT') {
      setBookingStatus('in_transit');
    } else if (order.status === 'COMPLETED') {
      setBookingStatus('completed');
      navigation.replace('DeliveryCompleted', { orderId });
      return;
    }

    if (order.driverId) setAssignedDriverId(order.driverId);
    if (order.driverName) setDriverName(order.driverName);
    if (order.plateNumber) setDriverPlate(order.plateNumber);
    if (order.driverPhone) setDriverPhone(order.driverPhone);
    if (order.vehicleRequested) {
      setDriverVehicle(vehicleCategoryFromBackend(order.vehicleRequested));
    }
  }, [orderId, setBookingStatus, navigation]);

  useEffect(() => {
    return onSocketConnectionState(setSocketState);
  }, []);

  useEffect(() => {
    joinOrderRoom(orderId);
    void syncOrderFromBackend();

    const unsubscribe = onSocketReconnect(() => {
      joinOrderRoom(orderId);
      void syncOrderFromBackend();
    });

    return () => {
      unsubscribe();
      leaveOrderRoom(orderId);
    };
  }, [orderId, syncOrderFromBackend]);

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

      if (payload.status === 'NO_DRIVERS_AVAILABLE') {
        setBookingStatus('no_drivers');
      }
      if (payload.status === 'SEARCHING_DRIVER') {
        setBookingStatus('searching');
      }
      if (payload.status === 'DRIVER_ACCEPTED') {
        setBookingStatus('driver_assigned');
        if (payload.driverId) setAssignedDriverId(payload.driverId);
        if (payload.driverName) setDriverName(payload.driverName);
        if (payload.plateNumber) setDriverPlate(payload.plateNumber);
        if (payload.driverPhone) setDriverPhone(payload.driverPhone);
        if (payload.vehicleType) {
          setDriverVehicle(vehicleCategoryFromBackend(payload.vehicleType));
        }
      }
      if (payload.status === 'ARRIVED_PICKUP') {
        setBookingStatus('driver_assigned');
        setDriverEta('Arrived');
      }
      if (payload.status === 'IN_TRANSIT') {
        setBookingStatus('in_transit');
      }
      if (payload.status === 'DELIVERY_COMPLETED') {
        setBookingStatus('completed');
        navigation.replace('DeliveryCompleted', { orderId });
      }
    });

    return unsubscribe;
  }, [orderId, setBookingStatus, navigation]);

  useEffect(() => {
    const unsubscribe = onLiveDriverMoved((payload) => {
      if (payload.orderId && payload.orderId !== orderId) return;
      if (assignedDriverId && payload.driverId !== assignedDriverId) return;

      setDriverCoordinate({ latitude: payload.lat, longitude: payload.lng });
      if (payload.vehicleType) {
        setDriverVehicle(vehicleCategoryFromBackend(payload.vehicleType));
      }

      if (userPoint) {
        const latDiff = userPoint.latitude - payload.lat;
        const lngDiff = userPoint.longitude - payload.lng;
        const distKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
        setDriverEta(distKm < 0.05 ? 'Arriving' : `${Math.max(1, Math.round(distKm * 4))} min`);
      }
    });

    return unsubscribe;
  }, [orderId, assignedDriverId, userPoint]);

  const displayRoute = useMemo(() => {
    if (!userPoint || routeCoordinates.length < 2) {
      return routeCoordinates;
    }
    return anchorRouteStartToUser(routeCoordinates, userPoint);
  }, [userPoint, routeCoordinates]);

  const mapMarkers: MapMarkerData[] = useMemo(() => {
    const markers: MapMarkerData[] = [];

    if (userPoint) {
      markers.push({
        id: 'user',
        coordinate: userPoint,
        type: 'user',
      });
    }

    if (destPoint) {
      markers.push({
        id: 'dest',
        coordinate: destPoint,
        type: 'destination',
        vehicleCategory: vehicleCategoryId,
        label: arrivalTime || travelEta,
      });
    }

    if (isAssigned && driverCoordinate) {
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
    emitOrderCompleted(orderId);
    setBookingStatus('completed');
    navigation.replace('DeliveryCompleted', { orderId });
  };

  if (!mapFocus) {
    return (
      <View style={styles.root}>
        <ScreenFallback message="Route data missing. Go back and select pickup and destination." onBack={() => navigation.navigate('CustomerHome')} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapContainer
        markers={mapMarkers}
        routeCoordinates={displayRoute.length > 1 ? displayRoute : undefined}
        routeFollowsRoads
        focusCoordinate={mapFocus}
        mapPaddingBottom={SHEET_HEIGHT}
        showBackButton
        onBackPress={() => navigation.navigate('CustomerHome')}
      />

      {socketState !== 'connected' && (
        <View style={styles.reconnectBanner}>
          <Text style={styles.reconnectText}>
            {socketState === 'connecting' ? 'Reconnecting…' : 'Connection lost — retrying'}
          </Text>
        </View>
      )}

      {isSearching && (
        <InlineBottomSheet contentStyle={styles.searchingContent} maxHeightRatio={0.38}>
          <Text style={styles.searchingTitle}>Finding nearest driver...</Text>
          <Text style={styles.searchingSub}>
            Contacting the closest available {category?.name} {model?.name} near {pickupLocation}
          </Text>
          {destination ? (
            <Text style={styles.routeHint}>Route to {destination}</Text>
          ) : null}
          <Text style={styles.orderRef}>Order {orderId}</Text>
          <View style={styles.loaderPulse} />
        </InlineBottomSheet>
      )}

      {noDrivers && (
        <InlineBottomSheet contentStyle={styles.searchingContent} maxHeightRatio={0.42}>
          <Text style={styles.noDriversTitle}>No drivers available</Text>
          <Text style={styles.searchingSub}>
            We could not find an online {category?.name ?? 'vehicle'} driver near {pickupLocation}.
            Try again in a few minutes or choose a different vehicle type.
          </Text>
          <Text style={styles.orderRef}>Order {orderId}</Text>
          <DelixButton
            title="Back to Home"
            onPress={() => navigation.navigate('CustomerHome')}
            style={styles.retryBtn}
          />
        </InlineBottomSheet>
      )}

      {isAssigned && (
        <InlineBottomSheet maxHeightRatio={0.38}>
          <View style={styles.driverHeader}>
            <Text style={styles.driverTitle}>
              {bookingStatus === 'in_transit' ? 'Delivery in progress' : 'Driver is arriving!'}
            </Text>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{driverEta} away</Text>
            </View>
          </View>

          <View style={styles.driverCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>{category?.icon ?? '🚗'}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driverName ?? 'Your driver'}</Text>
              <Text style={styles.driverMeta}>
                {driverPlate ? `${driverPlate} · ` : ''}
                {category?.name ?? 'Vehicle'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call driver"
              style={[styles.phoneBtn, !driverPhone && styles.phoneBtnDisabled]}
              disabled={!driverPhone}
              onPress={() => {
                if (driverPhone) {
                  Linking.openURL(`tel:${driverPhone.replace(/\s/g, '')}`);
                }
              }}
            >
              <Ionicons name="call" size={20} color={colors.primary} />
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
  reconnectBanner: {
    position: 'absolute',
    top: heightScale(56),
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.warningTint,
    borderRadius: moderateScale(8),
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  reconnectText: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(13),
    color: colors.warning,
    textAlign: 'center',
  },
  searchingContent: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  searchingTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
  },
  noDriversTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.error,
    textAlign: 'center',
  },
  searchingSub: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  routeHint: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(13),
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  orderRef: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(12),
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
  retryBtn: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  driverTitle: {
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
  },
  etaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: widthScale(10),
    paddingVertical: heightScale(6),
    borderRadius: spacing.sm,
  },
  etaText: {
    fontFamily: fontFamilies.bold,
    color: colors.textOnPrimary,
    fontSize: moderateScale(13),
  },
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
  driverName: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  driverMeta: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  phoneBtn: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneBtnDisabled: { opacity: 0.35 },
  phoneIcon: { fontSize: moderateScale(20) },
  completeBtn: { marginTop: spacing.lg },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  fallbackBack: {
    position: 'absolute',
    top: spacing['2xl'],
    left: spacing.lg,
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: colors.primary,
  },
  fallbackText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default DriverTrackingScreen;

const ScreenFallback = ({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) => (
  <View style={styles.fallback}>
    <Pressable onPress={onBack}>
      <Text style={styles.fallbackBack}>← Back</Text>
    </Pressable>
    <Text style={styles.fallbackText}>{message}</Text>
  </View>
);

