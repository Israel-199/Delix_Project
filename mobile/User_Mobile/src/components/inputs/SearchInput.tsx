import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../design-system';
import { fontFamilies, typography } from '../../theme/typography';
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

/** Large home-screen search bar variant — matches "Where to?" reference. */
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
    fontSize: typography.subtitle.fontSize,
  },
  clear: {
    ...typography.caption,
    fontFamily: fontFamilies.bold,
    color: colors.textSecondary,
  },
  inputText: {
    fontFamily: fontFamilies.bold,
  },
  homeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
     marginTop:"2%",
    paddingVertical: heightScale(15),
  },
  homePlaceholder: {
    flex: 1,
    textAlign:"center",
    ...typography.whereTo,
    color: colors.textPrimary,
  },
  homeArrow: {
    ...typography.title,
    color: colors.textPrimary,
  },
  homeInputText: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.whereTo,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});

export default SearchInput;
