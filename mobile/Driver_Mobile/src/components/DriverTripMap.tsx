import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import OSMMapWebView, { OSMMarker } from './map/OSMMapWebView';
import { LatLng } from '../utils/mapUtils';

export interface DriverTripMapProps {
  mapRef?: any;
  pickupCoord: LatLng;
  destCoord: LatLng;
  driverCoord: LatLng;
  routeCoords: LatLng[];
  orderVehicle: string;
  activeStep: 'accepted' | 'arrived_pickup' | 'in_transit';
}

/**
 * Isolated trip map — GPS updates only move the driver marker layer.
 */
export const DriverTripMap = React.memo(
  ({
    mapRef,
    pickupCoord,
    destCoord,
    driverCoord,
    routeCoords,
    orderVehicle,
    activeStep,
  }: DriverTripMapProps) => {
    const initialRegion = useMemo(
      () => ({
        latitude: pickupCoord.latitude,
        longitude: pickupCoord.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }),
      [pickupCoord.latitude, pickupCoord.longitude]
    );

    const destLabel = activeStep === 'in_transit' ? 'Dropoff' : undefined;

    const markers: OSMMarker[] = [
      { id: 'pickup', coordinate: pickupCoord, type: 'user' },
      { id: 'destination', coordinate: destCoord, type: 'destination', label: destLabel, vehicleCategory: orderVehicle },
      { id: 'driver', coordinate: driverCoord, type: 'driver', label: 'You', vehicleCategory: orderVehicle },
    ];

    return (
      <View style={styles.mapBackground}>
        <OSMMapWebView
          style={styles.map}
          initialRegion={initialRegion}
          routeCoordinates={routeCoords}
          markers={markers}
          paddingBottom={260}
        />
      </View>
    );
  },
  (prev, next) =>
    prev.pickupCoord.latitude === next.pickupCoord.latitude &&
    prev.pickupCoord.longitude === next.pickupCoord.longitude &&
    prev.destCoord.latitude === next.destCoord.latitude &&
    prev.destCoord.longitude === next.destCoord.longitude &&
    prev.driverCoord.latitude === next.driverCoord.latitude &&
    prev.driverCoord.longitude === next.driverCoord.longitude &&
    prev.routeCoords === next.routeCoords &&
    prev.orderVehicle === next.orderVehicle &&
    prev.activeStep === next.activeStep
);

DriverTripMap.displayName = 'DriverTripMap';

const styles = StyleSheet.create({
  mapBackground: { flex: 1, minHeight: 280 },
  map: { flex: 1 },
});

export default DriverTripMap;
