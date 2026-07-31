import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverHomeScreen from './src/screens/DriverHomeScreen';

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