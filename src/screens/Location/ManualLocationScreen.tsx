import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Strings, Typography } from '../../constants';

/**
 * Placeholder for Phase 2 — manual map/location selection UI.
 * Keep this route stable so navigation architecture does not change later.
 */
export function ManualLocationScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.lg,
        },
      ]}
      accessibilityLabel={Strings.manualLocation.accessibility}
    >
      <StatusBar style="dark" />
      <Text style={styles.title}>{Strings.manualLocation.title}</Text>
      <Text style={styles.body}>{Strings.manualLocation.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  body: {
    ...Typography.body,
  },
});
