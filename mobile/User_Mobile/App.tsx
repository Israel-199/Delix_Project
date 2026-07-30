import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  SafeAreaView, 
  StatusBar,
  Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

const vehicles = [
  { id: 'pickup', name: 'Pickup', estPrice: '190', time: '3 min', icon: '🛻' },
  { id: 'mini_truck', name: 'Mini truck', estPrice: '350', time: '4 min', icon: '🚚' },
  { id: 'large_truck', name: 'Large truck', estPrice: '850', time: '8 min', icon: '🚛' },
];

const CustomerHomeScreen = () => {
  const [selectedVehicle, setSelectedVehicle] = useState('pickup');
  const [pickupLocation, setPickupLocation] = useState('BL-03-505 Street, Bole');
  const [destination, setDestination] = useState('Gerji Mebrat Hail');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>DELIX</Text>
          <Text style={styles.locationSubtitle}>Your location ›</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Horizontal Vehicle Selector Cards (Matching Mockup) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {vehicles.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.vehicleCard,
                selectedVehicle === item.id && styles.vehicleCardActive
              ]}
              onPress={() => setSelectedVehicle(item.id)}
            >
              <Text style={styles.vehicleEmoji}>{item.icon}</Text>
              <Text style={styles.vehicleName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Where To Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputBox}>
            <Text style={styles.searchIcon}>🚘</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Where to?"
              placeholderTextColor="#999"
              value={destination}
              onChangeText={setDestination}
            />
            <Text style={styles.searchArrow}>›</Text>
          </View>

          {/* Recent Destination Suggestions */}
          <View style={styles.recentList}>
            <TouchableOpacity style={styles.recentItem}>
              <View style={styles.recentIconBox}>
                <Text style={styles.recentPin}>📍</Text>
              </View>
              <View style={styles.recentTextContainer}>
                <Text style={styles.recentTitle}>Gerji Mebrat Hail</Text>
                <Text style={styles.recentSubtitle}>Addis Ababa, Bole Mehret Road • 10 min</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.recentItem}>
              <View style={styles.recentIconBox}>
                <Text style={styles.recentPin}>🛍️</Text>
              </View>
              <View style={styles.recentTextContainer}>
                <Text style={styles.recentTitle}>Golagul Building</Text>
                <Text style={styles.recentSubtitle}>Addis Ababa, Belay Zeleke Ave • 7 min</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transport Offer Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>NEW</Text>
          </View>
          <Text style={styles.bannerTitle}>DELIX CARGO IS HERE</Text>
          <Text style={styles.bannerSubtitle}>Fast and transparent cargo delivery services in Ethiopia & Djibouti</Text>
        </View>
      </ScrollView>

      {/* Bottom Sheet Ride Request Bar (Matching Mockup) */}
      <View style={styles.bottomSheet}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>Estimated Price:</Text>
          <Text style={styles.priceAmount}>Br ~{selectedVehicle === 'pickup' ? '190' : selectedVehicle === 'mini_truck' ? '350' : '850'}</Text>
        </View>

        <TouchableOpacity style={styles.requestButton}>
          <Text style={styles.requestButtonText}>Request Delivery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  brandContainer: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF5722', // Delix Signature Orange
    letterSpacing: 1,
  },
  locationSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  menuLine: {
    width: 22,
    height: 3,
    backgroundColor: '#1F2937',
    marginVertical: 2,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  vehicleScroll: {
    paddingLeft: 20,
    marginVertical: 15,
  },
  vehicleCard: {
    width: width * 0.28,
    height: 95,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleCardActive: {
    backgroundColor: '#FFF1EC',
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  vehicleEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchArrow: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  recentList: {
    marginTop: 20,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  recentPin: {
    fontSize: 18,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  recentSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  banner: {
    margin: 20,
    backgroundColor: '#FF5722',
    borderRadius: 20,
    padding: 20,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF5722',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  bannerSubtitle: {
    color: '#FFEFEA',
    fontSize: 12,
    marginTop: 4,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  priceText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  requestButton: {
    backgroundColor: '#FF5722',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
