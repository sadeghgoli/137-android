import { Images } from '../../assets';
import type { OnboardingSlideData } from '../../components';
import { Strings } from '../../constants';

export const onboardingSteps: OnboardingSlideData[] =
  Strings.onboarding.steps.map((step, index) => ({
    image: [Images.step1, Images.step2, Images.step3][index],
    title: step.title,
    description: step.description,
  }));
