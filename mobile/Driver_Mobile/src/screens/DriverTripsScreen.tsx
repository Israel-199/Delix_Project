import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DriverTripRecord, fetchDriverTrips } from '../services/driverService';
import { useDriverAuthStore } from '../store/authStore';
import { DriverStackParamList } from '../navigation/types';
import { fontFamilies } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, heightScale } from '../utils/responsive';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverTrips'>;

const DriverTripsScreen = ({ navigation }: Props) => {
  const { driverId, phone } = useDriverAuthStore();
  const driverRef = driverId || phone || '';
  const [trips, setTrips] = useState<DriverTripRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const res = await fetchDriverTrips(driverRef);
    setTrips(res.trips);
    setLoading(false);
  }, [driverRef]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Trip History</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#FF5722" style={{ marginTop: 40 }} />
      ) : trips.length === 0 ? (
        <Text style={styles.empty}>No completed trips yet.</Text>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.customer}>{item.customerName}</Text>
                <Text style={styles.fare}>{item.fare} ETB</Text>
              </View>
              <Text style={styles.meta}>📍 {item.pickup}</Text>
              <Text style={styles.meta}>🏁 {item.destination}</Text>
              <Text style={styles.meta}>
                {item.cargoCategory} · {item.distanceKm.toFixed(1)} km · {item.paymentMethod}
              </Text>
              <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(20),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  back: { fontSize: moderateScale(14), fontFamily: fontFamilies.bold, color: '#FF5722' },
  title: { fontSize: moderateScale(18), fontFamily: fontFamilies.extrabold, color: '#1F2937' },
  empty: { textAlign: 'center', marginTop: heightScale(40), color: '#6B7280', fontFamily: fontFamilies.medium },
  list: { padding: moderateScale(16), gap: moderateScale(12) },
  card: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: heightScale(8) },
  customer: { fontSize: moderateScale(16), fontFamily: fontFamilies.extrabold, color: '#1F2937' },
  fare: { fontSize: moderateScale(16), fontFamily: fontFamilies.extrabold, color: '#FF5722' },
  meta: { fontSize: moderateScale(13), color: '#4B5563', marginTop: heightScale(4), fontFamily: fontFamilies.regular },
  date: { fontSize: moderateScale(11), color: '#9CA3AF', marginTop: heightScale(8), fontFamily: fontFamilies.medium },
});

export default DriverTripsScreen;
