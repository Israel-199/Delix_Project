import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { DelixButton, ScreenContainer } from '../components';
import { colors, spacing } from '../design-system';
import { fontFamilies, typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { moderateScale } from '../utils/responsive';
import { hasLocationPermission } from '../services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationPermission'>;

const LocationPermissionScreen = ({ navigation }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const goHome = () => navigation.replace('CustomerHome');

  useEffect(() => {
    (async () => {
      const granted = await hasLocationPermission();
      if (granted) {
        goHome();
      }
    })();
  }, []);

  const handleEnable = async () => {
    setRequesting(true);
    setError(null);

    try {
      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        try {
          await Location.enableNetworkProviderAsync();
          servicesEnabled = await Location.hasServicesEnabledAsync();
        } catch {
          // fall through if prompt is dismissed or fails
        }
        
        if (!servicesEnabled) {
          setError('Turn on location services in your device settings.');
          setRequesting(false);
          return;
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        goHome();
        return;
      }

      setError('Location access is needed to show your pickup point and nearby drivers.');
    } catch {
      setError('Could not request location permission. Try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.iconBadge}>
          <Ionicons name="location" size={moderateScale(48)} color={colors.primary} />
        </View>
        <Text style={styles.title}>Enable your location</Text>
        <Text style={styles.body}>
          Delix uses your GPS to place pickup on the map, show nearby drivers, and draw the route to
          your destination.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <DelixButton
        title={requesting ? 'Requesting…' : 'Enable location'}
        onPress={handleEnable}
        disabled={requesting}
        style={styles.primaryBtn}
      />

      <Pressable onPress={goHome} style={styles.skipWrap}>
        <Text style={styles.skip}>Continue without location</Text>
      </Pressable>

      {error ? (
        <Pressable onPress={() => Linking.openSettings()} style={styles.settingsWrap}>
          <Text style={styles.settingsLink}>Open device settings</Text>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconBadge: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  error: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  primaryBtn: {
    marginBottom: spacing.md,
  },
  skipWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skip: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
  },
  settingsWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  settingsLink: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(14),
    color: colors.primary,
  },
});

export default LocationPermissionScreen;
