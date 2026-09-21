import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
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
import { useOtpCooldown } from '../../hooks/useOtpCooldown';
import { requestOtp } from '../../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectPhone'>;

function maskPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 11) {
    return `${digits.slice(0, 4)}xxxx${digits.slice(-3)}`;
  }
  return phone;
}

export function SelectPhoneScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { melliCode, phones } = route.params;
  const phoneKey = (p: (typeof phones)[number]) =>
    p.id > 0 ? String(p.id) : p.phoneNumber;

  const [selectedKey, setSelectedKey] = useState(
    phones[0] ? phoneKey(phones[0]) : '',
  );

  const selectedPhone =
    phones.find((p) => phoneKey(p) === selectedKey) ?? phones[0];
  const [loading, setLoading] = useState(false);
  const sendCooldownSec = useOtpCooldown(
    selectedPhone?.phoneNumber ?? '',
    melliCode,
  );
  const sendBlocked = sendCooldownSec > 0;

  const handleSend = async () => {
    if (sendBlocked) {
      return;
    }
    if (!selectedPhone?.phoneNumber) {
      Alert.alert(Strings.common.error, 'یک شماره انتخاب کنید');
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(
        selectedPhone.phoneNumber,
        melliCode,
        selectedPhone.id,
      );
      navigation.navigate('VerifyOtp', {
        melliCode,
        phoneNumber: selectedPhone.phoneNumber,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ارسال کد تایید ناموفق بود';
      Alert.alert(Strings.common.error, message);
    } finally {
      setLoading(false);
    }
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
        title={Strings.login.selectPhoneTitle}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>{Strings.login.selectPhoneSubtitle}</Text>
        {phones.map((phone) => {
          const active = phoneKey(phone) === selectedKey;
          return (
            <Pressable
              key={`${phone.id}-${phone.phoneNumber}`}
              onPress={() => setSelectedKey(phoneKey(phone))}
              style={[styles.phoneCard, active && styles.phoneCardActive]}
            >
              <Text style={styles.phoneText}>
                {maskPhoneForDisplay(phone.phoneNumber)}
              </Text>
              {phone.isPrimary ? (
                <Text style={styles.primaryBadge}>اصلی</Text>
              ) : null}
            </Pressable>
          );
        })}
        <PrimaryButton
          label={
            loading
              ? Strings.login.loading
              : sendBlocked
                ? `ارسال مجدد (${sendCooldownSec} ثانیه)`
                : Strings.login.sendOtp
          }
          onPress={() => {
            void handleSend();
          }}
          loading={loading}
          disabled={sendBlocked}
          style={styles.cta}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  phoneCard: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
  },
  phoneCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.overlay,
  },
  phoneText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  primaryBadge: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.primaryDark,
  },
  cta: {
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
});
