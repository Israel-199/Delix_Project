import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components';
import { colors, radius, spacing } from '../design-system';
import { fontFamilies } from '../theme/typography';
import { RootStackParamList } from '../navigation/types';
import { moderateScale } from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

const HelpSupportScreen = ({ navigation }: Props) => {
  const handleCall = () => {
    Linking.openURL('tel:+251911000000');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@delixlogistics.com');
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.navigate('CustomerHome', { openDrawer: true })} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>How can we assist you today?</Text>

      <View style={styles.cardGroup}>
        <Pressable style={styles.supportCard} onPress={handleCall}>
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>📞</Text>
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Customer Service Hotline</Text>
            <Text style={styles.cardSubtitle}>Available 24/7 for urgent delivery help</Text>
          </View>
        </Pressable>

        <Pressable style={styles.supportCard} onPress={handleEmail}>
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>✉️</Text>
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Email Support</Text>
            <Text style={styles.cardSubtitle}>support@delixlogistics.com</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How are cargo delivery prices calculated?</Text>
        <Text style={styles.faqAnswer}>
          Prices are computed based on distance (km), requested vehicle type (e.g. Pickup, Mini Truck, Lada), and optional loading/unloading assistance.
        </Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I track my assigned driver?</Text>
        <Text style={styles.faqAnswer}>
          Once a driver accepts your booking, real-time GPS tracking will display the driver's location on your map screen.
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: moderateScale(15),
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  cardGroup: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardIcon: {
    fontSize: moderateScale(22),
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(17),
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  faqQuestion: {
    fontFamily: fontFamilies.semibold,
    fontSize: moderateScale(14),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    lineHeight: moderateScale(18),
  },
});

export default HelpSupportScreen;
