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
 * Custom markers rasterize once; coordinate-only updates skip tracksViewChanges.
 */
export const MapMarkerView = React.memo(({ marker }: MapMarkerViewProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const isLiveDriver = marker.type === 'driver';

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [marker.id]);

  useEffect(() => {
    if (isLiveDriver) return;
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [isLiveDriver, marker.label, marker.vehicleCategory]);

  useEffect(() => {
    if (!isLiveDriver) return;
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(timer);
  }, [isLiveDriver, marker.label, marker.vehicleCategory]);

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
});

MapMarkerView.displayName = 'MapMarkerView';

export default MapMarkerView;
