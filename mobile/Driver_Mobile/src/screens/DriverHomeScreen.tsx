import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Switch,
  Linking
} from 'react-native';
import io from 'socket.io-client';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { widthScale, heightScale, moderateScale, SIZES } from '../utils/responsive';
import DriverMapMarker from '../components/DriverMapMarker';
import {
  fetchRoute,
  orderDestination,
  orderPickup,
  vehicleIcon,
  LatLng,
} from '../utils/mapUtils';

import { SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL);
const DRIVER_ID = 'DVR-90812';
const DRIVER_VEHICLE = 'MINI_TRUCK';

const DriverHomeScreen = () => {
  const mapRef = useRef<MapView>(null);
  const didFitMap = useRef(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeStep, setActiveStep] = useState<'idle' | 'incoming_request' | 'accepted' | 'in_transit' | 'completed'>('idle');
  const [completedTrips, setCompletedTrips] = useState(6);
  const [currentOrder, setCurrentOrder] = useState<Record<string, unknown> | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [driverCoord, setDriverCoord] = useState<LatLng>({ latitude: 9.0205, longitude: 38.7469 });

  const pickupCoord = useMemo(() => orderPickup(currentOrder), [currentOrder]);
  const destCoord = useMemo(() => orderDestination(currentOrder), [currentOrder]);
  const orderVehicle = (currentOrder?.vehicleRequested as string) ?? DRIVER_VEHICLE;

  useEffect(() => {
    socket.on('incoming_delivery_alert', (orderData) => {
      if (isOnline && activeStep === 'idle') {
        setCurrentOrder(orderData);
        setActiveStep('incoming_request');
      }
    });

    return () => {
      socket.off('incoming_delivery_alert');
    };
  }, [isOnline, activeStep]);

  useEffect(() => {
    if (activeStep !== 'accepted' && activeStep !== 'in_transit') return;

    let stopWatch: (() => void) | undefined;
    let cancelled = false;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2500,
          distanceInterval: 5,
        },
        (position) => {
          const next = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setDriverCoord(next);
          socket.emit('driver_location_update', {
            driverId: DRIVER_ID,
            lat: next.latitude,
            lng: next.longitude,
            vehicleType: orderVehicle,
          });
        }
      );

      stopWatch = () => subscription.remove();
    };

    startTracking();

    return () => {
      cancelled = true;
      stopWatch?.();
    };
  }, [activeStep, orderVehicle]);

  useEffect(() => {
    if (activeStep !== 'accepted' && activeStep !== 'in_transit') return;

    let cancelled = false;

    const loadRoute = async () => {
      const from = activeStep === 'in_transit' ? pickupCoord : driverCoord;
      const to = activeStep === 'in_transit' ? destCoord : pickupCoord;
      const coords = await fetchRoute(from, to);
      if (!cancelled) {
        setRouteCoords(coords);
        if (!didFitMap.current) {
          didFitMap.current = true;
          mapRef.current?.fitToCoordinates(
            [pickupCoord, destCoord, driverCoord],
            {
              edgePadding: { top: 80, right: 48, bottom: 280, left: 48 },
              animated: true,
            }
          );
        }
      }
    };

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [activeStep, pickupCoord.latitude, pickupCoord.longitude, destCoord.latitude, destCoord.longitude]);

  useEffect(() => {
    didFitMap.current = false;
  }, [activeStep]);

  const handleCallUser = () => {
    Linking.openURL('tel:+251911223344');
  };

  const handleAcceptOrder = () => {
    setActiveStep('accepted');
    const orderId = (currentOrder?.orderId ?? currentOrder?.id) as string | undefined;
    if (orderId) {
      socket.emit('accept_delivery_order', {
        orderId,
        driverId: DRIVER_ID,
      });

      socket.emit('driver_location_update', {
        driverId: DRIVER_ID,
        lat: driverCoord.latitude,
        lng: driverCoord.longitude,
        vehicleType: orderVehicle,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Driver Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>DELIX DRIVER</Text>
          <Text style={styles.driverName}>Yared Moges • Mini Truck</Text>
        </View>
        <View style={styles.onlineToggleBox}>
          <Text style={[styles.onlineStatusText, { color: isOnline ? '#10B981' : '#6B7280' }]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ false: '#D1D5DB', true: '#FF5722' }} />
        </View>
      </View>

      {/* Expo Maps Native UI Rendering when Active */}
      {(activeStep === 'accepted' || activeStep === 'in_transit') && (
        <View style={styles.mapBackground}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: pickupCoord.latitude,
              longitude: pickupCoord.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            mapPadding={{ top: 60, right: 16, bottom: 260, left: 16 }}
          >
            {routeCoords.length > 1 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#22C55E"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}

            <DriverMapMarker
              id="pickup"
              coordinate={pickupCoord}
              type="user"
            />

            <DriverMapMarker
              id="destination"
              coordinate={destCoord}
              type="destination"
              vehicleType={orderVehicle}
              label={activeStep === 'in_transit' ? 'Dropoff' : undefined}
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
      )}

      {/* IDLE VIEW */}
      {activeStep === 'idle' && (
        <ScrollView style={styles.content}>
          <View style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <Text style={styles.cycleTitle}>10-Trip Commission Cycle</Text>
              <Text style={styles.cycleCount}>{completedTrips} / 10</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(completedTrips / 10) * 100}%` }]} />
            </View>
            <Text style={styles.cycleSubtitle}>Finish {10 - completedTrips} more trips before Telebirr commission recharge requires.</Text>
          </View>

          <View style={styles.searchingBox}>
            <Text style={styles.searchingIcon}>📡</Text>
            <Text style={styles.searchingTitle}>Searching for requests...</Text>
            <Text style={styles.searchingSubtitle}>Stay online for dispatch alerts.</Text>
          </View>
        </ScrollView>
      )}

      {/* INCOMING REQUEST FLASHING RING - Phone Call Style */}
      {activeStep === 'incoming_request' && (
        <View style={styles.incomingModal}>
          <View style={styles.pulseRing}>
            <Text style={styles.ringingText}>NEW REQUEST</Text>
            <Text style={styles.priceTagHuge}>{currentOrder?.estimatedPrice || 450} {currentOrder?.currency || 'ETB'}</Text>
          </View>

          <View style={styles.requestDetailsBox}>
            <Text style={styles.cargoType}>Cargo: {currentOrder?.cargoCategory || 'Construction Materials'}</Text>
            <View style={styles.reqRouteBox}>
              <Text style={styles.routeText}>📍 Pickup: {currentOrder?.pickupAddress || 'Gerji Mebrat Hail'} ({currentOrder?.distanceKm || 2} km away)</Text>
              <Text style={styles.routeText}>🏁 Dropoff: {currentOrder?.destinationAddress || 'CMC Square'}</Text>
            </View>
            <Text style={styles.paymentMethod}>Payment: {currentOrder?.paymentMethod || 'Cash'}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rejectButton} onPress={() => setActiveStep('idle')}>
              <Text style={styles.rejectButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptOrder}>
              <Text style={styles.acceptButtonText}>ACCEPT NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* BOTTOM SHEET: ACCEPTED - Navigating to user */}
      {activeStep === 'accepted' && (
        <View style={styles.bottomSheet}>
          <View style={styles.statusHeader}>
            <Text style={styles.activeTitle}>Pick Up Passenger</Text>
            <Text style={styles.etaActive}>2 miles away</Text>
          </View>

          <View style={styles.customerBox}>
            <Text style={styles.customerName}>Abebe Bikila</Text>
            <Text style={styles.routePreview}>
              {vehicleIcon(orderVehicle)} {String(currentOrder?.destinationAddress ?? 'Destination')}
            </Text>
            <TouchableOpacity style={styles.callRingButton} onPress={handleCallUser}>
              <Text style={{fontSize: moderateScale(18)}}>📞 Call Passenger</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.workflowButton} onPress={() => setActiveStep('in_transit')}>
            <Text style={styles.workflowButtonText}>ARRIVED AT PICKUP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTTOM SHEET: IN TRANSIT - Navigating to Destination */}
      {activeStep === 'in_transit' && (
        <View style={styles.bottomSheet}>
          <View style={styles.statusHeader}>
            <Text style={styles.activeTitle}>Navigating to Dropoff</Text>
            <Text style={styles.etaActive}>15 mins ETA</Text>
          </View>

          <View style={styles.destinationBox}>
            <Text style={styles.destLocText}>{currentOrder?.destinationAddress || 'CMC Square, Block 4'}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.workflowButton, { backgroundColor: '#10B981' }]} 
            onPress={() => {
              setCompletedTrips(prev => Math.min(prev + 1, 10));
              setActiveStep('completed');
            }}
          >
            <Text style={styles.workflowButtonText}>COMPLETE TRIP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* COMPLETED SUCCESS SCREEN */}
      {activeStep === 'completed' && (
        <View style={styles.completedCard}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={styles.completedTitle}>Delivery Completed!</Text>
          <Text style={styles.completedAmount}>You earned {currentOrder?.estimatedPrice || 450} {currentOrder?.currency || 'ETB'}</Text>
          <TouchableOpacity style={styles.finishButton} onPress={() => setActiveStep('idle')}>
            <Text style={styles.finishButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: moderateScale(20), backgroundColor: '#FFF', zIndex: 10, shadowColor:'#000', shadowOpacity:0.05, shadowOffset:{width:0, height:2} },
  brandTitle: { fontSize: moderateScale(20), fontWeight: '900', color: '#FF5722' },
  driverName: { fontSize: moderateScale(13), fontWeight: '600', color: '#4B5563' },
  onlineToggleBox: { flexDirection: 'row', alignItems: 'center' },
  onlineStatusText: { fontSize: moderateScale(13), fontWeight: '800', marginRight: widthScale(8) },
  content: { padding: moderateScale(20) },
  cycleCard: { backgroundColor: '#FFF', borderRadius: moderateScale(16), padding: moderateScale(16), borderWidth: 1, borderColor: '#E5E7EB', marginBottom: heightScale(20) },
  cycleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: heightScale(10) },
  cycleTitle: { fontSize: moderateScale(14), fontWeight: '700' },
  cycleCount: { fontSize: moderateScale(14), fontWeight: '800', color: '#FF5722' },
  progressBarBg: { height: heightScale(8), backgroundColor: '#F3F4F6', borderRadius: moderateScale(4), overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF5722' },
  cycleSubtitle: { fontSize: moderateScale(12), color: '#6B7280', marginTop: heightScale(8) },
  searchingBox: { backgroundColor: '#FFF', borderRadius: moderateScale(20), padding: moderateScale(30), alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  searchingIcon: { fontSize: moderateScale(48), marginBottom: heightScale(10) },
  searchingTitle: { fontSize: moderateScale(18), fontWeight: '800' },
  searchingSubtitle: { fontSize: moderateScale(13), color: '#6B7280', marginTop: heightScale(6) },
  
  // Incoming Call Overlay
  incomingModal: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1F2937', zIndex: 20, padding: moderateScale(30), justifyContent: 'center' },
  pulseRing: { alignItems: 'center', marginBottom: heightScale(40) },
  ringingText: { color: '#FBBF24', fontSize: moderateScale(16), fontWeight: '900', letterSpacing: 2, marginBottom: heightScale(10) },
  priceTagHuge: { fontSize: moderateScale(56), fontWeight: '900', color: '#FFF' },
  requestDetailsBox: { backgroundColor: '#374151', padding: moderateScale(20), borderRadius: moderateScale(16), marginBottom: heightScale(40) },
  cargoType: { color: '#FFF', fontSize: moderateScale(16), fontWeight: '700', marginBottom: heightScale(15) },
  reqRouteBox: { backgroundColor: '#1F2937', padding: moderateScale(15), borderRadius: moderateScale(12), marginBottom: heightScale(15) },
  routeText: { color: '#F3F4F6', fontSize: moderateScale(14), marginVertical: heightScale(4), fontWeight: '600' },
  paymentMethod: { color: '#34D399', fontSize: moderateScale(14), fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: moderateScale(15) },
  rejectButton: { flex: 1, backgroundColor: '#4B5563', padding: moderateScale(18), borderRadius: moderateScale(16), alignItems: 'center' },
  rejectButtonText: { color: 'white', fontWeight: '700', fontSize: moderateScale(16) },
  acceptButton: { flex: 2, backgroundColor: '#FF5722', padding: moderateScale(18), borderRadius: moderateScale(16), alignItems: 'center', shadowColor: '#FF5722', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width:0, height:4} },
  acceptButtonText: { color: 'white', fontWeight: '900', fontSize: moderateScale(18) },

  // Map Views
  mapBackground: { flex: 1, backgroundColor: '#E5E5E0', position: 'relative' },

  // Interactive Bottom Sheets
  bottomSheet: { backgroundColor: 'white', position: 'absolute', bottom: 0, width: '100%', padding: moderateScale(24), borderTopLeftRadius: moderateScale(24), borderTopRightRadius: moderateScale(24), shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: heightScale(20) },
  activeTitle: { fontSize: moderateScale(22), fontWeight: '900', color: '#1F2937' },
  etaActive: { backgroundColor: '#10B981', color: '#FFF', fontWeight: '800', paddingHorizontal: widthScale(12), paddingVertical: heightScale(6), borderRadius: moderateScale(12) },
  customerBox: {
    backgroundColor: '#F9FAFB',
    padding: moderateScale(15),
    borderRadius: moderateScale(16),
    marginBottom: heightScale(20),
  },
  customerName: { fontSize: moderateScale(18), fontWeight: '800' },
  routePreview: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    marginTop: heightScale(4),
    marginBottom: heightScale(8),
    fontWeight: '600',
  },
  callRingButton: { backgroundColor: '#2563EB', paddingHorizontal: widthScale(16), paddingVertical: heightScale(10), borderRadius: moderateScale(12), alignSelf: 'flex-start' },
  workflowButton: { backgroundColor: '#FF5722', padding: moderateScale(18), borderRadius: moderateScale(16), alignItems: 'center' },
  workflowButtonText: { color: '#FFF', fontWeight: '900', fontSize: moderateScale(16) },
  destinationBox: { backgroundColor: '#F9FAFB', padding: moderateScale(15), borderRadius: moderateScale(16), marginBottom: heightScale(20) },
  destLocText: { fontSize: moderateScale(18), fontWeight: '700' },

  // Completed
  completedCard: { ...StyleSheet.absoluteFillObject, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', zIndex: 30 },
  completedIcon: { fontSize: moderateScale(80), marginBottom: heightScale(20) },
  completedTitle: { fontSize: moderateScale(24), fontWeight: '900', color: '#10B981' },
  completedAmount: { fontSize: moderateScale(32), fontWeight: '900', marginVertical: heightScale(20) },
  finishButton: { backgroundColor: '#1F2937', padding: moderateScale(16), paddingHorizontal: widthScale(40), borderRadius: moderateScale(16) },
  finishButtonText: { color: 'white', fontWeight: '800', fontSize: moderateScale(16) },
});

export default DriverHomeScreen;
