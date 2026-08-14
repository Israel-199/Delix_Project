import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import getSocket, {
  registerDriverSocket,
  emitDriverOffline,
  joinOrderRoom,
} from '../services/socketService';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { AppDrawer } from '../components';
import { DelixButton } from '../components/buttons/DelixButton';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies, typography } from '../theme/typography';
import { moderateScale } from '../utils/responsive';
import DriverMapMarker from '../components/DriverMapMarker';

import {
  completeDriverTrip,
  fetchDriverActiveOrder,
  fetchDriverCycle,
} from '../services/driverService';
import { useDriverAuthStore } from '../store/authStore';
import { DriverStackParamList } from '../navigation/types';

const socket = getSocket();

type TripStep = 'idle' | 'incoming_request' | 'accepted' | 'arrived_pickup' | 'in_transit' | 'completed';

const orderStatusToStep = (status: string): TripStep | null => {
  if (status === 'DRIVER_ACCEPTED') return 'accepted';
  if (status === 'ARRIVED_PICKUP') return 'arrived_pickup';
  if (status === 'IN_TRANSIT') return 'in_transit';
  if (status === 'COMPLETED') return 'completed';
  return null;
};

const openNavigation = (lat: number, lng: number, label: string) => {
  const encoded = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps:0,0?q=${lat},${lng}(${encoded})`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encoded})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  });
  if (url) Linking.openURL(url);
};

const DriverHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const { driverId, plateNumber, vehicleType, name, phone } = useDriverAuthStore();

  const DRIVER_ID = driverId || phone || 'driver-guest';
  const DRIVER_VEHICLE = vehicleType || 'MINI_TRUCK';

  const mapRef = useRef<MapView>(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [activeStep, setActiveStep] = useState<TripStep>('idle');
  
  const [commissionBalance, setCommissionBalance] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Due' | 'Processing'>('Paid');
  const [tripsCompleted, setTripsCompleted] = useState(0);

  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [driverCoord, setDriverCoord] = useState<{ latitude: number; longitude: number }>({ latitude: 9.0205, longitude: 38.7469 });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setDriverCoord(coord);

      mapRef.current?.animateToRegion({
        ...coord,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    })();
  }, []);

  const loadBackendState = async () => {
    try {
      const activeData = await fetchDriverActiveOrder(DRIVER_ID);
      if (activeData?.order) {
        setCurrentOrder(activeData.order);
        const step = orderStatusToStep((activeData.order as any).status);
        if (step) setActiveStep(step);
      }

      const cycle = await fetchDriverCycle(DRIVER_ID);
      if (cycle) {
        setCommissionBalance(cycle.commissionBalance || 0);
        setPaymentStatus(cycle.paymentStatus || 'Paid');
        setTripsCompleted(cycle.completedTrips);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadBackendState();
    registerDriverSocket(DRIVER_ID);
    
    socket.on('dispatch_incoming_order', (data: any) => {
      if (activeStep !== 'idle' || !isOnline || paymentStatus === 'Due') return;
      setCurrentOrder(data);
      setActiveStep('incoming_request');
    });

    socket.on('dispatch_error', (data: any) => {
      Alert.alert('Dispatch Error', data.message);
      if (activeStep === 'incoming_request') {
        setActiveStep('idle');
        setCurrentOrder(null);
      }
    });

    socket.on('order_status_changed', (data: any) => {
      if (data.orderId === currentOrder?.orderId || data.orderId === currentOrder?.id) {
        if (data.status === 'DELIVERY_COMPLETED' || data.status === 'COMPLETED') {
           handleTripFinalizeLocally();
        } else {
           const step = orderStatusToStep(data.status);
           if (step) setActiveStep(step);
        }
      }
    });

    return () => {
      socket.off('dispatch_incoming_order');
      socket.off('dispatch_error');
      socket.off('order_status_changed');
    };
  }, [DRIVER_ID, isOnline, activeStep, currentOrder, paymentStatus]);

  useEffect(() => {
    const locSub = setInterval(async () => {
      if (isOnline && paymentStatus !== 'Due') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setDriverCoord(coord);

          socket.emit('driver_location_update', {
            driverId: DRIVER_ID,
            lat: coord.latitude,
            lng: coord.longitude,
            vehicleType: DRIVER_VEHICLE,
            plateNumber: plateNumber,
            online: true,
            orderId: currentOrder?.orderId || currentOrder?.id,
          });
        } catch (e) {
          // Ignore location errors
        }
      }
    }, 10000);
    return () => clearInterval(locSub);
  }, [isOnline, DRIVER_ID, currentOrder, paymentStatus, plateNumber, DRIVER_VEHICLE]);

  const handleToggleOnline = (val: boolean) => {
    if (val && paymentStatus === 'Due') {
      Alert.alert('Recharge Required', 'You have reached 15 trips. Please pay the 500 ETB commission to Delix via Telebirr or Chapa before going online.');
      return;
    }
    setIsOnline(val);
    if (val) {
      registerDriverSocket(DRIVER_ID);
    } else {
      emitDriverOffline(DRIVER_ID);
    }
  };

  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const [etaText, setEtaText] = useState('');

  // Fetch route when order is present
  useEffect(() => {
    if ((activeStep === 'incoming_request' || activeStep === 'in_transit') && currentOrder) {
      const getRoute = async () => {
        try {
          const originLat = activeStep === 'in_transit' ? driverCoord.latitude : currentOrder.pickupLat;
          const originLng = activeStep === 'in_transit' ? driverCoord.longitude : currentOrder.pickupLng;
          const destLat = activeStep === 'in_transit' ? currentOrder.destinationLat : currentOrder.pickupLat;
          const destLng = activeStep === 'in_transit' ? currentOrder.destinationLng : currentOrder.pickupLng;

          // Replace with real routing API call if available, creating straight line fallback
          setRouteCoords([
             { latitude: originLat, longitude: originLng },
             { latitude: destLat, longitude: destLng }
          ]);
          setEtaText('~' + Math.ceil((currentOrder.distanceKm || 1) * 3) + ' mins');
        } catch(e) {}
      };
      getRoute();
    } else {
      setRouteCoords([]);
    }
  }, [activeStep, currentOrder, driverCoord.latitude, driverCoord.longitude]);

  const handleAccept = () => {
    const oId = currentOrder?.orderId || currentOrder?.id;
    if (!oId) return;
    joinOrderRoom(oId);
    socket.emit('accept_delivery_order', {
      orderId: oId,
      driverId: DRIVER_ID,
      driverName: name,
      plateNumber,
      vehicleType: DRIVER_VEHICLE,
    });
    setActiveStep('accepted');
  };

  const handleReject = () => {
    const oId = currentOrder?.orderId || currentOrder?.id;
    if (oId) {
      socket.emit('reject_delivery_order', { orderId: oId, driverId: DRIVER_ID });
    }
    setActiveStep('idle');
    setCurrentOrder(null);
  };

  const handleArrived = () => {
    const oId = currentOrder?.orderId || currentOrder?.id;
    if (oId) socket.emit('driver_arrived_pickup', { orderId: oId, driverId: DRIVER_ID });
    setActiveStep('arrived_pickup');
  };

  const handleStartTrip = () => {
    const oId = currentOrder?.orderId || currentOrder?.id;
    if (oId) {
      socket.emit('start_delivery_trip', { 
        orderId: oId, 
        driverId: DRIVER_ID,
        lat: driverCoord.latitude,
        lng: driverCoord.longitude
      });
    }
    setActiveStep('in_transit');
  };

  const handleCompleteDelivery = async () => {
    const oId = currentOrder?.orderId || currentOrder?.id;
    try {
      socket.emit('order_completed', { 
        orderId: oId, 
        driverId: DRIVER_ID,
        earnings: currentOrder?.estimatedPrice || 0
      });
      await completeDriverTrip(DRIVER_ID, oId);
    } catch {}
    handleTripFinalizeLocally();
  };

  const handleTripFinalizeLocally = async () => {
    setActiveStep('idle');
    setCurrentOrder(null);
    setRouteCoords([]);
    await loadBackendState();
  };

  const renderOrderSheet = () => {
    if (activeStep === 'idle') {
      const isDue = paymentStatus === 'Due';
      return (
        <View style={styles.sheetCard}>
          {isDue ? (
            <View>
              <View style={styles.statusRow}>
                <Ionicons name="warning" size={24} color={colors.error} />
                <Text style={styles.sheetTitleError}>Recharge Required</Text>
              </View>
              <Text style={styles.sheetTextError}>
                You have reached 15 trips. You owe the 500 ETB commission to Delix. You cannot receive new orders until paid.
              </Text>
              <DelixButton title="Pay via Telebirr (Coming Soon)" onPress={() => Alert.alert('Payment Portal', 'Integration in progress')} variant="primary" style={{marginTop: spacing.md}} />
            </View>
          ) : (
            <View>
              <View style={styles.statusRow}>
                <Ionicons name={isOnline ? "checkmark-circle" : "moon"} size={24} color={isOnline ? colors.success : colors.textSecondary} />
                <Text style={styles.sheetTitle}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
              </View>
              <Text style={styles.sheetSub}>
                {isOnline ? 'Searching for nearby trips...' : 'Go online to receive trip requests.'}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{tripsCompleted}/15</Text>
                  <Text style={styles.statLabel}>Trips done</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{commissionBalance} ETB</Text>
                  <Text style={styles.statLabel}>Owed</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      );
    }

    if (activeStep === 'incoming_request') {
      return (
        <View style={styles.sheetCard}>
          <Text style={styles.sheetTitle}>New Trip Request 🔔</Text>
          
          <View style={styles.detailsBox}>
            <View style={styles.locationRow}>
               <View style={styles.dotPickup} />
               <Text style={styles.locationText} numberOfLines={2}>{currentOrder?.pickupAddress}</Text>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
               <View style={styles.dotDest} />
               <Text style={styles.locationText} numberOfLines={2}>{currentOrder?.destinationAddress}</Text>
            </View>
          </View>
          
          <View style={styles.faresRow}>
            <View style={styles.fareItem}>
              <Text style={styles.fareVal}>{currentOrder?.distanceKm} km</Text>
              <Text style={styles.fareLabel}>Distance</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareVal}>{currentOrder?.estimatedPrice} ETB</Text>
              <Text style={styles.fareLabel}>Est. Fare</Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareVal}>{currentOrder?.cargoCategory}</Text>
              <Text style={styles.fareLabel}>Cargo Type</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <DelixButton title="Reject" variant="secondary" onPress={handleReject} />
            </View>
            <View style={{ flex: 1 }}>
              <DelixButton title="Accept" variant="primary" onPress={handleAccept} />
            </View>
          </View>
        </View>
      );
    }

    if (activeStep === 'accepted') {
       return (
         <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Picked Up & Heading There</Text>
            <View style={styles.customerBand}>
              <Ionicons name="person-circle" size={40} color={colors.primary} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{currentOrder?.customerName || 'Customer'}</Text>
                <Text style={styles.customerPhone}>{currentOrder?.customerPhone}</Text>
              </View>
              <TouchableOpacity style={styles.callCircle} onPress={() => Linking.openURL(`tel:${currentOrder?.customerPhone}`)}>
                <Ionicons name="call" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.btnRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <DelixButton title="Navigate" variant="secondary" onPress={() => openNavigation(currentOrder?.pickupLat, currentOrder?.pickupLng, 'Pickup')} />
              </View>
              <View style={{ flex: 1 }}>
                <DelixButton title="Arrived" variant="primary" onPress={handleArrived} />
              </View>
            </View>
         </View>
       );
    }
    
    if (activeStep === 'arrived_pickup') {
      return (
        <View style={styles.sheetCard}>
          <Text style={styles.sheetTitle}>Arrived at Pickup</Text>
          <Text style={styles.sheetSub}>Wait for the cargo to be fully loaded into your vehicle, then start the trip.</Text>
          <DelixButton title="Start Trip" onPress={handleStartTrip} style={{ marginTop: spacing.md }} />
        </View>
      );
    }

    if (activeStep === 'in_transit') {
      const destDistance = currentOrder?.distanceKm || 0;
      return (
        <View style={styles.sheetCard}>
          <Text style={styles.sheetTitle}>In Transit 🚚</Text>
          <Text style={styles.sheetSub}>Deliver cargo to: {currentOrder?.destinationAddress}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{etaText}</Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{destDistance} km</Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <DelixButton title="Maps" variant="secondary" onPress={() => openNavigation(currentOrder?.destinationLat, currentOrder?.destinationLng, 'Destination')} />
            </View>
            <View style={{ flex: 1 }}>
              <DelixButton title="Complete Delivery" onPress={handleCompleteDelivery} />
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        mapPadding={{ top: 0, right: 0, left: 0, bottom: 350 }}
        initialRegion={{
          latitude: 9.0205,
          longitude: 38.7469,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {driverCoord && <DriverMapMarker id="driver" type="driver" coordinate={driverCoord} vehicleType={DRIVER_VEHICLE} />}
        {currentOrder?.pickupLat && activeStep !== 'in_transit' && (
           <DriverMapMarker id="pickup" type="user" coordinate={{ latitude: currentOrder.pickupLat, longitude: currentOrder.pickupLng }} />
        )}
        {currentOrder?.destinationLat && activeStep === 'in_transit' && (
           <DriverMapMarker id="dest" type="destination" coordinate={{ latitude: currentOrder.destinationLat, longitude: currentOrder.destinationLng }} />
        )}
        
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={colors.primary} />
        )}
      </MapView>

      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        
        {activeStep === 'idle' && (
          <View style={styles.onlineToggle}>
            <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: colors.border, true: colors.successTint }}
              thumbColor={isOnline ? colors.success : '#f4f3f4'}
            />
          </View>
        )}
      </View>

      <View style={styles.bottomOverlay}>
        {renderOrderSheet()}
      </View>
    </View>
  );
};

export default DriverHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mapBackground,
  },
  topHeader: {
    position: 'absolute',
    top: spacing['3xl'],
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  menuBtn: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: colors.background,
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineText: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  sheetCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
  },
  sheetTitleError: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.error,
    marginLeft: spacing.xs,
  },
  sheetTextError: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.error,
    marginTop: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetSub: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(18),
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
  detailsBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLine: {
    width: 2,
    height: spacing.lg,
    backgroundColor: colors.border,
    marginLeft: moderateScale(5),
    marginVertical: 2,
  },
  dotPickup: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: colors.info,
    marginRight: spacing.sm,
  },
  dotDest: {
    width: moderateScale(12),
    height: moderateScale(12),
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  locationText: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textPrimary,
  },
  faresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
  },
  fareItem: {
    alignItems: 'center',
  },
  fareVal: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  fareLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  customerBand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  customerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  customerName: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  customerPhone: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
  callCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
