import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { MapMarkerData, VehicleCategoryId } from '../../types';
import { moderateScale } from '../../utils/responsive';

const DRIVER_ICONS: Record<VehicleCategoryId, string> = {
  lada: '🚕',
  pickup: '🛻',
  mini_truck: '🚚',
  large_truck: '🚛',
};

export interface MapMarkerPinProps {
  marker: MapMarkerData;
}

export const MapMarkerPin = ({ marker }: MapMarkerPinProps) => {
  const type = marker.type ?? 'pickup';

  if (type === 'user') {
    return (
      <View style={styles.userWrap} collapsable={false}>
        <View style={styles.userDot} />
      </View>
    );
  }

  if (type === 'driver') {
    const icon = DRIVER_ICONS[marker.vehicleCategory ?? 'pickup'];
    return (
      <View style={styles.driverWrap} collapsable={false}>
        {marker.label ? (
          <View style={styles.driverEtaBadge}>
            <Text style={styles.driverEtaText}>{marker.label}</Text>
          </View>
        ) : null}
        <View style={styles.driverBubble}>
          <Text style={styles.driverIcon}>{icon}</Text>
        </View>
      </View>
    );
  }

  if (type === 'destination') {
    const vehicleIcon = DRIVER_ICONS[marker.vehicleCategory ?? 'pickup'];
    return (
      <View style={styles.destWrap} collapsable={false}>
        {marker.label ? (
          <View style={styles.destTimeBadge}>
            <Text style={styles.destTimeText}>{marker.label}</Text>
          </View>
        ) : null}
        <View style={styles.destVehicleBubble}>
          <Text style={styles.destVehicleIcon}>{vehicleIcon}</Text>
        </View>
        <Text style={styles.destLabel}>Dropoff</Text>
      </View>
    );
  }

  return (
    <View style={styles.pickupWrap} collapsable={false}>
      <View style={styles.pickupPin}>
        <View style={styles.pickupDot} />
      </View>
      {marker.label ? (
        <View style={styles.pickupBadge}>
          <Text style={styles.badgeText}>{marker.label}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  userWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: moderateScale(24),
    height: moderateScale(24),
  },
  userDot: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: radius.full,
    backgroundColor: colors.info,
    borderWidth: 3,
    borderColor: colors.background,
    ...shadows.sm,
  },
  driverWrap: { alignItems: 'center' },
  driverEtaBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    marginBottom: spacing.xxs,
    ...shadows.sm,
  },
  driverEtaText: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
  },
  driverBubble: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  driverIcon: { fontSize: moderateScale(20) },
  destWrap: { alignItems: 'center' },
  destTimeBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    marginBottom: spacing.xxs,
    ...shadows.sm,
  },
  destTimeText: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  destVehicleBubble: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  destVehicleIcon: {
    fontSize: moderateScale(28),
  },
  destLabel: {
    marginTop: spacing.xxs,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.success,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  pickupWrap: { alignItems: 'center' },
  pickupPin: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  pickupDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  pickupBadge: {
    marginTop: spacing.xxs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});

export default MapMarkerPin;
