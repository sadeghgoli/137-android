import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'sso_access_token';
const REFRESH_TOKEN_KEY = 'sso_refresh_token';

/** SecureStore is unavailable on web and some dev runtimes (stub without native methods). */
function canUseSecureStore(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  return (
    typeof SecureStore.getItemAsync === 'function' &&
    typeof SecureStore.setItemAsync === 'function' &&
    typeof SecureStore.deleteItemAsync === 'function'
  );
}

async function readSecure(key: string): Promise<string | null> {
  if (!canUseSecureStore()) {
    return AsyncStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function writeSecure(key: string, value: string): Promise<void> {
  if (!canUseSecureStore()) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function deleteSecure(key: string): Promise<void> {
  if (!canUseSecureStore()) {
    await AsyncStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return readSecure(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return readSecure(REFRESH_TOKEN_KEY);
}

export async function setTokens(
  accessToken: string,
  refreshToken?: string | null,
): Promise<void> {
  await writeSecure(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await writeSecure(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await deleteSecure(ACCESS_TOKEN_KEY);
  await deleteSecure(REFRESH_TOKEN_KEY);
}
