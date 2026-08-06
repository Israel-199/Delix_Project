import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, DelixInput, ScreenContainer } from '../components';
import { CARGO_TYPE_CATEGORIES, VEHICLE_CATEGORIES } from '../constants';
import { findServiceModel } from '../constants/serviceModels';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { heightScale, moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetails'>;

const VehicleDetailsScreen = ({ navigation, route }: Props) => {
  const {
    vehicleCategoryId,
    serviceModelId,
    estimatedPrice,
    currency,
    distanceKm,
    specialInstructions,
    setCargoInfo,
  } = useBookingStore();

  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [localInstructions, setLocalInstructions] = useState(specialInstructions || '');

  const category = useMemo(() => {
    const oldCat = VEHICLE_CATEGORIES.find((v) => v.id === route.params.vehicleId);
    if (oldCat) return { ...oldCat, vehicleImage: undefined };
    for (const c of CARGO_TYPE_CATEGORIES) {
      const found = c.vehicles.find((v) => v.id === route.params.vehicleId);
      if (found)
        return {
          id: found.id,
          name: found.name,
          icon: found.icon,
          vehicleImage: found.vehicleImage,
          eta: found.eta,
          description: found.description,
        };
    }
    return undefined;
  }, [route.params.vehicleId]);

  const model = useMemo(
    () =>
      serviceModelId
        ? findServiceModel(vehicleCategoryId, serviceModelId)
        : undefined,
    [vehicleCategoryId, serviceModelId]
  );

  const handleSaveInstructions = () => {
    setCargoInfo({ specialInstructions: localInstructions.trim() });
    setInstructionsModalOpen(false);
  };

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

        {category.vehicleImage ? (
          <Image source={category.vehicleImage} style={styles.heroImage} resizeMode="contain" />
        ) : (
          <Text style={styles.heroIcon}>{category.icon}</Text>
        )}
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
            <Text key={item} style={styles.bullet}>
              • {item}
            </Text>
          ))}
        </View>

        {/* Driver Instructions Row */}
        <Pressable
          style={styles.optionRow}
          onPress={() => setInstructionsModalOpen(true)}
        >
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>💬 Driver instructions</Text>
            {specialInstructions ? (
              <Text style={styles.instructionBadge} numberOfLines={1}>
                ✓ Saved: "{specialInstructions}"
              </Text>
            ) : (
              <Text style={styles.optionSubtitle}>Add notes, gate code or floor for driver</Text>
            )}
          </View>
          <Text style={styles.optionChevron}>›</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <DelixButton title="Continue" onPress={() => navigation.navigate('CargoInfo')} />
      </View>

      {/* Driver Instructions Modal */}
      <Modal
        visible={instructionsModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setInstructionsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Driver Instructions</Text>
            <Text style={styles.modalSubtitle}>
              These instructions will be sent directly to your driver upon assignment.
            </Text>

            <DelixInput
              placeholder="e.g. Call before arrival, fragile boxes, entrance around the back..."
              value={localInstructions}
              onChangeText={setLocalInstructions}
              multiline
              numberOfLines={4}
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <DelixButton
                title="Cancel"
                variant="secondary"
                onPress={() => setInstructionsModalOpen(false)}
                style={styles.cancelBtn}
              />
              <DelixButton
                title="Send Instruction"
                onPress={handleSaveInstructions}
                style={styles.saveBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  errorText: {
    fontFamily: fontFamilies.medium,
    textAlign: 'center',
    color: colors.error,
  },
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
  backIcon: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
  },
  heroImage: {
    width: moderateScale(200),
    height: moderateScale(130),
    marginBottom: spacing.sm,
  },
  heroIcon: { fontSize: moderateScale(64), marginBottom: spacing.md },
  heroTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(22),
    color: colors.textPrimary,
  },
  heroSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
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
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  priceAmount: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(18),
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
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
    marginBottom: spacing.sm,
  },
  bullet: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  optionSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  instructionBadge: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(12),
    color: colors.success,
    marginTop: spacing.xxs,
  },
  optionChevron: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(18),
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  modalSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    minHeight: moderateScale(100),
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: { flex: 1 },
  saveBtn: { flex: 1.5 },
});

export default VehicleDetailsScreen;
