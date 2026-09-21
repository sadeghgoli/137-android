import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants';

export async function isOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(StorageKeys.onboardingCompleted);
  return value === 'true';
}

export async function shouldSkipOnboarding(): Promise<boolean> {
  const dontShow = await AsyncStorage.getItem(StorageKeys.onboardingDontShow);
  if (dontShow === 'true') {
    return true;
  }
  return isOnboardingCompleted();
}

export async function completeOnboarding(dontShowAgain: boolean): Promise<void> {
  const entries: Record<string, string> = {
    [StorageKeys.onboardingCompleted]: 'true',
  };
  if (dontShowAgain) {
    entries[StorageKeys.onboardingDontShow] = 'true';
  }
  await AsyncStorage.multiSet(Object.entries(entries));
}

/** Development helper to reset citizen app local state. */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.multiRemove([
    StorageKeys.onboardingCompleted,
    StorageKeys.onboardingDontShow,
    StorageKeys.isAuthenticated,
    StorageKeys.authUser,
    StorageKeys.requests,
    StorageKeys.notifications,
    StorageKeys.requestsSeeded,
  ]);
}
