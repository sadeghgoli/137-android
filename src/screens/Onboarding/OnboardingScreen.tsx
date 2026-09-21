import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OnboardingSlide,
  OnboardingSlideData,
  PrimaryButton,
  ProgressIndicator,
} from '../../components';
import { Colors, Fonts, Spacing, Strings } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { completeOnboarding } from '../../services/onboardingStorage';
import { onboardingSteps } from './onboardingData';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingSlideData>>(null);
  const [index, setIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isLast = index === onboardingSteps.length - 1;

  const footerReserve = 160;
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

  const finish = useCallback(async () => {
    await completeOnboarding(dontShowAgain);
    navigation.replace('Login');
  }, [dontShowAgain, navigation]);

  const goNext = useCallback(async () => {
    if (!isLast) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
      return;
    }
    await finish();
  }, [finish, index, isLast]);

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

      {/* Force LTR so Android RTL does not reverse slide order. */}
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

        {isLast ? (
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setDontShowAgain((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: dontShowAgain }}
          >
            <Ionicons
              name={dontShowAgain ? 'checkbox' : 'square-outline'}
              size={22}
              color={Colors.primaryDark}
            />
            <Text style={styles.checkboxLabel}>
              {Strings.onboarding.dontShowAgain}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.checkboxSpacer} />
        )}

        <PrimaryButton
          label={isLast ? Strings.onboarding.enter : Strings.onboarding.next}
          onPress={goNext}
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
  list: {
    flexGrow: 0,
  },
  footer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 28,
    justifyContent: 'center',
  },
  checkboxSpacer: {
    minHeight: 28,
  },
  checkboxLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    writingDirection: 'rtl',
  },
  cta: {
    minWidth: 200,
    alignSelf: 'stretch',
    width: '100%',
  },
});
