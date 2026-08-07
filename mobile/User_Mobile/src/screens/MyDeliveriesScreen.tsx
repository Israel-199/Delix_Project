import React, { useState, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { moderateScale } from '../utils/responsive';
import { getUserOrders } from '../services/authService';
import { formatCurrencyDisplay } from '../utils/mappers';

type Props = NativeStackScreenProps<RootStackParamList, 'MyDeliveries'>;

interface OrderItem {
  id: string;
  cargoCategory: string;
  vehicleRequested: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedPrice: number;
  currency: string;
  status: string;
  createdAt: string;
}

const MyDeliveriesScreen = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('completed');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getUserOrders();
      if (res && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.log('Error fetching user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') {
      return o.status !== 'COMPLETED' && o.status !== 'CANCELLED';
    }
    return o.status === 'COMPLETED' || o.status === 'CANCELLED';
  });

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={styles.orderIdBadge}>
          <Text style={styles.orderIdText}>{item.id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'COMPLETED' ? styles.statusCompleted : styles.statusActive,
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.dotLineCol}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={styles.line} />
          <View style={[styles.dot, { backgroundColor: colors.accent || '#10B981' }]} />
        </View>
        <View style={styles.addressCol}>
          <Text style={styles.addressLabel}>Pickup</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.pickupAddress}</Text>
          <View style={{ height: spacing.sm }} />
          <Text style={styles.addressLabel}>Destination</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.destinationAddress}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cargoInfo}>
          📦 {item.cargoCategory} • {item.vehicleRequested}
        </Text>
        <Text style={styles.priceText}>
          {formatCurrencyDisplay(item.currency || 'ETB', item.estimatedPrice)}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false} contentStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Deliveries</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed History
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active Orders
          </Text>
        </Pressable>
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No deliveries found</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'active'
              ? 'You do not have any active orders right now.'
              : 'Your completed trip history will show up here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.lg,
    padding: spacing.xxs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  listContent: {
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orderIdBadge: {
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  orderIdText: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(13),
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusActive: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(12),
    color: colors.textPrimary,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dotLineCol: {
    alignItems: 'center',
    marginRight: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  addressCol: {
    flex: 1,
  },
  addressLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(11),
    color: colors.textSecondary,
  },
  addressText: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  cargoInfo: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
  priceText: {
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(16),
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: moderateScale(48),
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(18),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MyDeliveriesScreen;
