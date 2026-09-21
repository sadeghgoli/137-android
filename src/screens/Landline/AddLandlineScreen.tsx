import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, TextField } from '../../components';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddLandline'>;

export function AddLandlineScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  const continueFlow = () => {
    const normalized = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      setError(Strings.landline.required);
      return;
    }
    if (normalized.length < 8) {
      setError(Strings.landline.invalid);
      return;
    }
    setError(undefined);
    navigation.navigate('LandlineVerify', { phone: phone.trim() });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
      ]}
    >
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.landline.title}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Text style={styles.subtitle}>{Strings.landline.subtitle}</Text>
        <TextField
          value={phone}
          onChangeText={setPhone}
          placeholder={Strings.landline.placeholder}
          keyboardType="phone-pad"
          error={error}
        />
        <PrimaryButton
          label={Strings.landline.continue}
          onPress={continueFlow}
          style={styles.cta}
        />
        <Text style={styles.demoHint}>
          برای تست شکست احراز، شماره‌ای که به ۰ ختم می‌شود وارد کنید.
        </Text>
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
    gap: Spacing.lg,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 24,
  },
  cta: {
    width: '100%',
    alignSelf: 'stretch',
  },
  demoHint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
