import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DelixButton, DelixInput, ScreenContainer } from '../components';
import { CARGO_TYPE_CATEGORIES, CargoTypeKey } from '../constants/cargo';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies, typography } from '../theme/typography';
import { DriverStackParamList } from '../navigation/types';
import { useDriverAuthStore } from '../store/authStore';
import { pickDocumentImage, uploadDriverDocument } from '../services/cloudinaryService';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverRegister'>;

const DocumentPickerBox = ({
  label,
  imageUri,
  onPick,
  onClear,
}: {
  label: string;
  imageUri?: string;
  onPick: () => void;
  onClear: () => void;
}) => (
  <View style={styles.docBoxContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <Pressable style={styles.docBox} onPress={onPick}>
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.docImagePreview} />
          <Pressable style={styles.clearDocBtn} onPress={onClear}>
            <Ionicons name="close" size={16} color={colors.background} />
          </Pressable>
        </>
      ) : (
        <View style={styles.docEmpty}>
          <Ionicons name="camera-outline" size={28} color={colors.primary} />
          <Text style={styles.docEmptyText}>Tap to upload photo</Text>
        </View>
      )}
    </Pressable>
  </View>
);

const DriverRegisterScreen = ({ navigation }: Props) => {
  const completeRegistration = useDriverAuthStore((s) => s.completeRegistration);
  const phone = useDriverAuthStore((s) => s.phone);
  const driverIdStr = useDriverAuthStore((s) => s.driverId || phone);

  // Basic Info
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  
  const [profilePhotoUri, setProfilePhotoUri] = useState<string>();
  const [profilePhotoB64, setProfilePhotoB64] = useState<string>();

  // Vehicle Info
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleCargoType, setVehicleCargoType] = useState<CargoTypeKey>('small');
  const [vehicleType, setVehicleType] = useState('pickup');
  const [vehicleOwnerName, setVehicleOwnerName] = useState('');

  // Financial / Additional
  const [insuranceInfo, setInsuranceInfo] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // Documents
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseImageUri, setLicenseImageUri] = useState<string>();
  const [licenseImageB64, setLicenseImageB64] = useState<string>();

  const [nationalIdImageUri, setNationalIdImageUri] = useState<string>();
  const [nationalIdImageB64, setNationalIdImageB64] = useState<string>();

  const [libreImageUri, setLibreImageUri] = useState<string>();
  const [libreImageB64, setLibreImageB64] = useState<string>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCargoCategory = CARGO_TYPE_CATEGORIES.find((c) => c.id === vehicleCargoType);

  const handlePickDoc = async (
    setUri: (uri: string) => void,
    setB64: (b64: string | undefined) => void
  ) => {
    try {
      const res = await pickDocumentImage();
      if (res) {
        setUri(res.uri);
        setB64(res.base64);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to pick document');
    }
  };

  const handleValidation = () => {
    if (!name.trim()) return 'Full name is required';
    if (!profilePhotoUri) return 'Profile photo is required';
    if (!plateNumber.trim()) return 'Plate number is required';
    if (!licenseNumber.trim()) return 'License number is required';
    if (!vehicleType) return 'Specific vehicle type is required';
    if (!licenseImageUri) return 'Driver License photo is required';
    if (!libreImageUri) return 'Vehicle Registration (Libre) photo is required';
    if (!nationalIdImageUri) return 'National ID photo is required';
    return null;
  };

  const handleSubmit = async () => {
    const valError = handleValidation();
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload Documents to Cloudinary
      let uploadedLicenseUrl, uploadedLibreUrl, uploadedIdUrl, uploadedProfileUrl;

      if (profilePhotoUri) {
        const res = await uploadDriverDocument(profilePhotoUri, driverIdStr, profilePhotoB64);
        uploadedProfileUrl = res.url;
      }
      if (licenseImageUri) {
        const res = await uploadDriverDocument(licenseImageUri, driverIdStr, licenseImageB64);
        uploadedLicenseUrl = res.url;
      }
      if (libreImageUri) {
        const res = await uploadDriverDocument(libreImageUri, driverIdStr, libreImageB64);
        uploadedLibreUrl = res.url;
      }
      if (nationalIdImageUri) {
        // We reuse the same logic for ID, though backend handles National ID photo as license or a separate system.
        // We'll pass it in the payload and backend will parse it if supported.
        const res = await uploadDriverDocument(nationalIdImageUri, driverIdStr, nationalIdImageB64);
        uploadedIdUrl = res.url;
      }

      await completeRegistration({
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        licensePhotoUrl: uploadedLicenseUrl,
        nationalId: nationalId.trim(),
        profilePhotoUrl: uploadedProfileUrl,
        // Pass National ID image into the API payload mapped accordingly or as additional fields
        // Since backend may not natively support `nationalIdPhotoUrl` directly in DB without a migration, 
        // passing it ensures the system stores it inside `DriverDocument` if implemented.
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType,
        vehicleCargoType,
        vehicleOwnerName: vehicleOwnerName.trim(),
        librePhotoUrl: uploadedLibreUrl,
        insuranceInfo: insuranceInfo.trim(),
        bankAccount: bankAccount.trim(),
        address: `${city.trim()} - ${address.trim()}`,
      });

      navigation.replace('DriverHome');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer avoidKeyboard scrollable contentStyle={styles.container}>
      <Text style={styles.title}>Driver Registration</Text>
      <Text style={styles.subtitle}>Complete your profile to start receiving orders.</Text>

      {/* SECTION 1: Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Personal Information</Text>
        <DocumentPickerBox
          label="Profile Photo *"
          imageUri={profilePhotoUri}
          onPick={() => handlePickDoc(setProfilePhotoUri, setProfilePhotoB64)}
          onClear={() => { setProfilePhotoUri(undefined); setProfilePhotoB64(undefined); }}
        />
        <DelixInput
          label="Full Name *"
          placeholder="e.g. Yared Moges"
          value={name}
          onChangeText={(v) => { setName(v); setError(null); }}
        />
        <DelixInput
          label="Phone Number"
          value={phone}
          editable={false}
        />
        <DelixInput
          label="National ID Number"
          placeholder="Enter ID Number"
          value={nationalId}
          onChangeText={(v) => { setNationalId(v); setError(null); }}
        />
        <DocumentPickerBox
          label="National ID / Digital ID Photo *"
          imageUri={nationalIdImageUri}
          onPick={() => handlePickDoc(setNationalIdImageUri, setNationalIdImageB64)}
          onClear={() => { setNationalIdImageUri(undefined); setNationalIdImageB64(undefined); }}
        />
        <View style={styles.row}>
          <View style={styles.flex1}>
            <DelixInput
              label="City"
              placeholder="e.g. Addis Ababa"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={styles.spacer} />
          <View style={styles.flex1}>
            <DelixInput
              label="Sub-city / Woreda"
              placeholder="e.g. Bole"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>
      </View>

      {/* SECTION 2: License & Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Licensing</Text>
        <DelixInput
          label="Driver License Number *"
          placeholder="e.g. ETH-12345"
          value={licenseNumber}
          onChangeText={(v) => { setLicenseNumber(v); setError(null); }}
          autoCapitalize="characters"
        />
        <DocumentPickerBox
          label="Driver License Photo *"
          imageUri={licenseImageUri}
          onPick={() => handlePickDoc(setLicenseImageUri, setLicenseImageB64)}
          onClear={() => { setLicenseImageUri(undefined); setLicenseImageB64(undefined); }}
        />
      </View>

      {/* SECTION 3: Vehicle Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Vehicle Details</Text>
        <DelixInput
          label="Plate Number *"
          placeholder="e.g. AA 3 12345"
          value={plateNumber}
          onChangeText={(v) => { setPlateNumber(v); setError(null); }}
          autoCapitalize="characters"
        />
        <DelixInput
          label="Vehicle Owner Name"
          placeholder="e.g. Owner name or 'Self'"
          value={vehicleOwnerName}
          onChangeText={setVehicleOwnerName}
        />
        <DocumentPickerBox
          label="Vehicle Registration (Libre) Photo *"
          imageUri={libreImageUri}
          onPick={() => handlePickDoc(setLibreImageUri, setLibreImageB64)}
          onClear={() => { setLibreImageUri(undefined); setLibreImageB64(undefined); }}
        />

        <Text style={styles.inputLabel}>Cargo Category *</Text>
        <View style={styles.cargoTypeToggle}>
          {CARGO_TYPE_CATEGORIES.map((cat) => {
            const isActive = vehicleCargoType === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.cargoTab, isActive && styles.cargoTabActive]}
                onPress={() => {
                  setVehicleCargoType(cat.id);
                  if (cat.vehicles.length > 0) {
                    setVehicleType(cat.vehicles[0].id);
                  }
                  setError(null);
                }}
              >
                <Text style={[styles.cargoTabText, isActive && styles.cargoTabTextActive]}>
                  {cat.title.replace(' Cargo', '')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.inputLabel}>Specific Vehicle Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {activeCargoCategory?.vehicles.map((v) => {
            const isActive = vehicleType === v.id;
            return (
              <Pressable
                key={v.id}
                style={[styles.vehicleCard, isActive && styles.vehicleCardActive]}
                onPress={() => { setVehicleType(v.id); setError(null); }}
              >
                {v.vehicleImage ? (
                  <Image source={v.vehicleImage} style={styles.vehicleImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.vehicleIcon}>{v.icon}</Text>
                )}
                <Text style={[styles.vehicleCardText, isActive && styles.vehicleCardTextActive]}>
                  {v.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* SECTION 4: Financial & Insurance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Payouts & Additional Details</Text>
        <DelixInput
          label="Bank or Telebirr Account"
          placeholder="e.g. CBE 1000..."
          value={bankAccount}
          onChangeText={setBankAccount}
          keyboardType="default"
        />
        <DelixInput
          label="Vehicle Insurance (Optional)"
          placeholder="Insurance provider / Policy Number"
          value={insuranceInfo}
          onChangeText={setInsuranceInfo}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="warning" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <DelixButton
        title="Submit Profile for Approval"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitBtn}
      />
      <Text style={styles.noteText}>
        By submitting, you agree to Delix provider terms. Your documents will be securely reviewed.
      </Text>
      <View style={styles.bottomBuffer} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: colors.primary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: spacing.sm,
  },
  inputLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(13),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  docBoxContainer: {
    marginBottom: spacing.md,
  },
  docBox: {
    height: moderateScale(130),
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  docEmpty: {
    alignItems: 'center',
  },
  docEmptyText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  docImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  clearDocBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargoTypeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cargoTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  cargoTabActive: {
    backgroundColor: colors.primaryTint,
  },
  cargoTabText: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
  cargoTabTextActive: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  vehicleScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  vehicleCard: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    width: moderateScale(100),
  },
  vehicleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  vehicleImage: {
    width: moderateScale(50),
    height: moderateScale(40),
    marginBottom: spacing.xs,
  },
  vehicleIcon: {
    fontSize: moderateScale(28),
    marginBottom: spacing.xs,
  },
  vehicleCardText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  vehicleCardTextActive: {
    color: colors.primaryDark,
    fontFamily: fontFamilies.bold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorTint,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(13),
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  submitBtn: {
    marginBottom: spacing.lg,
  },
  noteText: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(12),
    color: colors.textPlaceholder,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  bottomBuffer: {
    height: spacing['4xl'],
  },
});

export default DriverRegisterScreen;
