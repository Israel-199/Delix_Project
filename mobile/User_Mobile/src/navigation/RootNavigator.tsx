import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookingSummaryScreen from '../screens/BookingSummaryScreen';
import CargoInfoScreen from '../screens/CargoInfoScreen';
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import DeliveryCompletedScreen from '../screens/DeliveryCompletedScreen';
import DriverTrackingScreen from '../screens/DriverTrackingScreen';
import LoginScreen from '../screens/LoginScreen';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import SplashScreen from '../screens/SplashScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import MyDeliveriesScreen from '../screens/MyDeliveriesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutScreen from '../screens/AboutScreen';
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
    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
    <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
    <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
    <Stack.Screen name="CargoInfo" component={CargoInfoScreen} />
    <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} />
    <Stack.Screen name="DriverTracking" component={DriverTrackingScreen} />
    <Stack.Screen name="DeliveryCompleted" component={DeliveryCompletedScreen} />
    <Stack.Screen name="MyProfile" component={MyProfileScreen} />
    <Stack.Screen name="MyDeliveries" component={MyDeliveriesScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
  </Stack.Navigator>
);

export default RootNavigator;

