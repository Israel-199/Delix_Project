import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import MapView, { MapViewProps, Marker, Polyline, Region } from 'react-native-maps';
import { colors, radius, shadows, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { DEFAULT_MAP_REGION } from '../../constants';
import { MapMarkerData } from '../../types';
import { moderateScale, widthScale, heightScale } from '../../utils/responsive';

export interface MapContainerProps extends Omit<MapViewProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  markers?: MapMarkerData[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backButtonOverlay?: ReactNode;
  rightOverlay?: ReactNode;
  initialRegion?: Region;
}

const markerEmoji: Record<NonNullable<MapMarkerData['type']>, string> = {
  pickup: '📍',
  destination: '🏁',
  driver: '🚗',
};

export const MapContainer = ({
  style,
  markers = [],
  routeCoordinates,
  showBackButton = false,
  onBackPress,
  backButtonOverlay,
  rightOverlay,
  initialRegion = DEFAULT_MAP_REGION,
  children,
  ...mapProps
}: MapContainerProps) => {
  return (
    <View style={[styles.container, style]}>
      <MapView style={styles.map} initialRegion={initialRegion} {...mapProps}>
        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.success}
            strokeWidth={4}
          />
        )}

        {markers.map((marker) => (
          <Marker key={marker.id} coordinate={marker.coordinate}>
            <View style={styles.markerWrap}>
              <Text style={styles.markerIcon}>
                {markerEmoji[marker.type ?? 'pickup']}
              </Text>
              {marker.label ? (
                <View style={styles.markerBadge}>
                  <Text style={styles.markerBadgeText}>{marker.label}</Text>
                </View>
              ) : null}
            </View>
          </Marker>
        ))}

        {children}
      </MapView>

      {showBackButton && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBackPress}
          style={[styles.overlayButton, styles.backButton]}
        >
          {backButtonOverlay ?? <Text style={styles.backIcon}>←</Text>}
        </Pressable>
      )}

      {rightOverlay ? (
        <View style={[styles.overlayButton, styles.rightButton]}>{rightOverlay}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mapBackground,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerWrap: {
    alignItems: 'center',
  },
  markerIcon: {
    fontSize: moderateScale(24),
  },
  markerBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: widthScale(10),
    paddingVertical: heightScale(6),
    borderRadius: radius.sm,
    marginTop: spacing.xxs,
    ...shadows.sm,
  },
  markerBadgeText: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.extrabold,
    fontSize: fontSize.sm,
  },
  overlayButton: {
    position: 'absolute',
    top: heightScale(50),
  },
  backButton: {
    left: widthScale(20),
    width: moderateScale(44),
    height: moderateScale(44),
    backgroundColor: colors.background,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  rightButton: {
    right: widthScale(20),
  },
  backIcon: {
    fontSize: moderateScale(20),
    fontWeight: fontWeight.black,
    color: colors.textPrimary,
  },
});

export default MapContainer;
