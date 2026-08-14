import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, PhoneInput, ScreenContainer } from '../components';
import { validatePhone } from '../components/inputs/PhoneInput';
import { colors, spacing } from '../design-system';
import { textStyles, typography } from '../theme/typography';
import { DriverStackParamList } from '../navigation/types';
import { useDriverAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverLogin'>;

const DriverLoginScreen = ({ navigation }: Props) => {
  const sendOtp = useDriverAuthStore((s) => s.sendOtp);
  const [phone, setPhoneLocal] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!validatePhone(phone, countryCode)) {
      setError('Enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const digits = phone.replace(/\D/g, '');
      const fullPhone = countryCode + digits.replace(/^0/, '');
      const res = await sendOtp(fullPhone);
      if (res?.devOtp) {
        Alert.alert(
          'Test OTP Code',
          `Your verification code is: ${res.devOtp}\n\n(Use this since SMS is not active in dev phase)`
        );
      }
      navigation.navigate('DriverOtp', { phone: fullPhone });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer avoidKeyboard contentStyle={styles.content}>
      <View style={styles.brandContainer}>
        <Image
          source={require('../../assets/images/welcome_logo.png')}
          style={styles.brandImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Welcome To Driver App</Text>
      <Text style={styles.subtitle}>Enter your phone number to continue</Text>

      <View style={styles.form}>
        <PhoneInput
          countryCode={countryCode}
          onCountryCodeChange={(code) => {
            setCountryCode(code);
            if (error) setError(undefined);
          }}
          value={phone}
          onChangeText={(text) => {
            setPhoneLocal(text);
            if (error) setError(undefined);
          }}
          error={error}
        />
        <DelixButton
          title="Continue"
          loading={loading}
          onPress={handleContinue}
          style={styles.button}
        />
      </View>

      <View style={styles.spacer} />

      <Text style={styles.footer}>
        By continuing, you agree to our{' '}
        <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
        <Text style={{ color: colors.primary }}>Privacy Policy</Text>
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing['3xl'],
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    marginTop: spacing.xl,
  },
  brandImage: {
    width: 190,
    height: 190,
  },
  title: {
    ...textStyles.sectionTitle,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing['3xl'],
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  button: {
    marginTop: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    marginBottom: spacing.xl,
    lineHeight: 20,
    ...typography.small,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
});

export default DriverLoginScreen;
