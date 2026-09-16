import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export interface OSMMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
  type?: 'user' | 'driver' | 'destination';
  label?: string;
  vehicleCategory?: string;
}

export interface OSMMapWebViewProps {
  initialRegion?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
  focusCoordinate?: { latitude: number; longitude: number } | null;
  markers?: OSMMarker[];
  routeCoordinates?: { latitude: number; longitude: number }[];
  style?: StyleProp<ViewStyle>;
  paddingBottom?: number;
  zoom?: number;
}

const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; overflow: hidden; background-color: #f7f7f7; }
        html, body, #map { height: 100%; width: 100%; }
        
        .custom-marker {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .marker-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 3px solid #FFF;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
        }

        .marker-user { background-color: #3b82f6; } /* Blue for User/Pickup */
        .marker-dest { background-color: #ef4444; } /* Red for Destination */
        .marker-driver { background-color: #10b981; } /* Green for Driver */

        .marker-label {
            position: absolute;
            top: -24px;
            background: #FFF;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-family: sans-serif;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            white-space: nowrap;
            color: #111;
        }

        /* Pulse animation for driver */
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .marker-pulse { animation: pulse 2s infinite; }

    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([9.0205, 38.7469], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        var markersMap = {};
        var currentPolyline = null;

        function updateMap(data) {
            if (data.mapPadding) {
                // Leaflet doesn't natively support padding like React Native Maps out of the box easily 
                // without modifying fitBounds, but we can at least pan it slightly if needed.
            }

            // Sync Polyline
            if (data.routeCoordinates && data.routeCoordinates.length > 0) {
                var latlngs = data.routeCoordinates.map(c => [c.latitude, c.longitude]);
                if (currentPolyline) {
                    currentPolyline.setLatLngs(latlngs);
                } else {
                    currentPolyline = L.polyline(latlngs, {color: '#22c55e', weight: 5, opacity: 0.9, lineCap: 'round'}).addTo(map);
                }
            } else if (currentPolyline) {
                map.removeLayer(currentPolyline);
                currentPolyline = null;
            }

            // Sync Markers
            var newIds = data.markers ? data.markers.map(m => m.id) : [];
            
            // Remove old markers
            for (var id in markersMap) {
                if (newIds.indexOf(id) === -1) {
                    map.removeLayer(markersMap[id]);
                    delete markersMap[id];
                }
            }

            // Add/Update markers
            if (data.markers) {
                data.markers.forEach(function(m) {
                    var latlng = [m.coordinate.latitude, m.coordinate.longitude];
                    if (markersMap[m.id]) {
                        markersMap[m.id].setLatLng(latlng);
                    } else {
                        var cssClass = 'marker-user';
                        var extraClass = '';
                        if (m.type === 'destination') cssClass = 'marker-dest';
                        if (m.type === 'driver') { cssClass = 'marker-driver'; extraClass = 'marker-pulse'; }
                        
                        var labelHtml = m.label ? '<div class="marker-label">' + m.label + '</div>' : '';
                        
                        var icon = L.divIcon({
                            className: 'custom-marker',
                            html: labelHtml + '<div class="marker-dot ' + cssClass + ' ' + extraClass + '"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });

                        markersMap[m.id] = L.marker(latlng, {icon: icon}).addTo(map);
                    }
                });
            }

            // Handle Camera
            if (data.focusCoordinate) {
                map.setView([data.focusCoordinate.latitude, data.focusCoordinate.longitude], data.zoom || 15, { animate: true });
            } else if (data.routeCoordinates && data.routeCoordinates.length > 1) {
                map.fitBounds(currentPolyline.getBounds(), { padding: [20, 20 + (data.mapPadding.bottom || 0)] });
            }
        }

        document.addEventListener("message", function(event) {
            try {
                var data = JSON.parse(event.data);
                updateMap(data);
            } catch(e) {}
        });
        
        window.addEventListener("message", function(event) {
            try {
                var data = JSON.parse(event.data);
                updateMap(data);
            } catch(e) {}
        });

        // Notify React Native that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    </script>
</body>
</html>
`;

export const OSMMapWebView = React.memo(({
  initialRegion,
  focusCoordinate,
  markers = [],
  routeCoordinates = [],
  style,
  paddingBottom = 0,
  zoom = 15
}: OSMMapWebViewProps) => {
  const webViewRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const payload = {
    focusCoordinate: focusCoordinate || (initialRegion ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude } : null),
    markers,
    routeCoordinates,
    zoom,
    mapPadding: { bottom: paddingBottom }
  };

  useEffect(() => {
    if (isReady && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(payload));
    }
  }, [isReady, focusCoordinate, markers, routeCoordinates, paddingBottom, zoom]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef as any}
        source={{ html: htmlTemplate }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        onMessage={(event: any) => {
          try {
             const data = JSON.parse(event.nativeEvent.data);
             if (data.type === 'ready') setIsReady(true);
          } catch(e) {}
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});

export default OSMMapWebView;
