import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DelixInput,
  HomeSearchBar,
  PromoBanner,
  ScreenContainer,
  VehicleCard,
} from '../components';
import { RECENT_LOCATIONS, VEHICLE_CATEGORIES } from '../constants';
import { colors, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/bookingStore';
import { VehicleCategoryId } from '../types';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerHome'>;

const CustomerHomeScreen = ({ navigation }: Props) => {
  const { vehicleCategoryId, setRoute, setVehicleCategory } = useBookingStore();
  const [pickupLocation, setPickupLocation] = useState('BL-03-505 Street, Bole');
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleDestinationSelect = (dest: string) => {
    setRoute(pickupLocation, dest);
    setDestination(dest);
    setIsSearching(false);
    navigation.navigate('MapBooking');
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
            <DelixInput value={pickupLocation} onChangeText={setPickupLocation} />
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
              onPress={() => handleDestinationSelect(item.title)}
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
    <ScreenContainer scrollable contentStyle={styles.homeContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>DELIX</Text>
          <Text style={styles.locationSubtitle}>Your location ›</Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={8}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.vehicleScroll}
        contentContainerStyle={styles.vehicleScrollContent}
      >
        {VEHICLE_CATEGORIES.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={{
              id: vehicle.id,
              name: vehicle.name,
              icon: vehicle.icon,
              eta: vehicle.eta,
            }}
            selected={vehicleCategoryId === vehicle.id}
            onPress={() => setVehicleCategory(vehicle.id as VehicleCategoryId)}
          />
        ))}
      </ScrollView>

      <View style={styles.searchWrap}>
        <HomeSearchBar onPress={() => setIsSearching(true)} />
      </View>

      <PromoBanner
        title="DELIX CARGO IS HERE"
        subtitle="Fast and transparent cargo delivery"
      />
    </ScreenContainer>
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
  locationSubtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  menuIcon: { fontSize: moderateScale(24) },
  vehicleScroll: { marginTop: spacing.md, marginBottom: spacing.xl, flexGrow: 0 },
  vehicleScrollContent: { paddingHorizontal: spacing.lg, alignItems: 'flex-start' },
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
  backIcon: { fontSize: moderateScale(24), fontWeight: fontWeight.black, marginTop: spacing.sm },
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
  recentTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  recentSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xxs },
});

export default CustomerHomeScreen;
