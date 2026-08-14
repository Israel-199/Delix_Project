import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { getUserNotifications, markNotificationRead, UserNotification } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

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
    case 'DRIVER_FOUND':
      return '🚗';
    case 'DRIVER_ARRIVED':
      return '📍';
    case 'TRIP_STARTED':
      return '🛣️';
    case 'DELIVERY_COMPLETED':
      return '✅';
    default:
      return '📦';
  }
};

const NotificationsScreen = ({ navigation }: Props) => {
  const phone = useAuthStore((s) => s.phone);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getUserNotifications(phone);
      setItems(res.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handlePress = async (item: UserNotification) => {
    if (!phone || item.read) return;
    try {
      await markNotificationRead(item.id, phone);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const renderItem = ({ item }: { item: UserNotification }) => (
    <Pressable onPress={() => handlePress(item)}>
      <View style={[styles.card, !item.read && styles.unreadCard]}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{notificationIcon(item.type)}</Text>
        </View>
        <View style={styles.contentBox}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer scrollable={false} contentStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.navigate('CustomerHome', { openDrawer: true })}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Loading notifications…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>No notifications yet. Book a delivery to get updates.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: moderateScale(22),
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    fontFamily: fontFamilies.medium,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    marginTop: spacing.xl,
    fontFamily: fontFamilies.medium,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  iconBox: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: moderateScale(22),
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  itemTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.xs,
  },
  timeText: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(11),
    color: colors.textTertiary || colors.textSecondary,
  },
  messageText: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    lineHeight: moderateScale(18),
  },
});

export default NotificationsScreen;
