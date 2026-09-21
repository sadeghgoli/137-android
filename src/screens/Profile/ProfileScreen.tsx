import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors, Fonts, Radius, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { getCurrentUser, logout } from '../../services/authService';
import type { CitizenUser } from '../../types/domain';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<CitizenUser | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setUser(await getCurrentUser());
      })();
    }, []),
  );

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.profile.title}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenHorizontal,
          paddingBottom: insets.bottom + Spacing.xl,
          gap: Spacing.lg,
        }}
      >
        <Text style={styles.hint}>{Strings.profile.readOnlyHint}</Text>

        <View style={styles.card}>
          <Field label={Strings.profile.firstName} value={user?.firstName} />
          <Field label={Strings.profile.lastName} value={user?.lastName} />
          <Field label={Strings.profile.nationalId} value={user?.nationalId} />
          <Field label={Strings.profile.mobile} value={user?.mobile} />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>{Strings.profile.landline}</Text>
          {user?.landlineVerified && user.landline ? (
            <View style={styles.landlineRow}>
              <Text style={styles.value}>{user.landline}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>{Strings.profile.verified}</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.empty}>{Strings.profile.landlineEmpty}</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => navigation.navigate('AddLandline')}
              >
                <Text style={styles.addButtonText}>{Strings.profile.addLandline}</Text>
              </Pressable>
            </>
          )}
        </View>

        <PrimaryButton
          label={Strings.profile.logout}
          onPress={handleLogout}
          style={styles.logout}
        />
      </ScrollView>
    </View>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  field: {
    gap: 2,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  value: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  section: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  addButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  landlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  verifiedBadge: {
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  verifiedText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.primaryDark,
  },
  logout: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: Colors.textPrimary,
  },
});
