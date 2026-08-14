import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDriverAuthStore } from '../store/authStore';
import { moderateScale } from '../utils/responsive';
import { DriverStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverSplash'>;

const DriverSplashScreen = ({ navigation }: Props) => {
  const { isAuthenticated, isHydrated, hydrate, needsRegistration } = useDriverAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        navigation.replace('DriverLogin');
        return;
      }
      if (needsRegistration) {
        navigation.replace('DriverRegister');
        return;
      }
      navigation.replace('DriverHome');
    }, 800);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isHydrated, needsRegistration, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>DELIX</Text>
      <Text style={styles.tagline}>Driver</Text>
      <ActivityIndicator color="#FF5722" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: moderateScale(36),
    fontWeight: '900',
    color: '#FF5722',
  },
  tagline: {
    fontSize: moderateScale(16),
    color: '#6B7280',
    marginTop: moderateScale(4),
  },
  loader: { marginTop: moderateScale(24) },
});

export default DriverSplashScreen;
