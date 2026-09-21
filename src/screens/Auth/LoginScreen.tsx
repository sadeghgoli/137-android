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
  normalizeMelliCode,
} from '../../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [melliCode, setMelliCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [moiLoading, setMoiLoading] = useState(false);
  const [moiFallbackMessage, setMoiFallbackMessage] = useState<string>();

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
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
    setMoiFallbackMessage(undefined);
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

      setMoiFallbackMessage(result.message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ورود با خطا مواجه شد.';
      Alert.alert(Strings.common.error, message);
    } finally {
      setLoading(false);
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
          style={styles.cta}
        />

        {moiFallbackMessage ? (
          <View style={styles.moiBlock}>
            <Text style={styles.moiMessage}>{moiFallbackMessage}</Text>
            <PrimaryButton
              label={
                moiLoading ? Strings.login.moiLoading : Strings.login.moiButton
              }
              onPress={() => {
                void handleMoi();
              }}
              loading={moiLoading}
              style={styles.moiButton}
            />
          </View>
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
  cta: {
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
  moiBlock: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
    alignSelf: 'stretch',
  },
  moiMessage: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  moiButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.textPrimary,
  },
});
