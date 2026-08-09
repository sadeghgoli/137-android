import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Images } from '../../assets';
import { Colors, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { isOnboardingCompleted } from '../../services/onboardingStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SPLASH_DURATION_MS = 1800;

export function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Colors.splashBackground);
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('light-content');
      RNStatusBar.setBackgroundColor(Colors.splashBackground);
      RNStatusBar.setTranslucent(true);
    }

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    let cancelled = false;

    const timer = setTimeout(async () => {
      const completed = await isOnboardingCompleted();
      if (cancelled) {
        return;
      }

      if (completed) {
        navigation.replace('SetupLocation');
      } else {
        navigation.replace('Onboarding');
      }
    }, SPLASH_DURATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      void SystemUI.setBackgroundColorAsync(Colors.background);
      if (Platform.OS === 'android') {
        RNStatusBar.setBarStyle('dark-content');
        RNStatusBar.setBackgroundColor(Colors.background);
      }
    };
  }, [logoOpacity, logoScale, navigation]);

  const logoWidth = Math.min(width * 0.34, 140);
  const logoHeight = logoWidth * (216 / 154);
  const cityHeight = Math.min(height * 0.28, 210);

  return (
    <View style={styles.container} accessibilityLabel={Strings.splashAccessibility}>
      <StatusBar style="light" />

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoShadow,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={Images.logo}
            style={{ width: logoWidth, height: logoHeight }}
            resizeMode="contain"
            accessibilityLabel={Strings.logoAccessibility}
          />
        </Animated.View>
      </View>

      <Image
        source={Images.cityBackground}
        style={[styles.city, { width, height: cityHeight }]}
        resizeMode="cover"
        accessible={false}
        importantForAccessibility="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.splashBackground,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logoShadow: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  city: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
