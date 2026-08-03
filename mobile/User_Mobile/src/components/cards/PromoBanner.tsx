import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../design-system';
import { fontFamilies, typography } from '../../theme/typography';

interface PromoBannerProps {
  badge?: string;
  title: string;
  subtitle: string;
}

export const PromoBanner = ({
  badge = 'NEW',
  title,
  subtitle,
}: PromoBannerProps) => (
  <View style={styles.banner}>
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{badge}</Text>
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.small,
    fontFamily: fontFamilies.extrabold,
    color: colors.primary,
  },
  title: {
    ...typography.subtitle,
    fontFamily: fontFamilies.extrabold,
    color: colors.textOnPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primarySubtle,
    marginTop: spacing.xxs,
  },
});

export default PromoBanner;
