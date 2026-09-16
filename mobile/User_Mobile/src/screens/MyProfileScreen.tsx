import React, { useState, useEffect } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, DelixInput, ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import { moderateScale } from '../utils/responsive';
import { pickImage, uploadImageToCloudinary } from '../services/cloudinaryService';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'MyProfile'>;

const MyProfileScreen = ({ navigation }: Props) => {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const logout = useAuthStore((s) => s.logout);
  const resetBooking = useBookingStore((s) => s.reset);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [middleName, setMiddleName] = useState(user?.middleName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [photoUri, setPhotoUri] = useState<string | null>(user?.profilePhotoUrl || null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.middleName) setMiddleName(user.middleName);
      if (user.lastName) setLastName(user.lastName);
      if (user.profilePhotoUrl) setPhotoUri(user.profilePhotoUrl);
    }
  }, [user]);

  const handlePickPhoto = async () => {
    const result = await pickImage();
    if (result) {
      setPhotoUri(result.uri);
      setPhotoBase64(result.base64);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !middleName.trim() || !lastName.trim()) {
      setError('First name, middle name, and last name are required.');
      return;
    }

    const isUnchanged =
      firstName.trim() === (user?.firstName || '').trim() &&
      middleName.trim() === (user?.middleName || '').trim() &&
      lastName.trim() === (user?.lastName || '').trim() &&
      photoUri === (user?.profilePhotoUrl || null);

    if (isUnchanged) {
      setError(null);
      setSuccessMsg('Nothing is changed');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      let cloudinaryUrl = photoUri;
      if (photoUri && !photoUri.startsWith('http')) {
        cloudinaryUrl = await uploadImageToCloudinary(photoUri, photoBase64);
      }

      await updateProfile({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        profilePhoto: cloudinaryUrl,
      });

      setSuccessMsg('Profile saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    resetBooking();
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <ScreenContainer avoidKeyboard scrollable contentStyle={styles.container}>
      {/* Header Navigation */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.navigate('CustomerHome', { openDrawer: true })} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* User Photo Avatar */}
      <View style={styles.avatarSection}>
        <Pressable style={styles.avatarButton} onPress={handlePickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {firstName ? firstName.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </Pressable>
        <Text style={styles.changePhotoText}>Tap to change photo (Optional)</Text>
      </View>

      {/* Profile Form */}
      <View style={styles.formCard}>
        <DelixInput
          label="First Name *"
          placeholder="Enter first name"
          value={firstName}
          onChangeText={(val) => { setFirstName(val); setError(null); setSuccessMsg(null); }}
        />
        <DelixInput
          label="Middle Name *"
          placeholder="Enter middle name"
          value={middleName}
          onChangeText={(val) => { setMiddleName(val); setError(null); setSuccessMsg(null); }}
        />
        <DelixInput
          label="Last Name *"
          placeholder="Enter last name"
          value={lastName}
          onChangeText={(val) => { setLastName(val); setError(null); setSuccessMsg(null); }}
        />
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Phone Number</Text>
          <Text style={styles.readOnlyValue}>{user?.phone || 'Not available'}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

      <DelixButton
        title="Save Profile"
        onPress={handleSaveProfile}
        loading={loading}
        style={styles.saveButton}
      />

      <Pressable style={styles.logoutButton} onPress={() => setLogoutModalVisible(true)}>
        <Ionicons name="person-outline" size={moderateScale(20)} color={colors.error} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

      {/* Confirmation Modal */}
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarButton: {
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(55),
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(38),
    color: colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 5,
  },
  cameraIcon: {
    fontSize: moderateScale(14),
  },
  changePhotoText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyField: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  readOnlyLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    color: colors.error,
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successText: {
    fontFamily: fontFamilies.semibold,
    color: colors.success || '#10B981',
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.errorLight || '#FEE2E2',
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutIcon: {
    marginRight: spacing.xs,
  },
  logoutText: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
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
    backgroundColor: colors.surface,
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

export default MyProfileScreen;
