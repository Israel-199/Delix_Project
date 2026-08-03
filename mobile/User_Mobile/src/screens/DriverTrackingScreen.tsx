import React, { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import io from 'socket.io-client';
import { InlineBottomSheet, MapContainer } from '../components';
import { SOCKET_URL, VEHICLE_CATEGORIES } from '../constants';
import { findServiceModel } from '../constants/serviceModels';
import { colors, spacing } from '../design-system';
import { fontSize, fontWeight } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { MapMarkerData } from '../types';
import { heightScale, moderateScale, widthScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverTracking'>;

const socket = io(SOCKET_URL);

const PICKUP_COORD = { latitude: 9.0205, longitude: 38.7469 };
const DEST_COORD = { latitude: 9.0305, longitude: 38.7669 };
const DRIVER_COORD = { latitude: 9.0225, longitude: 38.7509 };

const DriverTrackingScreen = ({ navigation, route }: Props) => {
  const { orderId } = route.params;
  const {
    bookingStatus,
    vehicleCategoryId,
    serviceModelId,
    pickupLocation,
    setBookingStatus,
  } = useBookingStore();

  const category = VEHICLE_CATEGORIES.find((v) => v.id === vehicleCategoryId);
  const model = serviceModelId
    ? findServiceModel(vehicleCategoryId, serviceModelId)
    : undefined;

  const isSearching = bookingStatus === 'searching';
  const isAssigned = bookingStatus === 'driver_assigned' || bookingStatus === 'in_transit';

  const mapMarkers: MapMarkerData[] = [
    { id: 'pickup', coordinate: PICKUP_COORD, label: '3 min', type: 'pickup' },
    { id: 'dest', coordinate: DEST_COORD, label: 'Arrive 10:34 AM', type: 'destination' },
    ...(isAssigned
      ? [{ id: 'driver', coordinate: DRIVER_COORD, label: '2 min', type: 'driver' as const }]
      : []),
  ];

  useEffect(() => {
    const onStatusChange = (payload: { status: string; orderId?: string }) => {
      if (payload.orderId && payload.orderId !== orderId) return;
      if (payload.status === 'DRIVER_ACCEPTED') {
        setBookingStatus('driver_assigned');
      }
    };

    socket.on('order_status_changed', onStatusChange);

    // Demo: auto-assign driver after 3s if backend doesn't respond
    const demoTimer = setTimeout(() => {
      if (useBookingStore.getState().bookingStatus === 'searching') {
        setBookingStatus('driver_assigned');
      }
    }, 3000);

    return () => {
      socket.off('order_status_changed', onStatusChange);
      clearTimeout(demoTimer);
    };
  }, [orderId, setBookingStatus]);

  return (
    <View style={styles.root}>
      <MapContainer
        markers={mapMarkers}
        routeCoordinates={[PICKUP_COORD, DEST_COORD]}
        showBackButton
        onBackPress={() => navigation.navigate('CustomerHome')}
      />

      {isSearching && (
        <InlineBottomSheet contentStyle={styles.searchingContent}>
          <Text style={styles.searchingTitle}>Locating nearby driver...</Text>
          <Text style={styles.searchingSub}>
            Notifying {category?.name} {model?.name} drivers near {pickupLocation}
          </Text>
          <View style={styles.loaderPulse} />
        </InlineBottomSheet>
      )}

      {isAssigned && (
        <InlineBottomSheet>
          <View style={styles.driverHeader}>
            <Text style={styles.driverTitle}>Driver is arriving!</Text>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>2 mins away</Text>
            </View>
          </View>

          <View style={styles.driverCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>👤</Text>
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
});

export default DriverTrackingScreen;
