import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { moderateScale } from '../utils/responsive';
import { vehicleIcon } from '../utils/mapUtils';

type PinType = 'user' | 'destination' | 'driver';

interface DriverMapMarkerProps {
  id: string;
  coordinate: { latitude: number; longitude: number };
  type: PinType;
  vehicleType?: string;
  label?: string;
}

const PinBody = ({ type, vehicleType, label }: Omit<DriverMapMarkerProps, 'id' | 'coordinate'>) => {
  if (type === 'user') {
    return (
      <View style={styles.userWrap} collapsable={false}>
        <View style={styles.userDot} />
        <Text style={styles.pinCaption}>Pickup</Text>
      </View>
    );
  }

  if (type === 'driver') {
    return (
      <View style={styles.wrap} collapsable={false}>
        {label ? (
          <View style={styles.badgeOrange}>
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        ) : null}
        <View style={styles.driverBubble}>
          <Text style={styles.icon}>{vehicleIcon(vehicleType)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap} collapsable={false}>
      {label ? (
        <View style={styles.badgeGreen}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
      <View style={styles.destBubble}>
        <Text style={styles.icon}>{vehicleIcon(vehicleType)}</Text>
      </View>
      <Text style={styles.destCaption}>Dropoff</Text>
    </View>
  );
};

export const DriverMapMarker = (props: DriverMapMarkerProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 600);
    return () => clearTimeout(timer);
  }, [props.type, props.label, props.vehicleType, props.coordinate.latitude, props.coordinate.longitude]);

  const anchor =
    props.type === 'destination'
      ? { x: 0.5, y: 0.92 }
      : { x: 0.5, y: 0.5 };

  return (
    <Marker
      coordinate={props.coordinate}
      anchor={anchor}
      tracksViewChanges={tracksViewChanges}
      zIndex={props.type === 'driver' ? 4 : props.type === 'user' ? 3 : 2}
    >
      <PinBody {...props} />
    </Marker>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  userWrap: { alignItems: 'center' },
  userDot: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: 9,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  pinCaption: {
    marginTop: 4,
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#3B82F6',
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  driverBubble: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destBubble: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: 26,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: moderateScale(26) },
  badgeOrange: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeGreen: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: { color: '#FFF', fontWeight: '800', fontSize: moderateScale(11) },
  destCaption: {
    marginTop: 4,
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#22C55E',
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
});

export default DriverMapMarker;
