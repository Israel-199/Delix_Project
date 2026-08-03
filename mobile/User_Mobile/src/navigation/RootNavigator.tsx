import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookingSummaryScreen from '../screens/BookingSummaryScreen';
import CargoInfoScreen from '../screens/CargoInfoScreen';
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import DeliveryCompletedScreen from '../screens/DeliveryCompletedScreen';
import DriverTrackingScreen from '../screens/DriverTrackingScreen';
import LoginScreen from '../screens/LoginScreen';
import MapBookingScreen from '../screens/MapBookingScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import SplashScreen from '../screens/SplashScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <Stack.Navigator
    initialRouteName="Splash"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
    <Stack.Screen name="MapBooking" component={MapBookingScreen} />
    <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
    <Stack.Screen name="CargoInfo" component={CargoInfoScreen} />
    <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} />
    <Stack.Screen name="DriverTracking" component={DriverTrackingScreen} />
    <Stack.Screen name="DeliveryCompleted" component={DeliveryCompletedScreen} />
  </Stack.Navigator>
);

export default RootNavigator;
