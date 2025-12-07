import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingTooltip } from './OnboardingTooltip';

interface OnboardingWrapperProps {
  children: React.ReactNode;
  screenName: string;
}

/**
 * Wrapper component to manage onboarding state for a screen
 * Wrap your screen content with this component to enable onboarding
 */
export const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({
  children,
  screenName,
}) => {
  const { setActiveScreen, currentStep, isActive } = useOnboarding();

  useEffect(() => {
    // Notify the onboarding context about the active screen
    setActiveScreen(screenName);
  }, [screenName]);

  const shouldShowTooltip = isActive && currentStep?.screen === screenName;

  return (
    <View style={styles.container}>
      {children}
      {shouldShowTooltip && <OnboardingTooltip />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
