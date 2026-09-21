import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
  Colors,
  Fonts,
  SOURCE_LABELS,
  Spacing,
  Strings,
} from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { listRequests } from '../../services/requestService';
import { ApiError } from '../../services/apiClient';
import type { CitizenRequest } from '../../types/domain';
import { formatDateFa, statusLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'MyRequests'>;

export function MyRequestsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CitizenRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          setError(null);
          setItems(await listRequests());
        } catch (err) {
          setItems([]);
          setError(
            err instanceof ApiError
              ? err.message
              : 'بارگذاری درخواست‌ها ناموفق بود.',
          );
        }
      })();
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.requests.title}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenHorizontal,
          paddingBottom: insets.bottom + Spacing.lg,
          gap: Spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {error ?? Strings.requests.empty}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('RequestDetail', { requestId: item.id })
            }
          >
            <View style={styles.row}>
              <Text style={styles.code}>
                {Strings.requests.trackingCode}: {item.trackingCode}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {statusLabel(item.status, item.apiStatus)}
                </Text>
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.meta}>
              {formatDateFa(item.createdAt)} · {SOURCE_LABELS[item.source]}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  empty: {
    marginTop: Spacing.xxl,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  code: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  badge: {
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: Colors.primaryDark,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 20,
  },
  meta: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
});
