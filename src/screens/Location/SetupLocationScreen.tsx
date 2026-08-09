import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images } from '../../assets';
import { LocationButton } from '../../components';
import { Colors, Spacing, Strings, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { getCurrentLocation } from '../../services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'SetupLocation'>;

export function SetupLocationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [loading, setLoading] = useState(false);

  const illustrationWidth = Math.min(width * 0.86, 360);
  const illustrationHeight = illustrationWidth * (189 / 375);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    const result = await getCurrentLocation();
    setLoading(false);

    if (!result.success) {
      Alert.alert(
        Strings.setupLocation.locationUnavailableTitle,
        result.error,
      );
      return;
    }

    Alert.alert(
      Strings.setupLocation.locationSavedTitle,
      Strings.setupLocation.locationSavedMessage(
        result.coordinates.latitude.toFixed(5),
        result.coordinates.longitude.toFixed(5),
      ),
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: Math.max(insets.bottom, Spacing.lg),
        },
      ]}
    >
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View
          style={[
            styles.illustrationArea,
            { minHeight: Math.min(height * 0.28, 220) },
          ]}
        >
          <Image
            source={Images.step4}
            style={{
              width: illustrationWidth,
              height: illustrationHeight,
            }}
            resizeMode="contain"
            accessible={false}
            importantForAccessibility="no"
          />
        </View>

        <Text style={styles.title}>{Strings.setupLocation.title}</Text>
        <Text style={styles.subtitle}>{Strings.setupLocation.subtitle}</Text>

        <View style={styles.actions}>
          <LocationButton
            label={Strings.setupLocation.useCurrentLocation}
            onPress={handleUseCurrentLocation}
            loading={loading}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              Strings.setupLocation.selectManuallyAccessibility
            }
            onPress={() => navigation.navigate('ManualLocation')}
            style={styles.manualPressable}
          >
            <Text style={styles.manualText}>
              {Strings.setupLocation.selectManually}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.heading,
    fontSize: 24,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.xxl,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  manualPressable: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  manualText: {
    ...Typography.link,
    color: Colors.manualLocation,
    textDecorationLine: 'underline',
  },
});
