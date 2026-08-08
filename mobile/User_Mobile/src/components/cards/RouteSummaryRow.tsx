import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../design-system';
import { typography } from '../../theme/typography';

interface RouteSummaryRowProps {
  pickup: string;
  destination: string;
  travelEta?: string;
  arrivalTime?: string;
}

export const RouteSummaryRow = ({
  pickup,
  destination,
  travelEta,
  arrivalTime,
}: RouteSummaryRowProps) => (
  <View style={styles.container}>
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="ellipse" size={12} color={colors.primary} />
      </View>
      <Text style={styles.pickupText} numberOfLines={1}>{pickup}</Text>
    </View>
    <View style={styles.connector} />
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="location-sharp" size={18} color={colors.success} />
      </View>
      <Text style={styles.destText} numberOfLines={1}>{destination}</Text>
      {arrivalTime ? (
        <View style={styles.arrivalBadge}>
          <Text style={styles.arrivalText}>{arrivalTime}</Text>
        </View>
      ) : travelEta ? (
        <Text style={styles.eta}>{travelEta}</Text>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: colors.divider,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.info,
  },
  dotDest: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  connector: {
    width: 2,
    height: 14,
    backgroundColor: colors.border,
    marginLeft: 9,
    marginVertical: 2,
  },
  pickupText: {
    flex: 1,
    ...typography.addressSubtitle,
  },
  destText: {
    flex: 1,
    ...typography.addressTitle,
  },
  eta: {
    ...typography.timeLabel,
  },
  arrivalBadge: {
    backgroundColor: colors.successTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 8,
  },
  arrivalText: {
    ...typography.timeLabel,
    color: colors.success,
  },
});

export default RouteSummaryRow;

