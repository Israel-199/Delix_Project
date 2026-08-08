import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapContainer } from './MapContainer';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontFamilies } from '../../theme/typography';
import { fetchNearbyDrivers } from '../../services/locationApiService';
import { requestUserLocation } from '../../services/locationService';
import { onLiveDriverMoved } from '../../services/socketService';
import { MapMarkerData, NearbyDriver } from '../../types';
import { vehicleCategoryFromBackend } from '../../utils/driverTracking';
import { moderateScale } from '../../utils/responsive';

interface HomeLiveMapCardProps {
  onPress?: () => void;
}

export const HomeLiveMapCard = ({ onPress }: HomeLiveMapCardProps) => {
  const [userPoint, setUserPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const point = await requestUserLocation();
      if (cancelled) return;

      if (point) {
        setUserPoint({ latitude: point.latitude, longitude: point.longitude });
        const nearby = await fetchNearbyDrivers(point.latitude, point.longitude);
        if (!cancelled) setDrivers(nearby);
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return onLiveDriverMoved((payload) => {
      const vehicleCategory = vehicleCategoryFromBackend(payload.vehicleType);
      setDrivers((prev) => {
        const next: NearbyDriver = {
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

  const markers = useMemo<MapMarkerData[]>(() => {
    const list: MapMarkerData[] = [];
    if (userPoint) {
      list.push({ id: 'user', type: 'user', coordinate: userPoint });
    }
    drivers.forEach((driver) => {
      list.push({
        id: driver.id,
        type: 'driver',
        coordinate: driver.coordinate,
        vehicleCategory: driver.vehicleCategory,
        etaMinutes: driver.etaMinutes,
      });
    });
    return list;
  }, [drivers, userPoint]);

  return (
    <Pressable style={styles.wrap} onPress={onPress} accessibilityRole="button">
      <View style={styles.header}>
        <Text style={styles.title}>Live map</Text>
        <Text style={styles.subtitle}>
          {drivers.length > 0 ? `${drivers.length} drivers nearby` : 'Tap to set route'}
        </Text>
      </View>

      <View style={styles.mapShell}>
        {loading && !userPoint ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <MapContainer
            style={styles.map}
            markers={markers}
            focusCoordinate={userPoint}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface || '#FFFFFF',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface || '#FFFFFF',
  },
  title: {
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(13),
    color: colors.primary,
  },
  mapShell: {
    height: moderateScale(150),
    backgroundColor: colors.backgroundTertiary,
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
