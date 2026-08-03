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
      <View style={styles.userWrap}>
        <View style={styles.userDot}>
          <Text style={styles.userIcon}>🧍</Text>
        </View>
        {marker.label ? (
          <View style={styles.userBadge}>
            <Text style={styles.badgeText}>{marker.label}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (type === 'driver') {
    const icon = DRIVER_ICONS[marker.vehicleCategory ?? 'pickup'];
    return (
      <View style={styles.driverWrap}>
        <View style={styles.driverBubble}>
          <Text style={styles.driverIcon}>{icon}</Text>
        </View>
      </View>
    );
  }

  if (type === 'destination') {
    return (
      <View style={styles.destWrap}>
        <View style={styles.destPin}>
          <Text style={styles.destIcon}>🏁</Text>
        </View>
        {marker.label ? (
          <View style={styles.destBadge}>
            <Text style={styles.badgeText}>{marker.label}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.pickupWrap}>
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
  userWrap: { alignItems: 'center' },
  userDot: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  userIcon: { fontSize: moderateScale(16) },
  userBadge: {
    marginTop: spacing.xxs,
    backgroundColor: colors.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  driverWrap: { alignItems: 'center' },
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
  destPin: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  destIcon: { fontSize: moderateScale(18) },
  destBadge: {
    marginTop: spacing.xxs,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    maxWidth: moderateScale(120),
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
