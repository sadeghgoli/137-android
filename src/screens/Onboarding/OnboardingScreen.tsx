import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OnboardingSlide,
  OnboardingSlideData,
  PrimaryButton,
  ProgressIndicator,
} from '../../components';
import { Colors, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { setOnboardingCompleted } from '../../services/onboardingStorage';
import { onboardingSteps } from './onboardingData';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingSlideData>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === onboardingSteps.length - 1;

  const footerReserve = 120;
  const slideHeight = useMemo(
    () =>
      height -
      insets.top -
      insets.bottom -
      Spacing.md -
      Spacing.sm -
      footerReserve -
      Spacing.md,
    [height, insets.bottom, insets.top],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== index) {
        setIndex(next);
      }
    },
    [index, width],
  );

  const goNext = useCallback(async () => {
    if (!isLast) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
      return;
    }

    await setOnboardingCompleted();
    navigation.replace('SetupLocation');
  }, [index, isLast, navigation]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.md,
          paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm,
        },
      ]}
    >
      <StatusBar style="dark" />

      <FlatList
        ref={listRef}
        data={onboardingSteps}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.list}
        renderItem={({ item }) => (
          <OnboardingSlide item={item} width={width} height={slideHeight} />
        )}
        onMomentumScrollEnd={handleScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
      />

      <View style={styles.footer}>
        <ProgressIndicator
          total={onboardingSteps.length}
          activeIndex={index}
        />

        <View style={styles.ctaSlot}>
          {isLast ? (
            <PrimaryButton
              label={Strings.onboarding.getStarted}
              onPress={goNext}
              accessibilityLabel={Strings.onboarding.getStartedAccessibility}
              style={styles.cta}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    flexGrow: 0,
  },
  footer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
    justifyContent: 'flex-end',
  },
  ctaSlot: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    minWidth: 200,
  },
});
