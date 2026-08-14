import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import DriverMapMarker from './DriverMapMarker';
import { LatLng } from '../utils/mapUtils';

export interface DriverTripMapProps {
  mapRef: React.RefObject<MapView | null>;
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

    return (
      <View style={styles.mapBackground}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          mapPadding={{ top: 60, right: 16, bottom: 260, left: 16 }}
        >
          {routeCoords.length > 1 ? (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#22C55E"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          ) : null}

          <DriverMapMarker id="pickup" coordinate={pickupCoord} type="user" />

          <DriverMapMarker
            id="destination"
            coordinate={destCoord}
            type="destination"
            vehicleType={orderVehicle}
            label={destLabel}
          />

          <DriverMapMarker
            id="driver"
            coordinate={driverCoord}
            type="driver"
            vehicleType={orderVehicle}
            label="You"
          />
        </MapView>
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
