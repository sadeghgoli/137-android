import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';
import { SetupLocationScreen } from '../screens/Location/SetupLocationScreen';
import { ManualLocationScreen } from '../screens/Location/ManualLocationScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SetupLocation" component={SetupLocationScreen} />
        <Stack.Screen name="ManualLocation" component={ManualLocationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
