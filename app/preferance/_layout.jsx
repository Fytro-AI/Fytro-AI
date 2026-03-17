import { Slot } from 'expo-router';
import { OnboardingProvider } from '../../context/OnboardingContext';

export default function Layout() {

  return (
    <OnboardingProvider>
      <Slot />
    </OnboardingProvider>
  );
}
