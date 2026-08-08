import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

const AboutScreen = ({ navigation }: Props) => {
  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.navigate('CustomerHome', { openDrawer: true })} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>About Delix</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Brand Section */}
      <View style={styles.brandCard}>
        <Image
          source={require('../../assets/images/home_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>Version 1.0.0 (Production Build)</Text>
      </View>

      {/* Mission */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Our Mission</Text>
        <Text style={styles.cardBody}>
          Delix is the premier digital cargo platform connecting customers with reliable truck drivers across Ethiopia & Djibouti. We streamline freight logistics with upfront pricing, live GPS tracking, and seamless payments.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Why Choose Delix?</Text>
        <Text style={styles.bulletItem}>• On-demand vehicle dispatching (Lada, Pickup, Mini Truck, Large Truck)</Text>
        <Text style={styles.bulletItem}>• Fixed price transparency with automatic currency conversion (ETB / DJF)</Text>
        <Text style={styles.bulletItem}>• Driver safety screening and cargo tracking</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Delix Logistics Technologies Inc. All rights reserved.</Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: moderateScale(22),
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
  },
  brandCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: moderateScale(140),
    height: moderateScale(120),
    marginBottom: spacing.sm,
  },
  versionText: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(13),
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    lineHeight: moderateScale(20),
  },
  bulletItem: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    lineHeight: moderateScale(20),
    marginTop: spacing.xxs,
  },
  footerText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default AboutScreen;
