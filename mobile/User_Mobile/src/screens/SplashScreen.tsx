import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({ navigation }: Props) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [hydrate, opacity, scale]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      navigation.replace(isAuthenticated ? 'CustomerHome' : 'Login');
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isHydrated, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.logo}>DELIX</Text>
        <Text style={styles.tagline}>Deliver Faster · Live Better</Text>
      </Animated.View>
      <Text style={styles.loader}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logo: {
    ...textStyles.brand,
    fontSize: fontSize.display,
  },
  tagline: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  loader: {
    position: 'absolute',
    bottom: spacing['4xl'],
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    fontWeight: fontWeight.medium,
  },
});

export default SplashScreen;
