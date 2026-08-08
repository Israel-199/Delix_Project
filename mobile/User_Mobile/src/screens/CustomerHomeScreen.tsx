import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  AppDrawer,
  BottomSheet,
  CargoSquareCard,
  DelixButton,
  DelixInput,
  HomeLiveMapCard,
  HomeSearchBar,
  ScreenContainer,
} from '../components';
import { CARGO_TYPE_CATEGORIES } from '../constants';
import { RecentLocation } from '../constants/locations';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies, typography } from '../theme/typography';
import { useDebouncedLocationSearch } from '../hooks/useDebouncedLocationSearch';
import { RootStackParamList } from '../navigation/types';
import { reverseGeocode } from '../services/geocodingService';
import {
  fetchNearbyRecommendations,
  fetchRecentLocations,
  saveRecentLocationApi,
} from '../services/locationApiService';
import { requestUserLocation } from '../services/locationService';
import { fetchDrivingRoute } from '../services/routingService';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import { CargoTypeKey, VehicleCategoryId } from '../types';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerHome'>;

type SearchField = 'pickup' | 'destination';

const CustomerHomeScreen = ({ navigation, route }: Props) => {
  const {
    pickupLocation,
    cargoTypeKey,
    selectedVehicleId,
    setRoute,
    setRouteGeometry,
    setCargoTypeKey,
    setSelectedVehicleId,
  } = useBookingStore();
  const phone = useAuthStore((s) => s.phone);
  const userId = phone || 'guest';

  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeField, setActiveField] = useState<SearchField>('destination');
  const [drawerOpen, setDrawerOpen] = useState(!!route.params?.openDrawer);
  const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false);
  const [localPickup, setLocalPickup] = useState(pickupLocation);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [submittingRoute, setSubmittingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Clear the param if it was set so it doesn't persistently stay open on subsequent mounts
  useEffect(() => {
    if (route.params?.openDrawer) {
      navigation.setParams({ openDrawer: undefined });
    }
  }, [route.params?.openDrawer, navigation]);

  const searchQuery = activeField === 'pickup' ? localPickup : destination;
  const { results: searchResults, loading: searchLoading } = useDebouncedLocationSearch(searchQuery);

  const activeCategory = cargoTypeKey
    ? CARGO_TYPE_CATEGORIES.find((c) => c.id === cargoTypeKey) ?? CARGO_TYPE_CATEGORIES[0]
    : CARGO_TYPE_CATEGORIES[0];

  useEffect(() => {
    if (!isSearching) return;

    let cancelled = false;

    const loadRecent = async () => {
      const userPoint = await requestUserLocation();
      const [recent, nearby] = await Promise.all([
        fetchRecentLocations(userId),
        userPoint
          ? fetchNearbyRecommendations(userPoint.latitude, userPoint.longitude)
          : Promise.resolve([]),
      ]);

      if (cancelled) return;

      const merged = [...recent];
      nearby.forEach((item) => {
        if (!merged.some((m) => m.title === item.title)) merged.push(item);
      });
      setRecentLocations(merged);

      if (!localPickup.trim() && userPoint) {
        const label = await reverseGeocode(userPoint.latitude, userPoint.longitude);
        if (!cancelled && label) {
          setLocalPickup(label);
        }
      }
    };

    loadRecent();
    return () => {
      cancelled = true;
    };
  }, [isSearching, localPickup, userId]);

  const handleCargoCardPress = (categoryKey: CargoTypeKey) => {
    setCargoTypeKey(categoryKey);
    const cat = CARGO_TYPE_CATEGORIES.find((c) => c.id === categoryKey);
    if (cat && cat.vehicles.length > 0) {
      setSelectedVehicleId(cat.vehicles[0].id);
    }
    setVehicleSheetOpen(true);
  };

  const applyLocationSelection = async (loc: RecentLocation, field: SearchField) => {
    if (field === 'pickup') {
      setLocalPickup(loc.title);
      return;
    }

    setDestination(loc.title);
    setSubmittingRoute(true);
    setRouteError(null);

    try {
      const pickupLabel = localPickup.trim() || 'Current location';
      const userPoint = await requestUserLocation();

      const pickupCoordinate = userPoint
        ? {
            latitude: userPoint.latitude,
            longitude: userPoint.longitude,
            address: pickupLabel,
          }
        : null;

      const destinationCoordinate = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.title,
      };

      setRoute(pickupLabel, loc.title, { pickupCoordinate, destinationCoordinate });

      const origin = pickupCoordinate ?? destinationCoordinate;
      const route = await fetchDrivingRoute(origin, destinationCoordinate);

      setRouteGeometry({
        pickupCoordinate,
        destinationCoordinate,
        userCoordinate: pickupCoordinate,
        routeCoordinates: route.coordinates,
        distanceKm: route.distanceKm,
        travelEta: route.durationLabel,
        arrivalLabel: route.arrivalLabel,
        arrivalTime: route.arrivalTime,
      });

      await saveRecentLocationApi({
        userId,
        placeName: loc.title,
        address: loc.subtitle,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      setIsSearching(false);
      navigation.navigate('CargoInfo');
    } catch {
      setRouteError('Could not build route. Check pickup and destination.');
    } finally {
      setSubmittingRoute(false);
    }
  };

  const handleSelectLocationFromSheet = () => {
    setVehicleSheetOpen(false);
    setActiveField('destination');
    setIsSearching(true);
  };

  if (isSearching) {
    const list =
      searchQuery.trim().length >= 2 ? searchResults : recentLocations;

    return (
      <ScreenContainer contentStyle={styles.searchScreen}>
        <View style={styles.searchHeader}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setIsSearching(false);
              setRouteError(null);
            }}
            hitSlop={8}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.searchInputs}>
            <Pressable onPress={() => setActiveField('pickup')}>
              <DelixInput
                value={localPickup}
                onChangeText={setLocalPickup}
                placeholder="Pickup location"
                leadingIcon={<Ionicons name="location-sharp" size={18} color={colors.primary} />}
                onFocus={() => setActiveField('pickup')}
              />
            </Pressable>
            <Pressable onPress={() => setActiveField('destination')}>
              <DelixInput
                placeholder="Destination"
                value={destination}
                onChangeText={setDestination}
                autoFocus={activeField === 'destination'}
                leadingIcon={<Ionicons name="navigate-sharp" size={18} color={colors.primary} />}
                onFocus={() => setActiveField('destination')}
                containerStyle={styles.destInput}
              />
            </Pressable>
          </View>
        </View>

        {routeError ? <Text style={styles.routeError}>{routeError}</Text> : null}

        {searchLoading || submittingRoute ? (
          <View style={styles.searchLoader}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.searchLoaderText}>
              {submittingRoute ? 'Building route…' : 'Searching…'}
            </Text>
          </View>
        ) : null}

        <ScrollView showsVerticalScrollIndicator={false}>
          {list.map((item) => (
            <Pressable
              key={item.id}
              style={styles.recentItem}
              onPress={() => applyLocationSelection(item, activeField)}
              disabled={submittingRoute}
            >
              <View style={styles.recentPinBox}>
                <Ionicons name="location-sharp" size={20} color={colors.primary} />
              </View>
              <View style={styles.recentBody}>
                <Text style={styles.recentTitle}>{item.title}</Text>
                <Text style={styles.recentSubtitle}>{item.subtitle}</Text>
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
          <Image
            source={require('../../assets/images/home_logo.png')}
            style={styles.homeLogo}
            resizeMode="contain"
          />
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setDrawerOpen(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </View>

        <HomeLiveMapCard onPress={() => setIsSearching(true)} />

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
      </ScreenContainer>

      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

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
  homeContent: {
    paddingHorizontal: 0,
    flexGrow: 1,
    justifyContent: 'flex-start',
    
    paddingBottom: spacing.sm,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  homeLogo: {
    width: moderateScale(100),
    height: moderateScale(90),
  },
  menuIcon: { fontSize: moderateScale(24) },
  cargoGridContainer: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xxs,
  },
  sectionLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  cargoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  searchWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.xxs, marginBottom: spacing.xs },
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
  routeError: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.error,
    marginBottom: spacing.sm,
  },
  searchLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchLoaderText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  recentPinBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: radius.full,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
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
