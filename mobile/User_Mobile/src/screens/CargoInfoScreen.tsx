import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, DelixInput, ScreenContainer } from '../components';
import { CARGO_CATEGORIES, CargoCategoryId } from '../constants/cargo';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CargoInfo'>;

const CargoInfoScreen = ({ navigation }: Props) => {
  const { cargoCategory, cargoDescription, specialInstructions, loadingAssistance, unloadingAssistance, setCargoInfo } =
    useBookingStore();

  const [localCategory, setLocalCategory] = useState<CargoCategoryId | null>(cargoCategory);
  const [description, setDescription] = useState(cargoDescription);
  const [instructions, setInstructions] = useState(specialInstructions);
  const [loading, setLoading] = useState(loadingAssistance);
  const [unloading, setUnloading] = useState(unloadingAssistance);
  const [error, setError] = useState<string | undefined>();

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

      <Text style={styles.label}>Cargo category</Text>
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

      <DelixInput
        label="Description"
        placeholder="e.g. Office desk and 2 chairs"
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
        label="Special instructions (optional)"
        placeholder="Gate code, floor number, fragile items..."
        value={instructions}
        onChangeText={setInstructions}
        multiline
        numberOfLines={2}
        style={styles.textArea}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Loading assistance</Text>
        <Switch
          value={loading}
          onValueChange={setLoading}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={loading ? colors.primary : colors.background}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Unloading assistance</Text>
        <Switch
          value={unloading}
          onValueChange={setUnloading}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={unloading ? colors.primary : colors.background}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <DelixButton title="Continue" onPress={handleContinue} style={styles.button} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  back: { marginBottom: spacing.md },
  backText: { fontSize: fontSize['2xl'], fontWeight: fontWeight.black },
  title: { ...textStyles.sectionTitle, marginBottom: spacing.xxs },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  categoryRow: { gap: spacing.sm, marginBottom: spacing.lg },
  categoryChip: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundTertiary,
    minWidth: 80,
    borderWidth: 1.5,
    borderColor: colors.transparent,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  categoryIcon: { fontSize: fontSize.xl, marginBottom: spacing.xxs },
  categoryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: { color: colors.primaryDark },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  toggleLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.sm },
  button: { marginTop: spacing.xl, marginBottom: spacing['2xl'] },
});

export default CargoInfoScreen;
