import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { DriverStackParamList } from '../navigation/types';
import { useDriverAuthStore } from '../store/authStore';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverOtp'>;

const OTP_LENGTH = 6;

const DriverOtpScreen = ({ navigation, route }: Props) => {
  const verifyAndLogin = useDriverAuthStore((s) => s.verifyAndLogin);
  const sendOtp = useDriverAuthStore((s) => s.sendOtp);
  const { phone } = route.params;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
      const state = useDriverAuthStore.getState();
      navigation.replace(state.needsRegistration ? 'DriverRegister' : 'DriverHome');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
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
      const res = await sendOtp(phone);
      if (res?.devOtp) {
        Alert.alert(
          'Test OTP Code',
          `Your verification code is: ${res.devOtp}\n\n(Use this since SMS is not active in dev phase)`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
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
        <Text style={styles.subtitle}>
          Code sent to{' '}
          {phone.startsWith('+')
            ? phone
            : `+251 ${phone.replace(/\s/g, '').replace(/^0/, '')}`}
        </Text>

        <View style={styles.otpRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
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

      {!isKeyboardVisible && (
        <View style={styles.bottomSection}>
          <Image
            source={require('../../assets/images/welcome_logo.png')}
            style={styles.bottomLogo}
            resizeMode="contain"
          />
        </View>
      )}
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
    marginBottom: spacing['5xl'],
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
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
    textAlign: 'center',
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
    textAlign: 'center',
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

export default DriverOtpScreen;
