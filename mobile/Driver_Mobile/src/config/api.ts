import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEV_PORT = 5000;

export function getDevServerHost(): string {
  const envHost = process.env.EXPO_PUBLIC_DELIX_API_HOST?.trim();
  if (envHost) {
    return envHost.replace(/^https?:\/\//, '').split(':')[0]!;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { hostUri?: string } | undefined)?.hostUri;

  if (hostUri) {
    const host = hostUri.replace(/^\w+:\/\//, '').split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

export const DEV_API_HOST = getDevServerHost();

export const SOCKET_URL = __DEV__
  ? `http://${DEV_API_HOST}:${DEV_PORT}`
  : 'https://api.delix.app';

if (__DEV__) {
  console.log('[Delix Driver Socket]', SOCKET_URL);
}
