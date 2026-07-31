import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Switch,
  Animated,
  Linking,
  Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import io from 'socket.io-client';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('pk.eyJ1IjoiZGVsaXhlbmdpbmVlciIsImEiOiJjbXh6ZGZ1Z20yMzVvMmtvMWx6YjRxcjFxIn0.dummy');

const { width, height } = Dimensions.get('window');

// Standard Android generic local IP mapping to host port 5000 
const SOCKET_URL = 'http://10.0.2.2:5000'; 
const socket = io(SOCKET_URL);

const DriverHomeScreen = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [activeStep, setActiveStep] = useState<'idle' | 'incoming_request' | 'accepted' | 'in_transit' | 'completed'>('idle');
  const [completedTrips, setCompletedTrips] = useState(6);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  useEffect(() => {
    // Listen for incoming delivery alerts globally
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

  const handleCallUser = () => {
    Linking.openURL('tel:+251911223344');
  };

  const handleAcceptOrder = () => {
    setActiveStep('accepted');
    if (currentOrder?.id) {
      // Emit acceptance to the backend to notify the customer
      socket.emit('accept_delivery_order', {
        orderId: currentOrder.id,
        driverId: 'DVR-90812' // Hardcoded driver profile id for MVP
      });
      
      // Start streaming driver location
      socket.emit('driver_location_update', {
        driverId: 'DVR-90812',
        lat: 9.0205,
        lng: 38.7469,
        vehicleType: 'MINI_TRUCK'
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

      {/* Mapbox Native UI Rendering when Active */}
      {(activeStep === 'accepted' || activeStep === 'in_transit') && (
        <View style={styles.mapBackground}>
          <MapboxGL.MapView style={{flex: 1}} styleURL={MapboxGL.StyleURL.Street}>
            <MapboxGL.Camera
              zoomLevel={14}
              centerCoordinate={[38.7469, 9.0205]}
              animationMode={'flyTo'}
              animationDuration={2000}
            />
            {/* Dynamic Driver Pin Layer */}
            <MapboxGL.PointAnnotation id="driverPin" coordinate={[38.7469, 9.0205]}>
              <View style={styles.movingCar}><Text style={{fontSize:24}}>🚚</Text></View>
            </MapboxGL.PointAnnotation>
            
            {/* Customer Pickup / Dropoff Pin */}
            <MapboxGL.PointAnnotation id="customerLocation" coordinate={[38.7569, 9.0305]}>
              <View style={styles.mapPin}>
                <Text style={{fontSize: 24}}>{activeStep === 'in_transit' ? '🏁' : '📍'}</Text>
              </View>
            </MapboxGL.PointAnnotation>
          </MapboxGL.MapView>
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
            <TouchableOpacity style={styles.callRingButton} onPress={handleCallUser}>
              <Text style={{fontSize: 18}}>📞 Call Passenger</Text>
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

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', zIndex: 10, shadowColor:'#000', shadowOpacity:0.05, shadowOffset:{width:0, height:2} },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#FF5722' },
  driverName: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  onlineToggleBox: { flexDirection: 'row', alignItems: 'center' },
  onlineStatusText: { fontSize: 13, fontWeight: '800', marginRight: 8 },
  content: { padding: 20 },
  cycleCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  cycleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cycleTitle: { fontSize: 14, fontWeight: '700' },
  cycleCount: { fontSize: 14, fontWeight: '800', color: '#FF5722' },
  progressBarBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF5722' },
  cycleSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  searchingBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  searchingIcon: { fontSize: 48, marginBottom: 10 },
  searchingTitle: { fontSize: 18, fontWeight: '800' },
  searchingSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  
  // Incoming Call Overlay
  incomingModal: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1F2937', zIndex: 20, padding: 30, justifyContent: 'center' },
  pulseRing: { alignItems: 'center', marginBottom: 40 },
  ringingText: { color: '#FBBF24', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  priceTagHuge: { fontSize: 56, fontWeight: '900', color: '#FFF' },
  requestDetailsBox: { backgroundColor: '#374151', padding: 20, borderRadius: 16, marginBottom: 40 },
  cargoType: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  reqRouteBox: { backgroundColor: '#1F2937', padding: 15, borderRadius: 12, marginBottom: 15 },
  routeText: { color: '#F3F4F6', fontSize: 14, marginVertical: 4, fontWeight: '600' },
  paymentMethod: { color: '#34D399', fontSize: 14, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 15 },
  rejectButton: { flex: 1, backgroundColor: '#4B5563', padding: 18, borderRadius: 16, alignItems: 'center' },
  rejectButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  acceptButton: { flex: 2, backgroundColor: '#FF5722', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#FF5722', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width:0, height:4} },
  acceptButtonText: { color: 'white', fontWeight: '900', fontSize: 18 },

  // Map Views
  mapBackground: { flex: 1, backgroundColor: '#E5E5E0', position: 'relative' },
  mapGridLineOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1, backgroundColor: '#CBD5E1' },
  mapDriverPin: { position: 'absolute', left: width * 0.4, alignItems: 'center', zIndex: 5 },
  movingCar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2 },
  mapPin: { position: 'absolute' },
  routeLine: { position: 'absolute', top: height * 0.25, left: width * 0.45, width: width * 0.1, height: height * 0.25, borderRightWidth: 4, borderColor: '#10B981' },

  // Interactive Bottom Sheets
  bottomSheet: { backgroundColor: 'white', position: 'absolute', bottom: 0, width: '100%', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  activeTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937' },
  etaActive: { backgroundColor: '#10B981', color: '#FFF', fontWeight: '800', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  customerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, marginBottom: 20 },
  customerName: { fontSize: 18, fontWeight: '800' },
  callRingButton: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  workflowButton: { backgroundColor: '#FF5722', padding: 18, borderRadius: 16, alignItems: 'center' },
  workflowButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  destinationBox: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, marginBottom: 20 },
  destLocText: { fontSize: 18, fontWeight: '700' },

  // Completed
  completedCard: { ...StyleSheet.absoluteFillObject, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', zIndex: 30 },
  completedIcon: { fontSize: 80, marginBottom: 20 },
  completedTitle: { fontSize: 24, fontWeight: '900', color: '#10B981' },
  completedAmount: { fontSize: 32, fontWeight: '900', marginVertical: 20 },
  finishButton: { backgroundColor: '#1F2937', padding: 16, paddingHorizontal: 40, borderRadius: 16 },
  finishButtonText: { color: 'white', fontWeight: '800', fontSize: 16 },
});