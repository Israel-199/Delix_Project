import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
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
  routeFollowsRoads?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backButtonOverlay?: ReactNode;
  rightOverlay?: ReactNode;
  initialRegion?: Region;
  fitToRoute?: boolean;
  mapPaddingBottom?: number;
}

export const MapContainer = ({
  style,
  markers = [],
  routeCoordinates,
  routeFollowsRoads = true,
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

  const fitCoords = useMemo(() => {
    const points = markers
      .filter((m) => m.type === 'user' || m.type === 'destination')
      .map((m) => m.coordinate);

    if (routeCoordinates?.length) {
      points.push(
        routeCoordinates[0],
        routeCoordinates[routeCoordinates.length - 1]
      );
    }

    return points;
  }, [markers, routeCoordinates]);

  useEffect(() => {
    if (!fitToRoute || !mapRef.current || fitCoords.length < 2) return;

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(fitCoords, {
        edgePadding: {
          top: heightScale(80),
          right: widthScale(48),
          bottom: mapPaddingBottom + heightScale(48),
          left: widthScale(48),
        },
        animated: true,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [fitCoords, fitToRoute, mapPaddingBottom]);

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
            strokeColor={routeFollowsRoads ? colors.success : colors.warning}
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
  if (type === 'user') return 0.5;
  if (type === 'destination') return 1;
  if (type === 'driver') return 0.5;
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
