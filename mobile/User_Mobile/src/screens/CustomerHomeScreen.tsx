import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  SafeAreaView, 
  StatusBar,
  Linking
} from 'react-native';
import io from 'socket.io-client';
import MapView, { Marker } from 'react-native-maps';
import { widthScale, heightScale, moderateScale, SIZES } from '../utils/responsive';

// Standard Android generic local IP mapping to host port 5000 
const SOCKET_URL = 'http://10.0.2.2:5000'; 
const socket = io(SOCKET_URL);

const vehicles = [
  { id: 'pickup', name: 'Pickup', time: '3 min', icon: '🛻' },
  { id: 'mini_truck', name: 'Mini truck', time: '4 min', icon: '🚚' },
  { id: 'large_truck', name: 'Large truck', time: '8 min', icon: '🚛' },
];

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'telebirr', label: 'Telebirr', icon: '📱' },
  { id: 'cbe', label: 'CBE', icon: '🏦' },
];

const CustomerHomeScreen = () => {
  const [appState, setAppState] = useState<'idle' | 'selecting_route' | 'map_view' | 'searching' | 'driver_found'>('idle');
  
  const [selectedVehicle, setSelectedVehicle] = useState('pickup');
  const [pickupLocation, setPickupLocation] = useState('BL-03-505 Street, Bole');
  const [destination, setDestination] = useState('');
  const [payment, setPayment] = useState('cash');

  // Pricing calculations
  const distanceKm = 5.2; 
  const isDjibouti = pickupLocation.toLowerCase().includes('djibouti');
  const baseRate = 150; // ETB per km
  let estimatedPrice = Math.round(distanceKm * baseRate);
  let currency = 'Br';
  
  if (isDjibouti) {
    estimatedPrice = Math.round(estimatedPrice * 3.15); // conversion to DJF
    currency = 'DJF';
  }

  // Handle Request Animation flow
  const handleDestinationSelect = (dest: string) => {
    setDestination(dest);
    setAppState('map_view');
  };

  const handleRequestDelivery = () => {
    setAppState('searching');
    
    socket.emit('request_cargo_delivery', {
      customerId: 'USR-MOBILE',
      cargoCategory: 'FURNITURE',
      vehicleRequested: selectedVehicle,
      pickupAddress: pickupLocation,
      destinationAddress: destination,
      distanceKm,
      paymentMethod: payment,
    });
  };

  useEffect(() => {
    socket.on('order_status_changed', (payload) => {
      if (payload.status === 'DRIVER_ACCEPTED') {
        setAppState('driver_found');
      }
    });

    return () => {
      socket.off('order_status_changed');
    };
  }, []);

  const handleCallDriver = () => {
    Linking.openURL('tel:+251911234567');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Main Map Background */}
      {(appState === 'map_view' || appState === 'searching' || appState === 'driver_found') && (
        <View style={styles.mapBackground}>
          <MapView 
            style={{flex: 1}}
            initialRegion={{
              latitude: 9.0205,
              longitude: 38.7469,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Interactive Pickup Pin Layer */}
            <Marker coordinate={{ latitude: 9.0205, longitude: 38.7469 }}>
              <View style={styles.mapPin}>
                <Text style={{fontSize: moderateScale(24)}}>📍</Text>
                <View style={styles.etaBadge}><Text style={styles.etaText}>3 min</Text></View>
              </View>
            </Marker>
            
            {/* Interactive Destination Pin Layer */}
            <Marker coordinate={{ latitude: 9.0305, longitude: 38.7669 }}>
              <View style={styles.mapPin}>
                <Text style={{fontSize: moderateScale(24)}}>🏁</Text>
                <View style={styles.etaBadge}><Text style={styles.etaText}>Arrive 10:34 AM</Text></View>
              </View>
            </Marker>
          </MapView>

          {/* Back Button Overlay */}
          <TouchableOpacity style={styles.backMapBtn} onPress={() => setAppState('idle')}>
            <Text style={{fontSize: moderateScale(20), fontWeight:'900'}}>←</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Default Homescreen View */}
      {appState === 'idle' && (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.brandTitle}>DELIX</Text>
              <Text style={styles.locationSubtitle}>Your location ›</Text>
            </View>
            <TouchableOpacity><Text style={{fontSize: moderateScale(24)}}>☰</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
              {vehicles.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.vehicleCard, selectedVehicle === item.id && styles.vehicleCardActive]}
                  onPress={() => setSelectedVehicle(item.id)}
                >
                  <Text style={styles.vehicleEmoji}>{item.icon}</Text>
                  <Text style={styles.vehicleName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.searchContainer}>
              <View style={styles.searchInputBox}>
                <Text style={styles.searchIcon}>🚘</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Where to?"
                  placeholderTextColor="#999"
                  value={destination}
                  onChangeText={setDestination}
                  onFocus={() => setAppState('selecting_route')}
                />
              </View>
            </View>

            {/* Transport Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerBadge}><Text style={styles.bannerBadgeText}>NEW</Text></View>
              <Text style={styles.bannerTitle}>DELIX CARGO IS HERE</Text>
              <Text style={styles.bannerSubtitle}>Fast and transparent cargo delivery</Text>
            </View>
          </ScrollView>
        </>
      )}

      {/* Location Search Sheet */}
      {appState === 'selecting_route' && (
        <View style={styles.fullSearchSheet}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setAppState('idle')}><Text style={{fontSize: moderateScale(24)}}>←</Text></TouchableOpacity>
            <View style={styles.inputGroup}>
              <TextInput style={styles.searchBox} value={pickupLocation} onChangeText={setPickupLocation} />
              <TextInput style={styles.searchBoxActive} placeholder="Destination" autoFocus onChangeText={setDestination} />
            </View>
          </View>

          <ScrollView style={{ marginTop: heightScale(20), paddingHorizontal: widthScale(20) }}>
            {['Gerji Mebrat Hail', 'Golagul Building', 'Aleph Hotel Bole'].map(item => (
              <TouchableOpacity key={item} style={styles.recentItem} onPress={() => handleDestinationSelect(item)}>
                <Text style={styles.recentPin}>📍</Text>
                <View>
                  <Text style={styles.recentTitle}>{item}</Text>
                  <Text style={styles.recentSubtitle}>Addis Ababa • 14 min</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map Checkout Bottom Sheet */}
      {appState === 'map_view' && (
        <View style={styles.checkoutSheet}>
          <View style={styles.locationsRow}>
            <Text style={styles.checkoutLocText}>📍 {pickupLocation}</Text>
            <Text style={styles.checkoutLocTextActive}>🏁 {destination}</Text>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceHighlightBox}>
            <View>
              <Text style={styles.vehicleNameHighlight}>{vehicles.find(v=>v.id===selectedVehicle)?.name}</Text>
              <Text style={styles.etaHighlight}>{distanceKm} km distance</Text>
            </View>
            <Text style={styles.priceAmount}>{currency} ~{estimatedPrice}</Text>
          </View>

          {/* Payment Selection */}
          <View style={styles.paymentRow}>
            {paymentMethods.map(p => (
              <TouchableOpacity 
                key={p.id} 
                style={[styles.paymentBtn, payment === p.id && styles.paymentBtnActive]}
                onPress={() => setPayment(p.id)}
              >
                <Text>{p.icon} {p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.requestButton} onPress={handleRequestDelivery}>
            <Text style={styles.requestButtonText}>Request {vehicles.find(v=>v.id===selectedVehicle)?.name}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Searching State */}
      {appState === 'searching' && (
        <View style={styles.searchingSheet}>
          <Text style={styles.searchingTitle}>Locating Near Driver...</Text>
          <Text style={styles.searchingSub}>Notifying {vehicles.find(v=>v.id===selectedVehicle)?.name} drivers near {pickupLocation}</Text>
          <View style={styles.loaderPulse} />
        </View>
      )}

      {/* Driver Found State */}
      {appState === 'driver_found' && (
        <View style={styles.checkoutSheet}>
          <View style={styles.driverMatchHeader}>
            <Text style={styles.driverMatchTitle}>Driver is arriving!</Text>
            <View style={styles.etaBadge}><Text style={styles.etaText}>2 mins away</Text></View>
          </View>

          <View style={styles.driverProfileBox}>
            <View style={styles.driverAvatar}><Text style={{fontSize: moderateScale(24)}}>👤</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>Yared Moges</Text>
              <Text style={styles.driverCarInfo}>★ 4.9 • AA-3-90812 (Mini Truck)</Text>
            </View>
            <TouchableOpacity style={styles.phoneButton} onPress={handleCallDriver}>
              <Text style={{fontSize: moderateScale(20)}}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: moderateScale(20) },
  brandTitle: { fontSize: moderateScale(28), fontWeight: '900', color: '#FF5722' },
  locationSubtitle: { fontSize: moderateScale(14), fontWeight: '600', color: '#1F2937' },
  content: { flex: 1 },
  vehicleScroll: { paddingLeft: widthScale(20), marginVertical: heightScale(15) },
  vehicleCard: { width: widthScale(105), height: heightScale(95), backgroundColor: '#F3F4F6', borderRadius: moderateScale(16), padding: moderateScale(12), marginRight: moderateScale(12), justifyContent: 'center', alignItems: 'center' },
  vehicleCardActive: { backgroundColor: '#FFF1EC', borderWidth: 2, borderColor: '#FF5722' },
  vehicleEmoji: { fontSize: moderateScale(28), marginBottom: heightScale(6) },
  vehicleName: { fontSize: moderateScale(13), fontWeight: '700', color: '#1F2937' },
  searchContainer: { paddingHorizontal: widthScale(20), marginTop: heightScale(10) },
  searchInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: moderateScale(16), paddingHorizontal: widthScale(16), paddingVertical: heightScale(14) },
  searchIcon: { fontSize: moderateScale(18), marginRight: widthScale(10) },
  searchInput: { flex: 1, fontSize: moderateScale(16), fontWeight: '700', color: '#1F2937' },
  banner: { margin: moderateScale(20), backgroundColor: '#FF5722', borderRadius: moderateScale(20), padding: moderateScale(20) },
  bannerBadge: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: widthScale(10), paddingVertical: heightScale(4), borderRadius: moderateScale(8), marginBottom: heightScale(8) },
  bannerBadgeText: { fontSize: moderateScale(10), fontWeight: '900', color: '#FF5722' },
  bannerTitle: { color: '#FFFFFF', fontSize: moderateScale(18), fontWeight: '900' },
  bannerSubtitle: { color: '#FFEFEA', fontSize: moderateScale(12), marginTop: heightScale(4) },
  
  // Map Simulation Styles
  mapBackground: { flex: 1, backgroundColor: '#E5E5E0', position: 'relative' },
  mapPin: { alignItems: 'center' },
  etaBadge: { backgroundColor: '#FF5722', paddingHorizontal: widthScale(10), paddingVertical: heightScale(6), borderRadius: moderateScale(12), marginTop: heightScale(4), shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity: 0.2 },
  etaText: { color: 'white', fontWeight: '800', fontSize: moderateScale(12) },
  backMapBtn: { position: 'absolute', top: heightScale(50), left: widthScale(20), width: moderateScale(44), height: moderateScale(44), backgroundColor: 'white', borderRadius: moderateScale(22), justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1 },

  // Sheets & Popups
  fullSearchSheet: { flex: 1, backgroundColor: 'white' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: moderateScale(20), borderBottomWidth: 1, borderColor: '#F3F4F6' },
  inputGroup: { flex: 1, marginLeft: widthScale(15) },
  searchBox: { backgroundColor: '#F9FAFB', padding: moderateScale(12), borderRadius: moderateScale(12), marginBottom: heightScale(8) },
  searchBoxActive: { backgroundColor: '#F3F4F6', padding: moderateScale(12), borderRadius: moderateScale(12), borderWidth: 1, borderColor: '#FF5722' },
  recentItem: { gap: moderateScale(15), flexDirection: 'row', paddingVertical: heightScale(14), borderBottomWidth: 1, borderColor: '#F3F4F6' },
  recentPin: { fontSize: moderateScale(20) },
  recentTitle: { fontSize: moderateScale(15), fontWeight: '700' },
  recentSubtitle: { fontSize: moderateScale(12), color: '#6B7280' },

  checkoutSheet: { backgroundColor: 'white', borderTopLeftRadius: moderateScale(24), borderTopRightRadius: moderateScale(24), padding: moderateScale(24), position: 'absolute', bottom: 0, width: '100%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },
  locationsRow: { borderBottomWidth: 1, borderColor: '#F3F4F6', paddingBottom: heightScale(15), marginBottom: heightScale(15) },
  checkoutLocText: { fontSize: moderateScale(14), fontWeight: '600', color: '#6B7280', marginBottom: heightScale(8) },
  checkoutLocTextActive: { fontSize: moderateScale(15), fontWeight: '800', color: '#1F2937' },
  
  priceHighlightBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: moderateScale(15), borderRadius: moderateScale(16), marginBottom: heightScale(15) },
  vehicleNameHighlight: { fontSize: moderateScale(16), fontWeight: '800' },
  etaHighlight: { fontSize: moderateScale(12), color: '#6B7280' },
  priceAmount: { fontSize: moderateScale(22), fontWeight: '900', color: '#1F2937' },

  paymentRow: { flexDirection: 'row', gap: moderateScale(10), marginBottom: heightScale(20) },
  paymentBtn: { flex: 1, padding: moderateScale(12), borderRadius: moderateScale(12), backgroundColor: '#F3F4F6', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  paymentBtnActive: { backgroundColor: '#FFF1EC', borderColor: '#FF5722' },

  requestButton: { backgroundColor: '#FF5722', borderRadius: moderateScale(16), padding: moderateScale(16), alignItems: 'center' },
  requestButtonText: { color: 'white', fontSize: moderateScale(16), fontWeight: '800' },

  searchingSheet: { backgroundColor: 'white', borderTopLeftRadius: moderateScale(24), borderTopRightRadius: moderateScale(24), padding: moderateScale(30), position: 'absolute', bottom: 0, width: '100%', alignItems: 'center' },
  searchingTitle: { fontSize: moderateScale(20), fontWeight: '900', color: '#1F2937' },
  searchingSub: { fontSize: moderateScale(13), color: '#6B7280', marginTop: heightScale(10), textAlign: 'center' },
  loaderPulse: { width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(25), backgroundColor: '#FF5722', opacity: 0.5, marginTop: heightScale(20) },

  driverMatchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: heightScale(20) },
  driverMatchTitle: { fontSize: moderateScale(20), fontWeight: '900' },
  driverProfileBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: moderateScale(15), borderRadius: moderateScale(16) },
  driverAvatar: { width: moderateScale(50), height: moderateScale(50), borderRadius: moderateScale(25), backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: widthScale(15) },
  driverName: { fontSize: moderateScale(16), fontWeight: '800' },
  driverCarInfo: { fontSize: moderateScale(13), color: '#6B7280', marginTop: heightScale(2) },
  phoneButton: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(22), backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
});

export default CustomerHomeScreen;
