import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components';
import {
  Colors,
  Fonts,
  Radius,
  Spacing,
  Strings,
} from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { addNotification } from '../../services/notificationService';
import { createRequest } from '../../services/requestService';
import { ApiError } from '../../services/apiClient';
import type { RequestAttachment } from '../../types/domain';

type Props = NativeStackScreenProps<RootStackParamList, 'NewRequest'>;

export function NewRequestScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(Strings.common.error, 'دسترسی به گالری لازم است.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        uri: asset.uri,
        name: asset.fileName ?? 'پیوست.jpg',
        mimeType: asset.mimeType,
      },
    ]);
  };

  const submit = async () => {
    if (!description.trim()) {
      Alert.alert(Strings.common.error, Strings.requestForm.descriptionRequired);
      return;
    }

    setLoading(true);
    try {
      const request = await createRequest({
        description,
        coordinate: {
          latitude: route.params.latitude,
          longitude: route.params.longitude,
        },
        addressLabel: route.params.addressLabel,
        attachments,
      });

      await addNotification({
        requestId: request.id,
        title: request.title,
        status: request.status,
        paraf: 'درخواست شما ثبت شد و در صف بررسی قرار گرفت.',
      });

      navigation.replace('RequestSuccess', {
        trackingCode: request.trackingCode,
        requestId: request.id,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : Strings.common.error;
      Alert.alert(Strings.common.error, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.md,
          paddingBottom: Math.max(insets.bottom, Spacing.lg),
        },
      ]}
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{Strings.requestForm.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {route.params.addressLabel ? (
          <>
            <Text style={styles.label}>{Strings.requestForm.selectedAddressLabel}</Text>
            <Text style={styles.addressValue}>{route.params.addressLabel}</Text>
          </>
        ) : null}

        <Text style={styles.label}>{Strings.requestForm.descriptionLabel}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={Strings.requestForm.descriptionPlaceholder}
          placeholderTextColor={Colors.textMuted}
          style={styles.textarea}
          multiline
          textAlign="right"
          textAlignVertical="top"
        />

        <Text style={styles.label}>{Strings.requestForm.attachments}</Text>
        <Pressable style={styles.attachButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={20} color={Colors.primaryDark} />
          <Text style={styles.attachText}>{Strings.requestForm.addAttachment}</Text>
        </Pressable>

        <View style={styles.attachList}>
          {attachments.map((item) => (
            <View key={item.id} style={styles.attachItem}>
              <Image source={{ uri: item.uri }} style={styles.thumb} />
              <Text style={styles.attachName} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable
                onPress={() =>
                  setAttachments((prev) => prev.filter((a) => a.id !== item.id))
                }
              >
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={Strings.requestForm.submit}
          onPress={submit}
          loading={loading}
          style={styles.cta}
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
  header: {
    paddingHorizontal: Spacing.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  addressValue: {
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    padding: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 22,
  },
  textarea: {
    minHeight: 140,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    padding: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  attachText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.primaryDark,
    writingDirection: 'rtl',
  },
  attachList: {
    gap: Spacing.sm,
  },
  attachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  attachName: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
  },
  footer: {
    paddingHorizontal: Spacing.screenHorizontal,
  },
  cta: {
    width: '100%',
    alignSelf: 'stretch',
  },
});
