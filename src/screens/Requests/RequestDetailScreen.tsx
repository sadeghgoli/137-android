import React, { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
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
import { getRequestById } from '../../services/requestService';
import type { CitizenRequest } from '../../types/domain';
import { formatDateFa, statusLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

export function RequestDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<CitizenRequest | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setRequest(await getRequestById(route.params.requestId));
      })();
    }, [route.params.requestId]),
  );

  if (!request) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader
          title={Strings.requestDetail.title}
          onBack={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={Strings.requestDetail.title}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenHorizontal,
          paddingBottom: insets.bottom + Spacing.xl,
          gap: Spacing.lg,
        }}
      >
        <View style={styles.card}>
          <Text style={styles.code}>{request.trackingCode}</Text>
          <Text style={styles.status}>
            {statusLabel(request.status, request.apiStatus)}
          </Text>
          <InfoRow label={Strings.requestDetail.date} value={formatDateFa(request.createdAt)} />
          <InfoRow label={Strings.requestDetail.source} value={SOURCE_LABELS[request.source]} />
          <InfoRow
            label={Strings.requestDetail.location}
            value={request.addressLabel ?? '—'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.requestDetail.description}</Text>
          <Text style={styles.body}>{request.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.requestDetail.attachments}</Text>
          {request.attachments.length === 0 ? (
            <Text style={styles.muted}>{Strings.requestDetail.noAttachments}</Text>
          ) : (
            <View style={styles.attachRow}>
              {request.attachments.map((file) => (
                <Image key={file.id} source={{ uri: file.uri }} style={styles.thumb} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.requestDetail.history}</Text>
          {request.history
            .slice()
            .reverse()
            .map((item, index) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < request.history.length - 1 ? (
                  <View style={styles.timelineLine} />
                ) : null}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineStatus}>
                    {statusLabel(item.status)}
                  </Text>
                  {item.paraf ? (
                    <Text style={styles.timelineParaf}>{item.paraf}</Text>
                  ) : null}
                  <Text style={styles.timelineDate}>{formatDateFa(item.createdAt)}</Text>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  code: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  status: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: Spacing.sm,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  infoValue: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  muted: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  attachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  timelineItem: {
    paddingStart: 18,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    start: 0,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    position: 'absolute',
    start: 4,
    top: 16,
    bottom: -Spacing.md,
    width: 2,
    backgroundColor: Colors.borderLight,
  },
  timelineContent: {
    gap: 2,
  },
  timelineTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  timelineStatus: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.primaryDark,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  timelineParaf: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 20,
  },
  timelineDate: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
});
