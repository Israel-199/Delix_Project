import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../design-system';
import { fontSize, fontWeight, textStyles } from '../../design-system/typography';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';

const DRAWER_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: '👤' },
  { id: 'deliveries', label: 'My Deliveries', icon: '📦' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'help', label: 'Help & Support', icon: '💬' },
  { id: 'about', label: 'About Delix', icon: 'ℹ️' },
] as const;

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const AppDrawer = ({ visible, onClose }: AppDrawerProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logout = useAuthStore((s) => s.logout);
  const resetBooking = useBookingStore((s) => s.reset);
  const phone = useAuthStore((s) => s.phone);

  const handleLogout = async () => {
    onClose();
    resetBooking();
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.brand}>DELIX</Text>
            {phone ? (
              <Text style={styles.phone}>+251 {phone.replace(/^0/, '')}</Text>
            ) : null}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {DRAWER_ITEMS.map((item) => (
              <Pressable key={item.id} style={styles.item} onPress={onClose}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}

            <Pressable style={[styles.item, styles.logoutItem]} onPress={handleLogout}>
              <Text style={styles.itemIcon}>🚪</Text>
              <Text style={[styles.itemLabel, styles.logoutLabel]}>Logout</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.overlay,
  },
  panel: {
    width: '78%',
    backgroundColor: colors.background,
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: spacing['2xl'],
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  brand: { ...textStyles.brand, marginBottom: spacing.xs },
  phone: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  itemIcon: { fontSize: fontSize.xl, width: 28 },
  itemLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  logoutItem: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingTop: spacing.lg,
  },
  logoutLabel: { color: colors.error },
});

export default AppDrawer;
