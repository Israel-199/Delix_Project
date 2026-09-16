import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, DelixInput, ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies, typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { moderateScale } from '../utils/responsive';
import { pickImage, uploadImageToCloudinary } from '../services/cloudinaryService';
import { hasLocationPermission } from '../services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const ProfileSetupScreen = ({ navigation }: Props) => {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile); // We'll need this in authStore
  
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickPhoto = async () => {
    const result = await pickImage();
    if (result) {
      setPhotoUri(result.uri);
      setPhotoBase64(result.base64);
    }
  };

  const handleComplete = async () => {
    if (!firstName.trim() || !middleName.trim() || !lastName.trim()) {
      setError('First name, middle name, and last name are required.');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      let cloudinaryUrl = null;
      if (photoUri) {
        // Upload to cloudinary if user picked an optional photo
        cloudinaryUrl = await uploadImageToCloudinary(photoUri, photoBase64);
      }

      await updateProfile({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        profilePhoto: cloudinaryUrl,
      });

      const granted = await hasLocationPermission();
      navigation.replace(granted ? 'CustomerHome' : 'LocationPermission');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer avoidKeyboard scrollable contentStyle={styles.content}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself to get started</Text>

      <View style={styles.photoContainer}>
        <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>Add Photo</Text>
              <Text style={styles.photoOptionalText}>(Optional)</Text>
            </View>
          )}
        </Pressable>
        {photoUri && (
          <Pressable onPress={() => { setPhotoUri(null); setPhotoBase64(undefined); }} style={styles.removePhotoBtn}>
            <Text style={styles.removePhotoText}>Remove</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.form}>
        <DelixInput
          label="First Name *"
          placeholder="Enter first name"
          value={firstName}
          onChangeText={(val) => { setFirstName(val); setError(null); }}
        />
        <DelixInput
          label="Middle Name *"
          placeholder="Enter middle name"
          value={middleName}
          onChangeText={(val) => { setMiddleName(val); setError(null); }}
        />
        <DelixInput
          label="Last Name *"
          placeholder="Enter last name"
          value={lastName}
          onChangeText={(val) => { setLastName(val); setError(null); }}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <DelixButton
        title="Complete Profile"
        onPress={handleComplete}
        loading={loading}
        style={styles.button}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  title: {
    fontFamily: fontFamilies.extrabold,
    fontSize: moderateScale(25),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign:"center"
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign:"center"
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoButton: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: moderateScale(30),
    marginBottom: spacing.xxs,
  },
  photoText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
  photoOptionalText: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(11),
    color: colors.textTertiary || colors.textSecondary,
    marginTop: 2,
  },
  removePhotoBtn: {
    marginTop: spacing.sm,
  },
  removePhotoText: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(14),
    color: colors.error,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: 'auto',
  },
});

export default ProfileSetupScreen;
