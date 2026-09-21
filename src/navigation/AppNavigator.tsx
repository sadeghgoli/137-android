import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { SelectPhoneScreen } from '../screens/Auth/SelectPhoneScreen';
import { VerifyOtpScreen } from '../screens/Auth/VerifyOtpScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { AddLandlineScreen } from '../screens/Landline/AddLandlineScreen';
import { LandlineVerifyScreen } from '../screens/Landline/LandlineVerifyScreen';
import { MyRequestsScreen } from '../screens/Requests/MyRequestsScreen';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';
import { RequestDetailScreen } from '../screens/Requests/RequestDetailScreen';
import { NewRequestScreen } from '../screens/RequestForm/NewRequestScreen';
import { RequestSuccessScreen } from '../screens/RequestForm/RequestSuccessScreen';
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
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SelectPhone" component={SelectPhoneScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AddLandline" component={AddLandlineScreen} />
        <Stack.Screen name="LandlineVerify" component={LandlineVerifyScreen} />
        <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen
          name="NewRequest"
          component={NewRequestScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="RequestSuccess" component={RequestSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
