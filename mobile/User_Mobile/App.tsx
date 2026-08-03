import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { FontProvider } from './src/providers/FontProvider';
import { ThemeProvider } from './src/providers/ThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <FontProvider>
        <ThemeProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </FontProvider>
    </SafeAreaProvider>
  );
}
