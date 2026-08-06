import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
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
          damping: 24,
          stiffness: 240,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        } else {
          translateY.setValue(gesture.dy * 0.2);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 60 || gesture.vy > 0.5) {
          onClose?.();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 24,
            stiffness: 240,
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

/** Interactive inline sheet for map screens with drag gesture support and flush bottom positioning. */
export interface InlineBottomSheetProps {
  children: ReactNode;
  showHandle?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  maxHeightRatio?: number;
}

export const InlineBottomSheet = ({
  children,
  showHandle = true,
  style,
  contentStyle,
  maxHeightRatio = 0.46,
}: InlineBottomSheetProps) => {
  const maxHeight = heightScale(812) * maxHeightRatio;
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        } else {
          translateY.setValue(gesture.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          stiffness: 240,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.inlineSheet,
        { maxHeight, transform: [{ translateY }] },
        style,
      ]}
      {...panResponder.panHandlers}
    >
      {showHandle && <View style={styles.handle} />}
      <ScrollView
        style={styles.inlineScroll}
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
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
    paddingBottom: spacing.xl,
    marginBottom: 0,
  },
  inlineSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    ...shadows.sheet,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.lg,
  },
  inlineScroll: {
    flexGrow: 0,
  },
  handle: {
    alignSelf: 'center',
    width: spacing['3xl'],
    height: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
});

export default BottomSheet;
