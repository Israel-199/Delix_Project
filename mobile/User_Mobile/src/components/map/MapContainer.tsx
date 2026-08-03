import React, { ReactNode, useEffect, useRef } from 'react';
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
import { MapMarkerPin } from './MapMarkerPin';

export interface MapContainerProps extends Omit<MapViewProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  markers?: MapMarkerData[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backButtonOverlay?: ReactNode;
  rightOverlay?: ReactNode;
  initialRegion?: Region;
  /** When true, map zooms to fit route + markers. */
  fitToRoute?: boolean;
  /** Bottom padding so markers aren't hidden under the sheet (px). */
  mapPaddingBottom?: number;
}

export const MapContainer = ({
  style,
  markers = [],
  routeCoordinates,
  showBackButton = false,
  onBackPress,
  backButtonOverlay,
  rightOverlay,
  initialRegion = DEFAULT_MAP_REGION,
  fitToRoute = true,
  mapPaddingBottom = 0,
  children,
  ...mapProps
}: MapContainerProps) => {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!fitToRoute || !mapRef.current) return;

    const coords = [
      ...markers.map((m) => m.coordinate),
      ...(routeCoordinates ?? []),
    ];

    if (coords.length < 2) return;

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: {
          top: heightScale(80),
          right: widthScale(40),
          bottom: mapPaddingBottom + heightScale(40),
          left: widthScale(40),
        },
        animated: true,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [markers, routeCoordinates, fitToRoute, mapPaddingBottom]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        {...mapProps}
      >
        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.success}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            anchor={{ x: 0.5, y: typeAnchorY(marker.type) }}
            tracksViewChanges={false}
          >
            <MapMarkerPin marker={marker} />
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

const typeAnchorY = (type?: MapMarkerData['type']) => {
  if (type === 'user' || type === 'driver') return 0.5;
  if (type === 'destination') return 0.85;
  return 0.9;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mapBackground,
  },
  map: {
    flex: 1,
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
