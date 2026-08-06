import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, PhoneInput, ScreenContainer, validateEthiopianPhone } from '../components';
import { colors, spacing } from '../design-system';
import { textStyles, typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { ApiError } from '../services/apiClient';
import { useAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const [phone, setPhoneLocal] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!validateEthiopianPhone(phone)) {
      setError('Enter a valid Ethiopian phone number');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await sendOtp(phone);
      navigation.navigate('OtpVerification', { phone });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send OTP. Check your connection.');
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
      <Text style={styles.title}>Welcome to Delix</Text>
      <Text style={styles.subtitle}>Enter your phone number to continue</Text>

      <View style={styles.form}>
        <PhoneInput
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
        By continuing, you agree to our <Text style={{color:colors.primary}}>Terms of Service</Text> and <Text style={{color:colors.primary}}>Privacy Policy</Text>
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
    textAlign:"center",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing['3xl'],
    textAlign:"center",
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

export default LoginScreen;
