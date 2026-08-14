import React, { useMemo } from 'react';
import { MapContainer } from './MapContainer';
import { LiveDriverMarker } from './LiveDriverMarker';
import { MapMarkerData, VehicleCategoryId } from '../../types';

export interface TrackingMapLayerProps {
  userPoint: { latitude: number; longitude: number };
  destPoint?: { latitude: number; longitude: number } | null;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  mapPaddingBottom: number;
  vehicleCategoryId: VehicleCategoryId;
  destLabel?: string;
  showDriver: boolean;
  driverCoordinate?: { latitude: number; longitude: number } | null;
  driverVehicle?: VehicleCategoryId;
  driverEta?: string;
  onBackPress: () => void;
}

const StaticMarkers = React.memo(
  ({
    userPoint,
    destPoint,
    vehicleCategoryId,
    destLabel,
  }: {
    userPoint: { latitude: number; longitude: number };
    destPoint?: { latitude: number; longitude: number } | null;
    vehicleCategoryId: VehicleCategoryId;
    destLabel?: string;
  }) => {
    const markers = useMemo<MapMarkerData[]>(() => {
      const list: MapMarkerData[] = [
        { id: 'user', coordinate: userPoint, type: 'user' },
      ];
      if (destPoint) {
        list.push({
          id: 'dest',
          coordinate: destPoint,
          type: 'destination',
          vehicleCategory: vehicleCategoryId,
          label: destLabel,
        });
      }
      return list;
    }, [
      userPoint.latitude,
      userPoint.longitude,
      destPoint?.latitude,
      destPoint?.longitude,
      vehicleCategoryId,
      destLabel,
    ]);

    return (
      <MapContainer
        markers={markers}
        focusCoordinate={userPoint}
        mapPaddingBottom={0}
        scrollEnabled={false}
        style={{ flex: 1 }}
      />
    );
  }
);

StaticMarkers.displayName = 'StaticMarkers';

/**
 * Full-screen tracking map — only map-related props trigger rerenders.
 * Driver GPS updates go through LiveDriverMarker without rebuilding static pins.
 */
export const TrackingMapLayer = React.memo(
  ({
    userPoint,
    destPoint,
    routeCoordinates,
    mapPaddingBottom,
    vehicleCategoryId,
    destLabel,
    showDriver,
    driverCoordinate,
    driverVehicle,
    driverEta,
    onBackPress,
  }: TrackingMapLayerProps) => {
    const staticMarkers = useMemo<MapMarkerData[]>(() => {
      const list: MapMarkerData[] = [
        { id: 'user', coordinate: userPoint, type: 'user' },
      ];
      if (destPoint) {
        list.push({
          id: 'dest',
          coordinate: destPoint,
          type: 'destination',
          vehicleCategory: vehicleCategoryId,
          label: destLabel,
        });
      }
      return list;
    }, [
      userPoint.latitude,
      userPoint.longitude,
      destPoint?.latitude,
      destPoint?.longitude,
      vehicleCategoryId,
      destLabel,
    ]);

    return (
      <MapContainer
        markers={staticMarkers}
        routeCoordinates={routeCoordinates}
        routeFollowsRoads
        focusCoordinate={userPoint}
        mapPaddingBottom={mapPaddingBottom}
        showBackButton
        onBackPress={onBackPress}
      >
        {showDriver && driverCoordinate ? (
          <LiveDriverMarker
            coordinate={driverCoordinate}
            vehicleCategory={driverVehicle ?? vehicleCategoryId}
            label={driverEta}
          />
        ) : null}
      </MapContainer>
    );
  },
  (prev, next) =>
    prev.userPoint.latitude === next.userPoint.latitude &&
    prev.userPoint.longitude === next.userPoint.longitude &&
    prev.destPoint?.latitude === next.destPoint?.latitude &&
    prev.destPoint?.longitude === next.destPoint?.longitude &&
    prev.routeCoordinates === next.routeCoordinates &&
    prev.mapPaddingBottom === next.mapPaddingBottom &&
    prev.vehicleCategoryId === next.vehicleCategoryId &&
    prev.destLabel === next.destLabel &&
    prev.showDriver === next.showDriver &&
    prev.driverCoordinate?.latitude === next.driverCoordinate?.latitude &&
    prev.driverCoordinate?.longitude === next.driverCoordinate?.longitude &&
    prev.driverVehicle === next.driverVehicle &&
    prev.driverEta === next.driverEta &&
    prev.onBackPress === next.onBackPress
);

TrackingMapLayer.displayName = 'TrackingMapLayer';

export default TrackingMapLayer;
