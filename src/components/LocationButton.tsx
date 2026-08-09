import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, Typography } from '../constants';

type LocationButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function LocationButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: LocationButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <View style={styles.content}>
          <Ionicons
            name="navigate"
            size={18}
            color={Colors.primary}
            style={styles.icon}
          />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginEnd: Spacing.sm,
  },
  label: {
    ...Typography.button,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: Colors.illustrationBackground,
  },
  disabled: {
    opacity: 0.55,
  },
});
