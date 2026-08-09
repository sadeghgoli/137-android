import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing, Strings } from '../constants';

type ProgressIndicatorProps = {
  total: number;
  activeIndex: number;
};

export function ProgressIndicator({
  total,
  activeIndex,
}: ProgressIndicatorProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={Strings.onboarding.stepAccessibility(
        activeIndex + 1,
        total,
      )}
    >
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 22,
    height: 4,
    borderRadius: Radius.pill,
  },
  active: {
    backgroundColor: Colors.primary,
  },
  inactive: {
    backgroundColor: Colors.progressInactive,
  },
});
