import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DriverNotification,
  fetchDriverNotifications,
  markDriverNotificationRead,
} from '../services/notificationService';
import { useDriverAuthStore } from '../store/authStore';
import { DriverStackParamList } from '../navigation/types';
import { fontFamilies } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, heightScale } from '../utils/responsive';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverNotifications'>;

const formatTime = (iso: string) => {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const notificationIcon = (type: string) => {
  switch (type) {
    case 'NEW_TRIP_REQUEST':
      return '🔔';
    case 'PAYMENT_DUE':
      return '💳';
    case 'PAYMENT_CONFIRMED':
      return '✅';
    case 'TRIP_COMPLETED':
      return '📦';
    default:
      return '📣';
  }
};

const DriverNotificationsScreen = ({ navigation }: Props) => {
  const phone = useDriverAuthStore((s) => s.phone);
  const [items, setItems] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchDriverNotifications(phone);
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handlePress = async (item: DriverNotification) => {
    if (!phone || item.read) return;
    await markDriverNotificationRead(item.id, phone);
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No notifications yet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => handlePress(item)}>
              <View style={[styles.card, !item.read && styles.unread]}>
                <Text style={styles.icon}>{notificationIcon(item.type)}</Text>
                <View style={styles.body}>
                  <View style={styles.row}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.message}>{item.message}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: moderateScale(16),
  },
  header: { marginBottom: heightScale(16) },
  back: { fontSize: moderateScale(16), color: '#FF5722', fontFamily: fontFamilies.semibold, marginBottom: heightScale(8) },
  title: { fontSize: moderateScale(24), fontFamily: fontFamilies.extrabold, color: '#111827' },
  list: { paddingBottom: heightScale(24) },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginBottom: heightScale(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unread: { borderColor: '#FF5722', backgroundColor: '#FFF7F5' },
  icon: { fontSize: moderateScale(22), marginRight: moderateScale(12) },
  body: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: moderateScale(8) },
  cardTitle: { flex: 1, fontSize: moderateScale(14), fontFamily: fontFamilies.bold, color: '#111827' },
  time: { fontSize: moderateScale(11), color: '#9CA3AF', fontFamily: fontFamilies.regular },
  message: { marginTop: heightScale(4), fontSize: moderateScale(13), color: '#6B7280', fontFamily: fontFamilies.medium },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: heightScale(40), fontFamily: fontFamilies.medium },
  error: { textAlign: 'center', color: '#DC2626', marginTop: heightScale(40), fontFamily: fontFamilies.medium },
});

export default DriverNotificationsScreen;
