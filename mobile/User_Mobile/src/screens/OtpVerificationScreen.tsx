import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  back: {
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    color: colors.textPrimary,
  },
  title: {
    ...textStyles.sectionTitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorTint,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
  },
  resend: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});

export default OtpVerificationScreen;
