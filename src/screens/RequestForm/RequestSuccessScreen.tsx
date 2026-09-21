import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images } from '../../assets';
import { PrimaryButton } from '../../components';
import { Colors, Fonts, Radius, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestSuccess'>;

export function RequestSuccessScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();

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
      <Image source={Images.check} style={styles.check} />
      <Text style={styles.title}>{Strings.requestSuccess.title}</Text>
      <Text style={styles.label}>{Strings.requestSuccess.trackingLabel}</Text>
      <View style={styles.codeBox}>
        <Text style={styles.code}>{route.params.trackingCode}</Text>
      </View>
      <Text style={styles.sms}>{Strings.requestSuccess.smsHint}</Text>

      <View style={styles.actions}>
        <PrimaryButton
          label={Strings.requestSuccess.viewRequests}
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [{ name: 'Home' }, { name: 'MyRequests' }],
            })
          }
          style={styles.cta}
        />
        <PrimaryButton
          label={Strings.requestSuccess.backHome}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          }
          style={styles.secondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenHorizontal,
    alignItems: 'center',
  },
  check: {
    width: 72,
    height: 72,
    marginBottom: Spacing.lg,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    marginBottom: Spacing.sm,
  },
  codeBox: {
    width: '100%',
    borderRadius: Radius.lg,
    backgroundColor: Colors.illustrationBackground,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  code: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.primaryDark,
    letterSpacing: 1,
  },
  sms: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  cta: {
    width: '100%',
    alignSelf: 'stretch',
  },
  secondary: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: Colors.textPrimary,
  },
});
