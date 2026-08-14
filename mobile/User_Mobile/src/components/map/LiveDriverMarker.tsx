import React, { useEffect, useState } from 'react';
import { Marker } from 'react-native-maps';
import { VehicleCategoryId } from '../../types';
import { MapMarkerPin } from './MapMarkerPin';

export interface LiveDriverMarkerProps {
  coordinate: { latitude: number; longitude: number };
  vehicleCategory?: VehicleCategoryId;
  label?: string;
}

/**
 * Isolated driver marker for live tracking — coordinate updates do not
 * re-rasterize the pin view (tracksViewChanges stays false after mount).
 */
export const LiveDriverMarker = React.memo(
  ({ coordinate, vehicleCategory, label }: LiveDriverMarkerProps) => {
    const [tracksViewChanges, setTracksViewChanges] = useState(true);

    useEffect(() => {
      setTracksViewChanges(true);
      const timer = setTimeout(() => setTracksViewChanges(false), 500);
      return () => clearTimeout(timer);
    }, [label, vehicleCategory]);

    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracksViewChanges}
        zIndex={4}
      >
        <MapMarkerPin
          marker={{
            id: 'driver',
            type: 'driver',
            coordinate,
            vehicleCategory,
            label,
          }}
        />
      </Marker>
    );
  },
  (prev, next) =>
    prev.coordinate.latitude === next.coordinate.latitude &&
    prev.coordinate.longitude === next.coordinate.longitude &&
    prev.label === next.label &&
    prev.vehicleCategory === next.vehicleCategory
);

LiveDriverMarker.displayName = 'LiveDriverMarker';

export default LiveDriverMarker;
