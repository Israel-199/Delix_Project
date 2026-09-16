import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows } from '../../design-system';
import { fontWeight } from '../../design-system/typography';
import { DEFAULT_MAP_REGION } from '../../constants';
import { MapMarkerData } from '../../types';
import { moderateScale, widthScale, heightScale } from '../../utils/responsive';
import { regionAroundUserDetail } from '../../services/locationService';
import OSMMapWebView, { OSMMarker } from './OSMMapWebView';

export interface MapContainerProps {
  style?: StyleProp<ViewStyle>;
  markers?: MapMarkerData[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  routeFollowsRoads?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backButtonOverlay?: ReactNode;
  rightOverlay?: ReactNode;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
  focusCoordinate?: { latitude: number; longitude: number } | null;
  mapPaddingBottom?: number;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  children?: ReactNode;
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
  const focusLat = focusCoordinate?.latitude;
  const focusLng = focusCoordinate?.longitude;

  const osmMarkers: OSMMarker[] = markers.map(m => ({
    id: String(m.id || Math.random()),
    coordinate: m.coordinate,
    type: m.type as any,
    label: m.etaMinutes ? `${m.etaMinutes} min` : undefined
  }));

  const mapInitialRegion =
    focusLat != null && focusLng != null
      ? regionAroundUserDetail({ latitude: focusLat, longitude: focusLng })
      : initialRegion;

  return (
    <View style={[styles.container, style]}>
      <OSMMapWebView
        style={styles.map}
        initialRegion={mapInitialRegion}
        focusCoordinate={focusCoordinate}
        markers={osmMarkers}
        routeCoordinates={routeCoordinates}
        paddingBottom={mapPaddingBottom}
      />

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
