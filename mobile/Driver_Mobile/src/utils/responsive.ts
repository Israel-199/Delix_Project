import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on standard iPhone 11 Pro scale (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const widthScale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const heightScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (widthScale(size) - size) * factor;

export const SIZES = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};
