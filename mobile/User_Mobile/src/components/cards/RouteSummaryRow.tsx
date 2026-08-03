import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';

interface RouteSummaryRowProps {
  pickup: string;
  destination: string;
  travelEta?: string;
}

export const RouteSummaryRow = ({ pickup, destination, travelEta }: RouteSummaryRowProps) => (
  <View style={styles.container}>
    <View style={styles.row}>
      <Text style={styles.pickupIcon}>👋</Text>
      <Text style={styles.pickupText} numberOfLines={1}>{pickup}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.destIcon}>🏁</Text>
      <Text style={styles.destText} numberOfLines={1}>{destination}</Text>
      {travelEta ? <Text style={styles.eta}>{travelEta}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: colors.divider,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickupIcon: { fontSize: fontSize.base },
  pickupText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  destIcon: { fontSize: fontSize.base },
  destText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  eta: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
});

export default RouteSummaryRow;
