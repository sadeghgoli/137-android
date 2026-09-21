import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images } from '../../assets';
import {
  HomeMap,
  type HomeMapHandle,
  type MapRegion,
} from '../../components/map/HomeMap';
import {
  Colors,
  DEFAULT_MAP_REGION,
  Fonts,
  Radius,
  Spacing,
  Strings,
} from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { getUnreadCount } from '../../services/notificationService';
import { getMapRequests } from '../../services/requestService';
import {
  resolveMapSelection,
  type ResolvedMapLocation,
} from '../../services/geocodingService';
import type { CitizenRequest, MapCoordinate } from '../../types/domain';
import { createShadow } from '../../utils/shadow';
import { statusLabel } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<HomeMapHandle>(null);
  const [region] = useState<MapRegion>(DEFAULT_MAP_REGION);
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [unread, setUnread] = useState(0);
  const [selected, setSelected] = useState<ResolvedMapLocation | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [preview, setPreview] = useState<CitizenRequest | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const [mapRequests, count] = await Promise.all([
            getMapRequests(),
            getUnreadCount(),
          ]);
          setRequests(mapRequests);
          setUnread(count);
        } catch {
          setRequests([]);
          setUnread(0);
        }
      })();
    }, []),
  );

  const handleMapPress = (coordinate: MapCoordinate) => {
    setPreview(null);
    setSelected(null);
    setResolvingLocation(true);

    void (async () => {
      try {
        const resolved = await resolveMapSelection(coordinate);
        setSelected(resolved);
      } catch {
        setSelected({
          coordinate,
          addressLabel: Strings.home.addressUnavailable,
        });
      } finally {
        setResolvingLocation(false);
      }
    })();
  };

  const handleRequestPress = (request: CitizenRequest) => {
    setSelected(null);
    setPreview(request);
  };

  const openNewRequest = () => {
    if (!selected) {
      return;
    }
    navigation.navigate('NewRequest', {
      latitude: selected.coordinate.latitude,
      longitude: selected.coordinate.longitude,
      addressLabel: selected.addressLabel,
    });
    setSelected(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <HomeMap
        ref={mapRef}
        region={region}
        requests={requests}
        selectedCoordinate={selected?.coordinate ?? null}
        onMapPress={handleMapPress}
        onRequestPress={handleRequestPress}
      />

      <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.notificationsAccessibility}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '۹+' : String(unread)}</Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.topSpacer} />

        <Pressable
          style={styles.avatarButton}
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel={Strings.home.profileAccessibility}
        >
          <Image source={Images.user1} style={styles.avatarImage} />
        </Pressable>
      </View>

      <Pressable
        style={[
          styles.recenter,
          { bottom: 200 + Math.max(insets.bottom, Spacing.sm) },
        ]}
        onPress={() => mapRef.current?.animateToRegion(region, 400)}
        accessibilityRole="button"
        accessibilityLabel={Strings.home.recenterAccessibility}
      >
        <Ionicons name="locate" size={22} color={Colors.textPrimary} />
      </Pressable>

      <View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) },
        ]}
      >
        {preview ? (
          <Pressable
            style={styles.previewCard}
            onPress={() =>
              navigation.navigate('RequestDetail', { requestId: preview.id })
            }
          >
            <Text style={styles.previewTitle}>{preview.title}</Text>
            <Text style={styles.previewMeta}>
              {preview.trackingCode} · {statusLabel(preview.status, preview.apiStatus)}
            </Text>
            <Text style={styles.previewLink}>{Strings.home.requestSummary}</Text>
          </Pressable>
        ) : resolvingLocation ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{Strings.home.selectedAddress}</Text>
            <View style={styles.resolvingRow}>
              <ActivityIndicator size="small" color={Colors.primaryDark} />
              <Text style={styles.previewMeta}>{Strings.home.resolvingLocation}</Text>
            </View>
          </View>
        ) : selected ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{Strings.home.selectedAddress}</Text>
            <Text style={styles.previewMeta}>{selected.addressLabel}</Text>
            <Pressable style={styles.primaryChip} onPress={openNewRequest}>
              <Text style={styles.primaryChipText}>{Strings.requestForm.title}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hint}>{Strings.home.newRequestHint}</Text>
        )}

        <Pressable
          style={styles.requestsButton}
          onPress={() => navigation.navigate('MyRequests')}
        >
          <Ionicons name="list" size={18} color={Colors.primaryDark} />
          <Text style={styles.requestsButtonText}>{Strings.home.myRequests}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.illustrationBackground,
  },
  topBar: {
    position: 'absolute',
    start: Spacing.screenHorizontal,
    end: Spacing.screenHorizontal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  topSpacer: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ offsetY: 2, blur: 6, opacity: 0.12, elevation: 4 }),
  },
  badge: {
    position: 'absolute',
    top: 4,
    end: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: Fonts.bold,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.white,
    ...createShadow({ offsetY: 2, blur: 6, opacity: 0.15, elevation: 4 }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  recenter: {
    position: 'absolute',
    start: Spacing.screenHorizontal,
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ offsetY: 2, blur: 6, opacity: 0.12, elevation: 4 }),
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.md,
    ...createShadow({ offsetY: -2, blur: 12, opacity: 0.12, elevation: 12 }),
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  previewCard: {
    gap: Spacing.xs,
  },
  previewTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  previewMeta: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
    textAlign: 'left',
    flex: 1,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewLink: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.primaryDark,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  primaryChip: {
    marginTop: Spacing.sm,
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryChipText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  requestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
  },
  requestsButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
});
