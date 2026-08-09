import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants';

export async function isOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(StorageKeys.onboardingCompleted);
  return value === 'true';
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.onboardingCompleted, 'true');
}

/** Development helper — call from a debug console / DevMenu to reset flow. */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeMany([
    StorageKeys.onboardingCompleted,
    StorageKeys.userLatitude,
    StorageKeys.userLongitude,
  ]);
}
