import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { ApiError } from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

const OTP_LENGTH = 6;

const OtpVerificationScreen = ({ navigation, route }: Props) => {
  const verifyAndLogin = useAuthStore((s) => s.verifyAndLogin);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const { phone } = route.params;
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const otpValue = digits.join('');

  const updateDigit = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (error) setError(undefined);

    if (char && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (next.every((d) => d.length === 1)) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code = otpValue) => {
    if (code.length < OTP_LENGTH) {
      setError('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await verifyAndLogin(phone, code);
      navigation.replace('CustomerHome');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(undefined);
    try {
      await sendOtp(phone);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer avoidKeyboard contentStyle={styles.content}>
      <View style={styles.topSection}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>Code sent to +251 {phone.replace(/\s/g, '').replace(/^0/, '')}</Text>

      <View style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputs.current[index] = ref; }}
            style={[styles.otpBox, error ? styles.otpBoxError : null]}
            value={digit}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(value) => updateDigit(index, value)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <DelixButton
        title="Verify"
        loading={loading}
        onPress={() => handleVerify()}
        style={styles.button}
      />

        <Pressable onPress={handleResend} disabled={resending}>
          <Text style={styles.resend}>{resending ? 'Sending...' : 'Resend Code'}</Text>
        </Pressable>
      </View>

      <View style={styles.bottomSection}>
        <Image 
          source={require('../../assets/images/welcome_logo.png')} 
          style={styles.bottomLogo} 
          resizeMode="contain" 
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing['2xl'],
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
  },
  back: {
    marginBottom: spacing["5xl"],
  },
  backText: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(22),
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(22),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign:"center",
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
    textAlign:"center",
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  otpBox: {
    width: moderateScale(48),
    height: moderateScale(56),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundTertiary,
    textAlign: 'center',
    fontSize: moderateScale(22),
    fontFamily: fontFamilies.extrabold,
    color: colors.textPrimary,
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorTint,
  },
  error: {
    color: colors.error,
    fontSize: moderateScale(13),
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
  },
  resend: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: moderateScale(14),
    fontFamily: fontFamilies.semibold,
    color: colors.primary,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: spacing['5xl'],
  },
  bottomLogo: {
    width: moderateScale(175),
    height: moderateScale(175),
  },
});

export default OtpVerificationScreen;
