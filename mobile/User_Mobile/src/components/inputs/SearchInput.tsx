import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../design-system';
import { fontSize, fontWeight } from '../../design-system/typography';
import { heightScale } from '../../utils/responsive';
import DelixInput, { DelixInputProps } from './DelixInput';

export interface SearchInputProps extends Omit<DelixInputProps, 'leadingIcon' | 'trailingIcon'> {
  onClear?: () => void;
  searchIcon?: string;
}

export const SearchInput = ({
  value,
  onChangeText,
  onClear,
  searchIcon = '🔍',
  placeholder = 'Where to?',
  ...rest
}: SearchInputProps) => {
  const showClear = Boolean(value && value.length > 0);

  return (
    <DelixInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      leadingIcon={<Text style={styles.icon}>{searchIcon}</Text>}
      trailingIcon={
        showClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => {
              onChangeText?.('');
              onClear?.();
            }}
          >
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        ) : undefined
      }
      containerStyle={styles.container}
      style={styles.inputText}
      {...rest}
    />
  );
};

/** Large home-screen search bar variant. */
export const HomeSearchBar = ({
  value,
  onChangeText,
  onPress,
  placeholder = 'Where to?',
  searchIcon = '🚘',
}: {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  searchIcon?: string;
}) => {
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.homeBar}>
        <Text style={styles.icon}>{searchIcon}</Text>
        <Text style={styles.homePlaceholder}>{value || placeholder}</Text>
        <Text style={styles.homeArrow}>›</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.homeBar}>
      <Text style={styles.icon}>{searchIcon}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        style={styles.homeInputText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  icon: {
    fontSize: fontSize.lg,
  },
  clear: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.bold,
  },
  inputText: {
    fontWeight: fontWeight.bold,
  },
  homeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: heightScale(14),
  },
  homePlaceholder: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPlaceholder,
  },
  homeArrow: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.black,
  },
  homeInputText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});

export default SearchInput;
