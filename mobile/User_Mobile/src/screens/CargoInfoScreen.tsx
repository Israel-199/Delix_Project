import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, DelixInput, ScreenContainer } from '../components';
import { CARGO_CATEGORIES, CARGO_TYPE_CATEGORIES, CargoCategoryId } from '../constants/cargo';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { CargoVehicleOption, VehicleCategoryId } from '../types';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'CargoInfo'>;

/** Map each cargo category to recommended vehicle IDs (Uber style recommendation) */
const CATEGORY_VEHICLE_RECOMMENDATIONS: Record<CargoCategoryId, VehicleCategoryId[]> = {
  furniture: ['pickup', '3_ton_truck', 'mini_van'],
  construction: ['5_ton_truck', '3_ton_truck', 'large_pickup'],
  business_goods: ['light_truck', '3_ton_truck', 'mini_van'],
  documents: ['lada', 'pickup', 'mini_van'],
  electronics: ['pickup', 'mini_van', 'light_truck'],
  appliances: ['pickup', 'large_pickup', '3_ton_truck'],
  general: ['pickup', '3_ton_truck', 'lada'],
};

const getRecommendedVehicles = (categoryId: CargoCategoryId | null): CargoVehicleOption[] => {
  if (!categoryId) return [];
  const recommendedIds = CATEGORY_VEHICLE_RECOMMENDATIONS[categoryId] ?? ['pickup', '3_ton_truck'];
  const allVehicles: CargoVehicleOption[] = [];
  CARGO_TYPE_CATEGORIES.forEach((c) => allVehicles.push(...c.vehicles));
  return recommendedIds
    .map((id) => allVehicles.find((v) => v.id === id))
    .filter(Boolean) as CargoVehicleOption[];
};

