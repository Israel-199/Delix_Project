import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../design-system';
import { heightScale } from '../../utils/responsive';

export interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Height as a fraction of screen (0–1) or absolute number. Defaults to auto content. */
  snapHeight?: number;
  showHandle?: boolean;
  showBackdrop?: boolean;
  dismissOnBackdropPress?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const BottomSheet = ({
  visible,
  onClose,
  children,
  snapHeight,
  showHandle = true,
  showBackdrop = true,
  dismissOnBackdropPress = true,
  style,
  contentStyle,
}: BottomSheetProps) => {
  const translateY = useRef(new Animated.Value(heightScale(400))).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(heightScale(400));
      backdropOpacity.setValue(0);
    }
  }, [visible, translateY, backdropOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80) {
          onClose?.();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {showBackdrop && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
            disabled={!dismissOnBackdropPress}
            onPress={dismissOnBackdropPress ? onClose : undefined}
            style={StyleSheet.absoluteFill}
          >
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </Pressable>
        )}

        <Animated.View
          style={[
            styles.sheet,
            snapHeight != null && { maxHeight: snapHeight },
            { transform: [{ translateY }] },
            style,
          ]}
          {...panResponder.panHandlers}
        >
          {showHandle && <View style={styles.handle} />}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

/** Inline bottom sheet anchored to the bottom of its parent (non-modal). */
export interface InlineBottomSheetProps {
  children: ReactNode;
  showHandle?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const InlineBottomSheet = ({
  children,
  showHandle = true,
  style,
  contentStyle,
}: InlineBottomSheetProps) => (
  <View style={[styles.inlineSheet, style]}>
    {showHandle && <View style={styles.handle} />}
    <View style={[styles.content, contentStyle]}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    ...shadows.sheet,
  },
  inlineSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    ...shadows.sheet,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    alignSelf: 'center',
    width: spacing['3xl'],
    height: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
});

export default BottomSheet;
