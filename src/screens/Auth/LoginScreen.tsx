import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthHeader } from '../../components/AuthHeader';
import { PrimaryButton, TextField } from '../../components';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import {
  lookupPhonesByMelliCode,
  loginWithMoiBrowser,
  loginWithSsoPortal,
  normalizeMelliCode,
} from '../../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [melliCode, setMelliCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [moiLoading, setMoiLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleContinue = async () => {
    const normalized = normalizeMelliCode(melliCode);
    if (!normalized) {
      setError(Strings.login.melliRequired);
      return;
    }
    if (normalized.length !== 10) {
      setError(Strings.login.melliInvalid);
      return;
    }

    setError(undefined);
    setLoading(true);
    try {
      const result = await lookupPhonesByMelliCode(normalized);
      if (result.kind === 'phones') {
        navigation.navigate('SelectPhone', {
          melliCode: result.melliCode,
          phones: result.phones,
        });
        return;
      }

      Alert.alert('ورود با SSO', result.message, [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'ورود وزارت کشور',
          onPress: () => {
            void handleMoi();
          },
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ورود با خطا مواجه شد.';
      Alert.alert(Strings.common.error, message);
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      await loginWithSsoPortal();
      goHome();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ورود از portal ناموفق بود';
      Alert.alert(Strings.common.error, message);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleMoi = async () => {
    setMoiLoading(true);
    try {
      await loginWithMoiBrowser();
      goHome();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ورود با خطا مواجه شد.';
      Alert.alert(Strings.common.error, message);
    } finally {
      setMoiLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AuthHeader heightRatio={0.32} />

      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
        ]}
      >
        <Text style={styles.title}>{Strings.login.title}</Text>
        <Text style={styles.subtitle}>{Strings.login.subtitle}</Text>
        <Text style={styles.hint}>{Strings.login.ssoHint}</Text>

        <PrimaryButton
          label={
            portalLoading ? Strings.login.portalLoading : Strings.login.portalButton
          }
          onPress={() => {
            void handlePortal();
          }}
          loading={portalLoading}
          style={styles.cta}
        />

        <TextField
          value={melliCode}
          onChangeText={setMelliCode}
          placeholder={Strings.login.melliPlaceholder}
          keyboardType="number-pad"
          error={error}
          maxLength={10}
        />

        <PrimaryButton
          label={loading ? Strings.login.loading : Strings.login.button}
          onPress={() => {
            void handleContinue();
          }}
          loading={loading}
          style={styles.secondaryCta}
        />

        <PrimaryButton
          label={
            moiLoading ? Strings.login.moiLoading : Strings.login.moiButton
          }
          onPress={() => {
            void handleMoi();
          }}
          loading={moiLoading}
          style={styles.secondaryCta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: Spacing.sm,
  },
  cta: {
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
  secondaryCta: {
    alignSelf: 'stretch',
    backgroundColor: Colors.textPrimary,
  },
});
