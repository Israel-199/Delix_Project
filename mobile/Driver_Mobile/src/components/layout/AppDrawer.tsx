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
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../design-system';
import { fontFamilies } from '../../theme/typography';
import { DriverStackParamList } from '../../navigation/types';
import { useDriverAuthStore } from '../../store/authStore';
import { moderateScale } from '../../utils/responsive';

type DrawerItemId = 'profile' | 'trips' | 'documents' | 'notifications';

interface DrawerItemConfig {
  id: DrawerItemId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  targetScreen: keyof DriverStackParamList;
}

const DRAWER_ITEMS: DrawerItemConfig[] = [
  { id: 'trips', label: 'My Trips', icon: 'map-outline', targetScreen: 'DriverTrips' },
  { id: 'documents', label: 'My Documents', icon: 'document-text-outline', targetScreen: 'DriverDocuments' },
  { id: 'profile', label: 'My Profile', icon: 'person-outline', targetScreen: 'DriverProfile' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', targetScreen: 'DriverNotifications' },
];

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const AppDrawer = ({ visible, onClose }: AppDrawerProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const { name, phone, logout } = useDriverAuthStore();

  const [activeTab, setActiveTab] = useState<DrawerItemId | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleNavigate = (itemId: DrawerItemId, screenName: keyof DriverStackParamList) => {
    setActiveTab(itemId);
    onClose();
    navigation.navigate(screenName as any);
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    onClose();
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'DriverLogin' }] });
  };

  const displayName = name
    ? name.trim().split(' ').slice(0, 2).join(' ')
    : 'Delix Driver';

  return (
    <Modal transparent statusBarTranslucent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          {/* Drawer Profile Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/images/welcome_logo.png')} 
              style={styles.brandImage} 
              resizeMode="contain" 
            />
            <View style={styles.userRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfoCol}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.userPhone} numberOfLines={1}>
                  {phone || ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Drawer Menu Items */}
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.itemList}>
              {DRAWER_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.item, isActive && styles.itemActive]}
                    android_ripple={{ color: 'rgba(255, 102, 0, 0.15)', borderless: false }}
                    onPress={() => handleNavigate(item.id, item.targetScreen)}
                  >
                    <View style={styles.iconBox}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={isActive ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom Logout Button */}
          <View style={styles.logoutContainer}>
            <Pressable
              style={styles.logoutItem}
              android_ripple={{ color: 'rgba(239, 68, 68, 0.15)' }}
              onPress={handleLogoutPress}
            >
              <View style={styles.iconBox}>
                <Ionicons name="log-out-outline" size={22} color={colors.error} />
              </View>
              <Text style={styles.logoutLabel}>Logout</Text>
            </Pressable>
          </View>
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
    height: '100%',
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  brandImage: { 
    width: moderateScale(100),
    height: moderateScale(105),
    
    marginBottom: spacing.xxs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
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
  menuContainer: {
    flex: 1,
  },
  itemList: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  itemActive: {
    backgroundColor: 'rgba(255, 102, 0, 0.12)',
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  itemLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  itemLabelActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  logoutLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
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
