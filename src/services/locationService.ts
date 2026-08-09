import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys, Strings } from '../constants';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationResult =
  | { success: true; coordinates: Coordinates }
  | { success: false; error: string };

export async function requestLocationPermission(): Promise<boolean> {
  const { status: existing } = await Location.getForegroundPermissionsAsync();
  if (existing === Location.PermissionStatus.GRANTED) {
    return true;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        success: false,
        error: Strings.locationErrors.servicesDisabled,
      };
    }

    const granted = await requestLocationPermission();
    if (!granted) {
      return {
        success: false,
        error: Strings.locationErrors.permissionDenied,
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coordinates: Coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    await persistCoordinates(coordinates);

    return { success: true, coordinates };
  } catch {
    return {
      success: false,
      error: Strings.locationErrors.unavailable,
    };
  }
}

export async function persistCoordinates(
  coordinates: Coordinates,
): Promise<void> {
  await AsyncStorage.setMany({
    [StorageKeys.userLatitude]: String(coordinates.latitude),
    [StorageKeys.userLongitude]: String(coordinates.longitude),
  });
}

export async function getStoredCoordinates(): Promise<Coordinates | null> {
  const values = await AsyncStorage.getMany([
    StorageKeys.userLatitude,
    StorageKeys.userLongitude,
  ]);

  const lat = values[StorageKeys.userLatitude];
  const lng = values[StorageKeys.userLongitude];

  if (!lat || !lng) {
    return null;
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return { latitude, longitude };
}
