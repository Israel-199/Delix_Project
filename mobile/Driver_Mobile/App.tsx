import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Switch
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const DriverHomeScreen = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [activeStep, setActiveStep] = useState<'idle' | 'incoming_request' | 'accepted' | 'in_transit' | 'completed'>('idle');
  const [completedTrips, setCompletedTrips] = useState(6); // 10-trip cycle tracker

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
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#D1D5DB', true: '#FF5722' }}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* 10-Trip Commission Cycle Status Banner */}
        <View style={styles.cycleCard}>
          <View style={styles.cycleHeader}>
            <Text style={styles.cycleTitle}>10-Trip Commission Cycle</Text>
            <Text style={styles.cycleCount}>{completedTrips} / 10 Completed</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(completedTrips / 10) * 100}%` }]} />
          </View>

          <Text style={styles.cycleSubtitle}>
            {completedTrips < 10 
              ? `${10 - completedTrips} more trips until commission recharge.` 
              : 'Cycle finished. Please recharge via Telebirr.'}
          </Text>
        </View>

        {/* State 1: Idle searching state */}
        {activeStep === 'idle' && (
          <View style={styles.searchingBox}>
            <Text style={styles.searchingIcon}>📡</Text>
            <Text style={styles.searchingTitle}>Searching for nearby cargo requests...</Text>
            <Text style={styles.searchingSubtitle}>Stay online to receive instant delivery alerts in Addis Ababa & Djibouti routes.</Text>

            {/* Test Simulation Button */}
            <TouchableOpacity 
              style={styles.simButton}
              onPress={() => setActiveStep('incoming_request')}
            >
              <Text style={styles.simButtonText}>[Simulate Incoming Cargo Request]</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* State 2: Incoming Order Pop-up Alert */}
        {activeStep === 'incoming_request' && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertBadge}>NEW DELIVERY REQUEST</Text>
              <Text style={styles.alertRinging}>🔔 RINGING...</Text>
            </View>

            <Text style={styles.priceTag}>450 ETB</Text>
            <Text style={styles.cargoType}>Cargo: Construction Materials (Isuzu Mini Truck)</Text>

            <View style={styles.routeBox}>
              <Text style={styles.routeText}>📍 Pickup: Bole CMC Square</Text>
              <Text style={styles.routeText}>🏁 Dropoff: Gerji Jackros Road (5.2 km)</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => setActiveStep('idle')}
              >
                <Text style={styles.rejectButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => setActiveStep('accepted')}
              >
                <Text style={styles.acceptButtonText}>ACCEPT ORDER</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* State 3: Active Delivery Workflow */}
        {activeStep === 'accepted' && (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>Trip In Progress (DLX-9481)</Text>
            <Text style={styles.customerPhone}>Customer: Abebe Bikila (+251 911 234 567)</Text>

            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>📞 Call Customer Directly</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.workflowButton}
              onPress={() => setActiveStep('in_transit')}
            >
              <Text style={styles.workflowButtonText}>ARRIVED AT PICKUP LOCATION</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 'in_transit' && (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>Cargo Loaded - Navigating to Destination</Text>
            <Text style={styles.routeText}>Destination: Gerji Jackros Road</Text>

            <TouchableOpacity 
              style={[styles.workflowButton, { backgroundColor: '#10B981' }]}
              onPress={() => {
                setCompletedTrips(prev => Math.min(prev + 1, 10));
                setActiveStep('completed');
              }}
            >
              <Text style={styles.workflowButtonText}>COMPLETE DELIVERY</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeStep === 'completed' && (
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>🎉</Text>
            <Text style={styles.completedTitle}>Delivery Successfully Completed!</Text>
            <Text style={styles.completedAmount}>Earned: 450 ETB</Text>

            <TouchableOpacity 
              style={styles.finishButton}
              onPress={() => setActiveStep('idle')}
            >
              <Text style={styles.finishButtonText}>Back to Searching</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF5722',
  },
  driverName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  onlineToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatusText: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
  },
  content: {
    padding: 20,
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cycleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  cycleCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF5722',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF5722',
  },
  cycleSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
  },
  searchingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchingIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  searchingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  simButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF1EC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  simButtonText: {
    color: '#FF5722',
    fontSize: 12,
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  alertBadge: {
    color: '#FF5722',
    fontWeight: '900',
    fontSize: 12,
  },
  alertRinging: {
    color: '#FBBF24',
    fontWeight: '800',
    fontSize: 12,
  },
  priceTag: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cargoType: {
    color: '#D1D5DB',
    fontSize: 13,
    marginBottom: 14,
  },
  routeBox: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  routeText: {
    color: '#F9FAFB',
    fontSize: 13,
    marginVertical: 2,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#4B5563',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#FF5722',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  customerPhone: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    marginBottom: 16,
  },
  callButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  callButtonText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  workflowButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  workflowButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  completedAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
    marginVertical: 10,
  },
  finishButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
