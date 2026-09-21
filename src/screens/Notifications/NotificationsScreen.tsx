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
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import {
  listNotifications,
  markNotificationRead,
} from '../../services/notificationService';
import type { AppNotification } from '../../types/domain';
import { formatDateFa, statusLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setItems(await listNotifications());
      })();
    }, []),
  );

  const openItem = async (item: AppNotification) => {
    await markNotificationRead(item.id);
    navigation.navigate('RequestDetail', { requestId: item.requestId });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.notifications.title}
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
          <Text style={styles.empty}>{Strings.notifications.empty}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.read && styles.unread]}
            onPress={() => void openItem(item)}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.status}>{statusLabel(item.status)}</Text>
            {item.paraf ? (
              <Text style={styles.paraf} numberOfLines={2}>
                {item.paraf}
              </Text>
            ) : null}
            <Text style={styles.date}>{formatDateFa(item.createdAt)}</Text>
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
    gap: 4,
  },
  unread: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  status: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.primaryDark,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  paraf: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 20,
  },
  date: {
    marginTop: 4,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
});
