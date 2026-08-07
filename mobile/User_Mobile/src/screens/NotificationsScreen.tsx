import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  read: boolean;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Welcome to Delix Logistics! 🚚',
    message: 'Your account is active. Book your first cargo delivery across Ethiopia and Djibouti in just a few taps.',
    time: '2 hours ago',
    icon: '🎉',
    read: false,
  },
  {
    id: 'n2',
    title: 'Instant Fare Calculation Active',
    message: 'Transparent transparent pricing is enabled for all vehicle types including Pickups, Mini Trucks, and Heavy Duty trucks.',
    time: '1 day ago',
    icon: '⚡',
    read: true,
  },
  {
    id: 'n3',
    title: 'Safety & Insurance Guarantee',
    message: 'All goods shipped with Delix drivers are verified and monitored in real-time.',
    time: '3 days ago',
    icon: '🛡️',
    read: true,
  },
];

const NotificationsScreen = ({ navigation }: Props) => {
  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={[styles.card, !item.read && styles.unreadCard]}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.contentBox}>
        <View style={styles.titleRow}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={styles.messageText}>{item.message}</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={SAMPLE_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
