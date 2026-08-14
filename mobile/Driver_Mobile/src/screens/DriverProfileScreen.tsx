import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchDriverProfile } from '../services/authService';
import { fetchDriverCycle } from '../services/driverService';
import { useDriverAuthStore } from '../store/authStore';
import { DriverStackParamList } from '../navigation/types';
import { fontFamilies } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, heightScale } from '../utils/responsive';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverProfile'>;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Verified',
  PENDING_APPROVAL: 'Pending approval',
  SUSPENDED: 'Suspended',
  OFFLINE: 'Offline',
};

const DriverProfileScreen = ({ navigation, route }: Props) => {
  const { phone, name, plateNumber, vehicleType, driverId } = useDriverAuthStore();
  const driverRef = driverId || phone || '';
  const isOnline = route.params?.isOnline ?? false;
  const [profileName, setProfileName] = useState(name || 'Driver');
  const [profilePhone, setProfilePhone] = useState(phone || '—');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState('PENDING_APPROVAL');
  const [completedTrips, setCompletedTrips] = useState(0);
  const [vehicle, setVehicle] = useState(vehicleType || 'MINI_TRUCK');
  const [plate, setPlate] = useState(plateNumber || '—');
  const [tripsInCycle, setTripsInCycle] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  useEffect(() => {
    if (!phone) return;

    fetchDriverProfile(phone).then((res) => {
      if (!res.driver) return;
      if (res.driver.name) setProfileName(res.driver.name);
      if (res.driver.phone) setProfilePhone(res.driver.phone);
      if (res.driver.profilePhotoUrl) setProfilePhotoUrl(res.driver.profilePhotoUrl);
      if (res.driver.status) setVerificationStatus(res.driver.status);
      if (res.driver.completedTrips != null) setCompletedTrips(res.driver.completedTrips);
      if (res.driver.vehicleType) setVehicle(res.driver.vehicleType);
      if (res.driver.plateNumber) setPlate(res.driver.plateNumber);
    });
  }, [phone]);

  useEffect(() => {
    if (!driverRef) return;
    fetchDriverCycle(driverRef).then((cycle) => {
      setTripsInCycle(cycle.completedTrips);
      if (cycle.paymentStatus) setPaymentStatus(cycle.paymentStatus);
    });
  }, [driverRef]);

  const statusLabel = STATUS_LABELS[verificationStatus] ?? verificationStatus;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Driver Profile</Text>
      </View>

      <View style={styles.avatarWrap}>
        {profilePhotoUrl ? (
          <Image source={{ uri: profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{profileName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{profileName}</Text>
      <Text style={styles.phone}>{profilePhone}</Text>

      <View style={styles.card}>
        <ProfileRow label="Vehicle" value={vehicle.replace(/_/g, ' ')} />
        <ProfileRow label="Plate number" value={plate} />
        <ProfileRow label="Verification" value={statusLabel} />
        <ProfileRow label="Online status" value={isOnline ? 'Online' : 'Offline'} />
        <ProfileRow label="Trips this cycle" value={`${tripsInCycle} / 10`} />
        <ProfileRow label="Payment status" value={paymentStatus} />
        <ProfileRow label="Total completed trips" value={String(completedTrips)} />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(20),
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },
  header: { marginBottom: heightScale(24) },
  back: { fontSize: moderateScale(16), color: '#FF5722', fontFamily: fontFamilies.semibold, marginBottom: heightScale(8) },
  title: { fontSize: moderateScale(24), fontFamily: fontFamilies.extrabold, color: '#111827' },
  avatarWrap: { alignItems: 'center', marginBottom: heightScale(16) },
  avatar: { width: moderateScale(96), height: moderateScale(96), borderRadius: moderateScale(48) },
  avatarPlaceholder: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: moderateScale(36), color: '#FFF', fontFamily: fontFamilies.bold },
  name: { fontSize: moderateScale(22), fontFamily: fontFamilies.bold, color: '#111827', textAlign: 'center' },
  phone: { fontSize: moderateScale(15), color: '#6B7280', textAlign: 'center', marginTop: heightScale(4), fontFamily: fontFamilies.medium },
  card: {
    marginTop: heightScale(24),
    backgroundColor: '#FFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: heightScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: moderateScale(14), color: '#6B7280', fontFamily: fontFamilies.regular },
  rowValue: { fontSize: moderateScale(14), fontFamily: fontFamilies.semibold, color: '#111827', maxWidth: '58%', textAlign: 'right' },
});

export default DriverProfileScreen;
