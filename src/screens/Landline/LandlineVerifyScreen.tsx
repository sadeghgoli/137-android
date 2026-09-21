import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { verifyLandline } from '../../services/landlineService';

type Props = NativeStackScreenProps<RootStackParamList, 'LandlineVerify'>;

type Phase = 'verifying' | 'success' | 'fail';

export function LandlineVerifyScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('verifying');
  const [error, setError] = useState<string>();

  const runVerify = async () => {
    setPhase('verifying');
    setError(undefined);
    const result = await verifyLandline(route.params.phone);
    if (result.success) {
      setPhase('success');
    } else {
      setError(result.error);
      setPhase('fail');
    }
  };

  useEffect(() => {
    void runVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.phone]);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
      ]}
    >
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.landline.verifyingTitle}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {phase === 'verifying' ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.title}>{Strings.landline.verifyingMessage}</Text>
            <Text style={styles.subtitle}>{Strings.landline.verifyingHint}</Text>
            <Text style={styles.phone}>{route.params.phone}</Text>
          </>
        ) : null}

        {phase === 'success' ? (
          <>
            <Text style={styles.title}>{Strings.landline.successTitle}</Text>
            <Text style={styles.subtitle}>{Strings.landline.successMessage}</Text>
            <PrimaryButton
              label={Strings.landline.done}
              onPress={() => navigation.navigate('Profile')}
              style={styles.cta}
            />
          </>
        ) : null}

        {phase === 'fail' ? (
          <>
            <Text style={styles.title}>{Strings.landline.failTitle}</Text>
            <Text style={styles.subtitle}>
              {error ?? Strings.landline.failMessage}
            </Text>
            <PrimaryButton
              label={Strings.landline.retry}
              onPress={() => void runVerify()}
              style={styles.cta}
            />
            <PrimaryButton
              label={Strings.landline.done}
              onPress={() => navigation.navigate('Profile')}
              style={styles.secondary}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 24,
  },
  phone: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.primaryDark,
  },
  cta: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
  },
  secondary: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: Colors.textPrimary,
  },
});
