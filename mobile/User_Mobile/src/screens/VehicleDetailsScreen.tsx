import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, ScreenContainer } from '../components';
import { VEHICLE_CATEGORIES } from '../constants';
import { findServiceModel } from '../constants/serviceModels';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { heightScale, moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetails'>;

const VehicleDetailsScreen = ({ navigation, route }: Props) => {
  const { vehicleCategoryId, serviceModelId, estimatedPrice, currency, distanceKm } =
    useBookingStore();

  const category = VEHICLE_CATEGORIES.find((v) => v.id === route.params.vehicleId);
  const model = useMemo(
    () =>
      serviceModelId
        ? findServiceModel(vehicleCategoryId, serviceModelId)
        : undefined,
    [vehicleCategoryId, serviceModelId]
  );

  if (!model || !category) {
    return (
      <ScreenContainer contentStyle={styles.center}>
        <Text style={styles.errorText}>Vehicle not found. Go back and select a service.</Text>
        <DelixButton title="Go Back" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <Text style={styles.heroIcon}>{category.icon}</Text>
        <Text style={styles.heroTitle}>{model.name}</Text>
        <Text style={styles.heroSubtitle}>
          {model.description} · {model.capacity} seats capacity
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceEta}>⚡ {model.eta}</Text>
          <Text style={styles.priceAmount}>
            {currency} {estimatedPrice} · {distanceKm} km
          </Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended cargo</Text>
          {model.recommendedCargo?.map((item) => (
            <Text key={item} style={styles.bullet}>• {item}</Text>
          ))}
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>💬 Driver instructions</Text>
          <Text style={styles.optionChevron}>›</Text>
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>👤 Request for someone else</Text>
          <Text style={styles.optionChevron}>›</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <DelixButton title="Continue" onPress={() => navigation.navigate('CargoInfo')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  errorText: { ...textStyles.body, textAlign: 'center', color: colors.error },
  hero: {
    backgroundColor: colors.backgroundTertiary,
    paddingTop: heightScale(50),
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: heightScale(50),
    left: spacing.lg,
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: fontSize.xl, fontWeight: fontWeight.black },
  heroIcon: { fontSize: moderateScale(64), marginBottom: spacing.md },
  heroTitle: { ...textStyles.sectionTitle, color: colors.textPrimary },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  priceEta: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  priceAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg },
  section: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  optionLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  optionChevron: { fontSize: fontSize.xl, color: colors.textSecondary },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
});

export default VehicleDetailsScreen;
