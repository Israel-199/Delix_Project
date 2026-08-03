import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, screenPadding } from '../../design-system';

export interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  avoidKeyboard?: boolean;
  backgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const ScreenContainer = ({
  children,
  scrollable = false,
  avoidKeyboard = false,
  backgroundColor = colors.background,
  statusBarStyle = 'dark-content',
  edges = ['top', 'bottom'],
  contentStyle,
  style,
}: ScreenContainerProps) => {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  const body = avoidKeyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {body}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: screenPadding.horizontal,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: screenPadding.vertical,
  },
});

export default ScreenContainer;
