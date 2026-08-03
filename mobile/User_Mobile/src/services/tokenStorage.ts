import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@delix/auth_token';
const PHONE_KEY = '@delix/auth_phone';

export const tokenStorage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  getPhone: () => AsyncStorage.getItem(PHONE_KEY),
  setPhone: (phone: string) => AsyncStorage.setItem(PHONE_KEY, phone),
  clear: async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(PHONE_KEY),
    ]);
  },
};

export default tokenStorage;
