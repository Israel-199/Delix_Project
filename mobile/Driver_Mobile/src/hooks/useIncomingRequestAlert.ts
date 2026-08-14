import { useCallback, useEffect, useRef } from 'react';
import { Vibration } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

/** Short alert tone — bundled with the driver app. */
const ALERT_SOUND = require('../../assets/sounds/incoming-request.mp3');

let activeSound: Audio.Sound | null = null;
let vibrationTimer: ReturnType<typeof setInterval> | null = null;

const stopVibration = () => {
  if (vibrationTimer) {
    clearInterval(vibrationTimer);
    vibrationTimer = null;
  }
  Vibration.cancel();
};

const stopSound = async () => {
  if (!activeSound) return;
  try {
    await activeSound.stopAsync();
    await activeSound.unloadAsync();
  } catch {
    // ignore unload errors
  }
  activeSound = null;
};

export const stopIncomingRequestAlert = async () => {
  stopVibration();
  await stopSound();
};

export const startIncomingRequestAlert = async () => {
  await stopIncomingRequestAlert();

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(ALERT_SOUND, {
      isLooping: true,
      volume: 1,
      shouldPlay: true,
    });
    activeSound = sound;
  } catch {
    // Fall back to vibration-only if audio fails
  }

  Vibration.vibrate([0, 500, 300, 500], true);
  vibrationTimer = setInterval(() => {
    Vibration.vibrate([0, 400, 200, 400], false);
  }, 2500);
};

export const useIncomingRequestAlert = (isRinging: boolean) => {
  const startedRef = useRef(false);

  const stop = useCallback(async () => {
    startedRef.current = false;
    await stopIncomingRequestAlert();
  }, []);

  useEffect(() => {
    if (isRinging && !startedRef.current) {
      startedRef.current = true;
      startIncomingRequestAlert();
      return;
    }

    if (!isRinging && startedRef.current) {
      stop();
    }
  }, [isRinging, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { stopAlert: stop };
};
