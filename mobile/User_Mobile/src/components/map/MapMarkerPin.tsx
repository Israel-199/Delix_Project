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
        <View style={styles.userPulse} />
        <View style={styles.userDot}>
          <View style={styles.userDotInner} />
        </View>
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
        {marker.label ? (
          <View style={styles.destTimeBadge}>
            <Text style={styles.destTimeText}>{marker.label}</Text>
          </View>
        ) : null}
        <View style={styles.destPin}>
          <View style={styles.destPinInner} />
        </View>
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
  userWrap: { alignItems: 'center', justifyContent: 'center', width: moderateScale(44), height: moderateScale(44) },
  userPulse: {
    position: 'absolute',
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: radius.full,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  userDot: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: radius.full,
    backgroundColor: colors.info,
    borderWidth: 3,
    borderColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  userDotInner: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: radius.full,
    backgroundColor: colors.background,
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
  destPin: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: radius.full,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  destPinInner: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: radius.full,
    backgroundColor: colors.background,
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