const CargoInfoScreen = ({ navigation }: Props) => {
  const {
    cargoCategory,
    cargoDescription,
    specialInstructions,
    loadingAssistance,
    unloadingAssistance,
    selectedVehicleId,
    vehicleCategoryId,
    setCargoInfo,
    setSelectedVehicleId,
    setVehicleCategory,
    setCargoTypeKey,
  } = useBookingStore();

  const [localCategory, setLocalCategory] = useState<CargoCategoryId | null>(cargoCategory);
  const [description, setDescription] = useState(cargoDescription);
  const [instructions, setInstructions] = useState(specialInstructions);
  const [loading, setLoading] = useState(loadingAssistance);
  const [unloading, setUnloading] = useState(unloadingAssistance);
  const [error, setError] = useState<string | undefined>();

  const activeVehicleId = selectedVehicleId ?? vehicleCategoryId;
  const recommendedVehicles = getRecommendedVehicles(localCategory);

  const handleSelectRecommendedVehicle = (v: CargoVehicleOption) => {
    setSelectedVehicleId(v.id);
    setVehicleCategory(v.id);
    setCargoTypeKey(v.cargoType);
  };

  const handleContinue = () => {
    if (!localCategory) {
      setError('Please select a cargo category');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your cargo');
      return;
    }
    setCargoInfo({
      cargoCategory: localCategory,
      cargoDescription: description.trim(),
      specialInstructions: instructions.trim(),
      loadingAssistance: loading,
      unloadingAssistance: unloading,
    });
    navigation.navigate('BookingSummary');
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <Text style={styles.title}>Cargo Information</Text>
      <Text style={styles.subtitle}>Tell us what you're shipping</Text>

      <Text style={styles.label}>Select Cargo Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CARGO_CATEGORIES.map((cat) => {
          const active = localCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                setLocalCategory(cat.id);
                if (error) setError(undefined);
                // Auto pre-select top recommended vehicle for this category
                const recs = getRecommendedVehicles(cat.id);
                if (recs.length > 0) {
                  handleSelectRecommendedVehicle(recs[0]);
                }
              }}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Dynamic Recommended Vehicles (Uber Style) */}
      {recommendedVehicles.length > 0 && (
        <View style={styles.recommendationContainer}>
          <View style={styles.recHeaderRow}>
            <Text style={styles.recSectionTitle}>⚡ Recommended Vehicles</Text>
            <Text style={styles.recSectionSubtitle}>Tap to switch vehicle</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recRow}
          >
            {recommendedVehicles.map((v) => {
              const isSelected = activeVehicleId === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => handleSelectRecommendedVehicle(v)}
                  style={[styles.recCard, isSelected && styles.recCardSelected]}
                >
                  {v.vehicleImage ? (
                    <Image source={v.vehicleImage} style={styles.recImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.recIcon}>{v.icon}</Text>
                  )}
                  <Text style={[styles.recName, isSelected && styles.recNameSelected]} numberOfLines={1}>
                    {v.name}
                  </Text>
                  <Text style={styles.recEta}>{v.eta}</Text>
                  {isSelected && <Text style={styles.recSelectedBadge}>✓ Selected</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <DelixInput
        label="Description"
        placeholder="e.g. Office desk, chairs and 3 boxes"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          if (error) setError(undefined);
        }}
        multiline
        numberOfLines={3}
        style={styles.textArea}
      />

      <DelixInput
        label="Special instructions for driver (optional)"
        placeholder="Gate code, floor number, handle with care..."
        value={instructions}
        onChangeText={setInstructions}
        multiline
        numberOfLines={2}
        style={styles.textArea}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>Loading assistance</Text>
          <Text style={styles.toggleSub}>Driver helps loading your items</Text>
        </View>
        <Switch
          value={loading}
          onValueChange={setLoading}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={loading ? colors.primary : colors.background}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>Unloading assistance</Text>
          <Text style={styles.toggleSub}>Driver helps unloading at destination</Text>
        </View>
        <Switch
          value={unloading}
          onValueChange={setUnloading}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={unloading ? colors.primary : colors.background}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <DelixButton title="Continue to Summary" onPress={handleContinue} style={styles.button} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  back: { marginBottom: spacing.md },
  backText: { fontFamily: fontFamilies.bold, fontSize: moderateScale(22) },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(22),
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryRow: { gap: spacing.sm, marginBottom: spacing.lg },
  categoryChip: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundTertiary,
    minWidth: moderateScale(85),
    borderWidth: 1.5,
    borderColor: colors.transparent,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  categoryIcon: { fontSize: moderateScale(22), marginBottom: spacing.xxs },
  categoryLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: { color: colors.primaryDark, fontFamily: fontFamilies.bold },
  recommendationContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recSectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
  },
  recSectionSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },
  recRow: {
    gap: spacing.xs,
  },
  recCard: {
    width: moderateScale(105),
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  recCardSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  recImage: {
    width: moderateScale(44),
    height: moderateScale(32),
    marginBottom: spacing.xxs,
  },
  recIcon: {
    fontSize: moderateScale(22),
    marginBottom: spacing.xxs,
  },
  recName: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(12),
    color: colors.textPrimary,
    textAlign: 'center',
  },
  recNameSelected: {
    color: colors.primaryDark,
  },
  recEta: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(11),
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  recSelectedBadge: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(10),
    color: colors.primary,
    marginTop: spacing.xxs,
  },
  textArea: { minHeight: moderateScale(70), textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  toggleTextWrap: { flex: 1, marginRight: spacing.sm },
  toggleLabel: { fontFamily: fontFamilies.semibold, fontSize: moderateScale(15), color: colors.textPrimary },
  toggleSub: { fontFamily: fontFamilies.regular, fontSize: moderateScale(12), color: colors.textSecondary, marginTop: spacing.xxs },
  error: { fontFamily: fontFamilies.medium, color: colors.error, fontSize: moderateScale(13), marginTop: spacing.sm },
  button: { marginTop: spacing.xl, marginBottom: spacing['2xl'] },
});

export default CargoInfoScreen;
