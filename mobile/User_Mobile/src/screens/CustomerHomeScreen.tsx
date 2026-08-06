import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AppDrawer,
  BottomSheet,
  CargoSquareCard,
  DelixButton,
  DelixInput,
  HomeSearchBar,
  PromoBanner,
  ScreenContainer,
} from '../components';
import { CARGO_TYPE_CATEGORIES, RECENT_LOCATIONS } from '../constants';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies, textStyles, typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { RecentLocation } from '../constants/locations';
import { CargoTypeKey, VehicleCategoryId } from '../types';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerHome'>;

const CustomerHomeScreen = ({ navigation }: Props) => {
  const {
    pickupLocation,
    cargoTypeKey,
    selectedVehicleId,
    setRoute,
    setCargoTypeKey,
    setSelectedVehicleId,
  } = useBookingStore();

  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false);
  const [localPickup, setLocalPickup] = useState(pickupLocation);

  const activeCategory = cargoTypeKey
    ? CARGO_TYPE_CATEGORIES.find((c) => c.id === cargoTypeKey) ?? CARGO_TYPE_CATEGORIES[0]
    : CARGO_TYPE_CATEGORIES[0];

  const handleCargoCardPress = (categoryKey: CargoTypeKey) => {
    setCargoTypeKey(categoryKey);
    const cat = CARGO_TYPE_CATEGORIES.find((c) => c.id === categoryKey);
    if (cat && cat.vehicles.length > 0) {
      setSelectedVehicleId(cat.vehicles[0].id);
    }
    setVehicleSheetOpen(true);
  };

  const handleDestinationSelect = (loc: RecentLocation) => {
    setRoute(localPickup, loc.title, {
      destinationCoordinate: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.title,
      },
    });
    setDestination(loc.title);
    setIsSearching(false);
    navigation.navigate('MapBooking');
  };

  const handleSelectLocationFromSheet = () => {
    setVehicleSheetOpen(false);
    setIsSearching(true);
  };

  if (isSearching) {
    return (
      <ScreenContainer contentStyle={styles.searchScreen}>
        <View style={styles.searchHeader}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsSearching(false)}
            hitSlop={8}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.searchInputs}>
            <DelixInput value={localPickup} onChangeText={setLocalPickup} />
            <DelixInput
              placeholder="Destination"
              value={destination}
              onChangeText={setDestination}
              autoFocus
              containerStyle={styles.destInput}
            />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {RECENT_LOCATIONS.map((item) => (
            <Pressable
              key={item.id}
              style={styles.recentItem}
              onPress={() => handleDestinationSelect(item)}
            >
              <Text style={styles.recentPin}>📍</Text>
              <View style={styles.recentBody}>
                <Text style={styles.recentTitle}>{item.title}</Text>
                <Text style={styles.recentSubtitle}>
                  {item.subtitle} · {item.eta}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer scrollable contentStyle={styles.homeContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>DELIX</Text>
            <Text style={styles.locationSubtitle}>Your location ›</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setDrawerOpen(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </View>

        {/* 3 Perfect Square Responsive Cargo Cards */}
        <View style={styles.cargoGridContainer}>
          <Text style={styles.sectionLabel}>Select Cargo Type</Text>
          <View style={styles.cargoGrid}>
            {CARGO_TYPE_CATEGORIES.map((cat) => (
              <CargoSquareCard
                key={cat.id}
                title={cat.title}
                image={cat.image}
                selected={cargoTypeKey === cat.id}
                onPress={() => handleCargoCardPress(cat.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.searchWrap}>
          <HomeSearchBar onPress={() => setIsSearching(true)} />
        </View>

        <PromoBanner
          title="DELIX CARGO IS HERE"
          subtitle="Fast and transparent cargo delivery"
        />
      </ScreenContainer>

      {/* Drawer Menu */}
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Vehicle Selection Drawer Sheet */}
      <BottomSheet
        visible={vehicleSheetOpen}
        onClose={() => setVehicleSheetOpen(false)}
        contentStyle={styles.sheetContent}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{activeCategory.title} Options</Text>
          <Text style={styles.sheetSubtitle}>{activeCategory.subtitle}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.vehicleList}
          contentContainerStyle={styles.vehicleListContent}
        >
          {activeCategory.vehicles.map((v) => {
            const isSelected = selectedVehicleId === v.id;
            return (
              <Pressable
                key={v.id}
                style={[styles.vehicleOptionCard, isSelected && styles.vehicleOptionSelected]}
                onPress={() => setSelectedVehicleId(v.id as VehicleCategoryId)}
              >
                {v.vehicleImage ? (
                  <Image source={v.vehicleImage} style={styles.vehicleImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.vehicleIcon}>{v.icon}</Text>
                )}
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleRowHeader}>
                    <Text style={[styles.vehicleName, isSelected && styles.vehicleNameSelected]}>
                      {v.name}
                    </Text>
                    <Text style={styles.vehicleEta}>⚡ {v.eta}</Text>
                  </View>
                  <Text style={styles.vehicleDesc}>{v.description}</Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <DelixButton
          title={selectedVehicleId ? 'Select Location' : 'Select a Vehicle'}
          disabled={!selectedVehicleId}
          onPress={handleSelectLocationFromSheet}
          style={styles.locationBtn}
        />
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  homeContent: { paddingHorizontal: 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  brandTitle: { ...textStyles.brand },
  locationSubtitle: { ...typography.locationLabel },
  menuIcon: { fontSize: moderateScale(24) },
  cargoGridContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  cargoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  searchWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  searchScreen: { paddingHorizontal: spacing.lg },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  backIcon: { ...typography.h3, marginTop: spacing.sm },
  searchInputs: { flex: 1, marginLeft: spacing.md, gap: spacing.xs },
  destInput: { marginTop: spacing.xs },
  recentItem: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  recentPin: { fontSize: moderateScale(20) },
  recentBody: { flex: 1 },
  recentTitle: { ...typography.addressTitle },
  recentSubtitle: { ...typography.addressSubtitle, marginTop: spacing.xxs },
  sheetContent: {
    paddingBottom: spacing.md,
  },
  sheetHeader: {
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(18),
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  vehicleList: {
    maxHeight: moderateScale(290),
    marginBottom: spacing.sm,
  },
  vehicleListContent: {
    gap: spacing.xs,
  },
  vehicleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.transparent,
  },
  vehicleOptionSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  vehicleImage: {
    width: moderateScale(48),
    height: moderateScale(40),
    marginRight: spacing.sm,
  },
  vehicleIcon: {
    fontSize: moderateScale(28),
    marginRight: spacing.sm,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleName: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  vehicleNameSelected: {
    color: colors.primaryDark,
  },
  vehicleEta: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
  },
  vehicleDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  radioOuter: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  locationBtn: {
    marginTop: spacing.xs,
  },
});

export default CustomerHomeScreen;
