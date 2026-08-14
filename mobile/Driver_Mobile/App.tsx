import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import DriverTripsScreen from './src/screens/DriverTripsScreen';
import DriverDocumentsScreen from './src/screens/DriverDocumentsScreen';
import DriverProfileScreen from './src/screens/DriverProfileScreen';
import DriverNotificationsScreen from './src/screens/DriverNotificationsScreen';
import DriverLoginScreen from './src/screens/DriverLoginScreen';
import DriverOtpScreen from './src/screens/DriverOtpScreen';
import DriverRegisterScreen from './src/screens/DriverRegisterScreen';
import DriverSplashScreen from './src/screens/DriverSplashScreen';
import { DriverStackParamList } from './src/navigation/types';
import { FontProvider } from './src/providers/FontProvider';
import { ThemeProvider } from './src/providers/ThemeProvider';

const Stack = createNativeStackNavigator<DriverStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <FontProvider>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="DriverSplash">
              <Stack.Screen name="DriverSplash" component={DriverSplashScreen} />
              <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
              <Stack.Screen name="DriverOtp" component={DriverOtpScreen} />
              <Stack.Screen name="DriverRegister" component={DriverRegisterScreen} />
              <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
              <Stack.Screen name="DriverTrips" component={DriverTripsScreen} />
              <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
              <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
              <Stack.Screen name="DriverNotifications" component={DriverNotificationsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </FontProvider>
    </SafeAreaProvider>
  );
}
