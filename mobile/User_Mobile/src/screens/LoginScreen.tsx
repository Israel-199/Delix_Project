import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelixButton, PhoneInput, ScreenContainer, validateEthiopianPhone } from '../components';
import { colors, spacing } from '../design-system';
import { fontSize, fontWeight, textStyles } from '../design-system/typography';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const setPhone = useAuthStore((s) => s.setPhone);
  const [phone, setPhoneLocal] = useState('');
  const [error, setError] = useState<string | undefined>();

  const handleContinue = () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!validateEthiopianPhone(phone)) {
      setError('Enter a valid Ethiopian phone number');
      return;
    }
    setError(undefined);
    setPhone(phone);
    navigation.navigate('OtpVerification', { phone });
  };

  return (
    <ScreenContainer avoidKeyboard contentStyle={styles.content}>
      <Text style={styles.brand}>DELIX</Text>
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
        <DelixButton title="Continue" onPress={handleContinue} style={styles.button} />
      </View>

      <Text style={styles.footer}>
        By continuing, you agree to Delix Terms & Privacy Policy
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing['3xl'],
  },
  brand: {
    ...textStyles.brand,
    marginBottom: spacing['2xl'],
  },
  title: {
    ...textStyles.sectionTitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing['3xl'],
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LoginScreen;
