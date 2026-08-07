import React, { useState } from 'react';
import {
  Image,
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
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import { moderateScale } from '../../utils/responsive';

type DrawerItemId = 'profile' | 'deliveries' | 'notifications' | 'help' | 'about';

interface DrawerItemConfig {
  id: DrawerItemId;
  label: string;
  icon: string;
  targetScreen: keyof RootStackParamList;
}

const DRAWER_ITEMS: DrawerItemConfig[] = [
  { id: 'profile', label: 'My Profile', icon: '👤', targetScreen: 'MyProfile' },
  { id: 'deliveries', label: 'My Deliveries', icon: '📦', targetScreen: 'MyDeliveries' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', targetScreen: 'Notifications' },
  { id: 'help', label: 'Help & Support', icon: '💬', targetScreen: 'HelpSupport' },
  { id: 'about', label: 'About Delix', icon: 'ℹ️', targetScreen: 'About' },
];

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const AppDrawer = ({ visible, onClose }: AppDrawerProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetBooking = useBookingStore((s) => s.reset);
  const phone = useAuthStore((s) => s.phone);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleNavigate = (screenName: keyof RootStackParamList) => {
    onClose();
    navigation.navigate(screenName as any);
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    onClose();
    resetBooking();
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const firstAndMiddle = [user?.firstName, user?.middleName].filter(Boolean).join(' ');
  const displayName = firstAndMiddle || (user?.name ? user.name.split(' ').slice(0, 2).join(' ') : 'Delix User');

  return (
    <Modal transparent statusBarTranslucent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          {/* Drawer Profile Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/images/home_logo.png')} 
              style={styles.brandImage} 
              resizeMode="contain" 
            />
            <View style={styles.userRow}>
              {user?.profilePhotoUrl ? (
                <Image source={{ uri: user.profilePhotoUrl }} style={styles.userAvatar} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                  </Text>
                </View>
              )}
              <View style={styles.userInfoCol}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.userPhone} numberOfLines={1}>
                  {phone || user?.phone || ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Drawer Menu Items */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {DRAWER_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                style={styles.item}
                onPress={() => handleNavigate(item.targetScreen)}
              >
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}

            <Pressable style={[styles.item, styles.logoutItem]} onPress={handleLogoutPress}>
              <Text style={styles.itemIcon}>🚪</Text>
              <Text style={[styles.itemLabel, styles.logoutLabel]}>Logout</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>

      {/* Confirmation Modal Pop Up */}
      <Modal
        visible={logoutModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure to logout?</Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmLogoutBtn]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmLogoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    width: '80%',
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  brandImage: { 
    width: moderateScale(110),
    height: moderateScale(65),
    alignSelf: 'center',
    marginBottom: spacing.xxs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  userAvatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarCircle: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.primary,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  userPhone: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  itemIcon: {
    fontSize: moderateScale(20),
    width: 28,
  },
  itemLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  logoutItem: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingTop: spacing.lg,
  },
  logoutLabel: {
    fontFamily: fontFamilies.bold,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalMessage: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(15),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  confirmLogoutBtn: {
    backgroundColor: colors.error,
  },
  confirmLogoutText: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: '#FFFFFF',
  },
});

export default AppDrawer;

