import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import MapView, { MapViewProps, Polyline, Region } from 'react-native-maps';
import { colors, radius, shadows } from '../../design-system';
import { fontWeight } from '../../design-system/typography';
import { DEFAULT_MAP_REGION } from '../../constants';
import { MapMarkerData } from '../../types';
import { moderateScale, widthScale, heightScale } from '../../utils/responsive';
import { regionAroundUserDetail } from '../../services/locationService';
import { MapMarkerView } from './MapMarkerView';

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
  focusCoordinate?: { latitude: number; longitude: number } | null;
  mapPaddingBottom?: number;
}

const MapContainerInner = ({
  style,
  markers = [],
  routeCoordinates,
  routeFollowsRoads = true,
  showBackButton = false,
  onBackPress,
  backButtonOverlay,
  rightOverlay,
  initialRegion = DEFAULT_MAP_REGION,
  focusCoordinate,
  mapPaddingBottom = 0,
  children,
  ...mapProps
}: MapContainerProps) => {
  const mapRef = useRef<MapView>(null);
  const didZoomToUser = useRef(false);
  const focusOnMount = useRef(!!focusCoordinate);
  const focusLat = focusCoordinate?.latitude;
  const focusLng = focusCoordinate?.longitude;

  useEffect(() => {
    if (focusLat == null || focusLng == null || didZoomToUser.current) return;

    didZoomToUser.current = true;
    if (focusOnMount.current) return;

    const region = regionAroundUserDetail({ latitude: focusLat, longitude: focusLng });
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(region, 280);
    }, 80);

    return () => clearTimeout(timer);
  }, [focusLat, focusLng]);

  const mapInitialRegion =
    focusLat != null && focusLng != null
      ? regionAroundUserDetail({ latitude: focusLat, longitude: focusLng })
      : initialRegion;

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapInitialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapPadding={{
          top: heightScale(60),
          right: widthScale(16),
          bottom: mapPaddingBottom + heightScale(16),
          left: widthScale(16),
        }}
        {...mapProps}
      >
        {routeCoordinates && routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={routeFollowsRoads ? colors.success : colors.warning}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {markers.map((marker) => (
          <MapMarkerView key={marker.id} marker={marker} />
        ))}

        {children}
      </MapView>

      {showBackButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBackPress}
          style={[styles.overlayButton, styles.backButton]}
        >
          {backButtonOverlay ?? <Text style={styles.backIcon}>←</Text>}
        </Pressable>
      ) : null}

      {rightOverlay ? (
        <View style={[styles.overlayButton, styles.rightButton]}>{rightOverlay}</View>
      ) : null}
    </View>
  );
};

export const MapContainer = React.memo(MapContainerInner);

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
