import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Spacing, Typography } from '../constants';

export type OnboardingSlideData = {
  image: ImageSourcePropType;
  title: string;
  description: string;
};

type OnboardingSlideProps = {
  item: OnboardingSlideData;
  width: number;
  height: number;
};

export function OnboardingSlide({
  item,
  width,
  height,
}: OnboardingSlideProps) {
  const illustrationSize = Math.min(width * 0.72, height * 0.52, 300);

  return (
    <View style={[styles.slide, { width, height }]}>
      <View style={styles.illustrationWrap}>
        <Image
          source={item.image}
          style={{ width: illustrationSize, height: illustrationSize }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessible={false}
          importantForAccessibility="no"
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
  },
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  textBlock: {
    paddingBottom: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    paddingHorizontal: Spacing.sm,
  },
});
