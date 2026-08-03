import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../design-system';
import { typography } from '../../theme/typography';

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
  pickupIcon: { fontSize: typography.body.fontSize },
  pickupText: {
    flex: 1,
    ...typography.addressSubtitle,
  },
  destIcon: { fontSize: typography.body.fontSize },
  destText: {
    flex: 1,
    ...typography.addressTitle,
  },
  eta: {
    ...typography.timeLabel,
  },
});

export default RouteSummaryRow;
