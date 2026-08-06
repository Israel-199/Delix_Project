import React, { useEffect, useState } from 'react';
import { Marker } from 'react-native-maps';
import { MapMarkerData } from '../../types';
import { MapMarkerPin } from './MapMarkerPin';

export interface MapMarkerViewProps {
  marker: MapMarkerData;
}

const getMarkerAnchor = (type?: MapMarkerData['type']) => {
  if (type === 'user') return { x: 0.5, y: 0.5 };
  if (type === 'destination') return { x: 0.5, y: 0.92 };
  return { x: 0.5, y: 0.5 };
};

/**
 * Custom map markers need tracksViewChanges enabled briefly so Android/iOS
 * actually rasterize the pin views (emoji + badges).
 */
export const MapMarkerView = ({ marker }: MapMarkerViewProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [
    marker.id,
    marker.type,
    marker.label,
    marker.vehicleCategory,
    marker.coordinate.latitude,
    marker.coordinate.longitude,
  ]);

  return (
    <Marker
      coordinate={marker.coordinate}
      anchor={getMarkerAnchor(marker.type)}
      tracksViewChanges={tracksViewChanges}
      zIndex={marker.type === 'user' ? 3 : marker.type === 'driver' ? 4 : 2}
    >
      <MapMarkerPin marker={marker} />
    </Marker>
  );
};

export default MapMarkerView;
