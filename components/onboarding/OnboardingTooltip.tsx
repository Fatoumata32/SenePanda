import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Colors, Gradients } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingTooltipProps {
  targetRef?: React.RefObject<View>;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({ targetRef }) => {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipOnboarding,
    isActive,
  } = useOnboarding();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive && currentStep) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for spotlight
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive, currentStep]);

  if (!isActive || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isCenterPosition = currentStep.position === 'center';

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Dark overlay */}
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.85],
              }),
            },
          ]}
        />

        {/* Spotlight effect */}
        {currentStep.target && (
          <Animated.View
            style={[
              styles.spotlight,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}

        {/* Tooltip content */}
        <Animated.View
          style={[
            styles.tooltipContainer,
            isCenterPosition && styles.tooltipCenterContainer,
            currentStep.position === 'top' && styles.tooltipTopContainer,
            currentStep.position === 'bottom' && styles.tooltipBottomContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={Gradients.goldOrange.colors}
            start={Gradients.goldOrange.start}
            end={Gradients.goldOrange.end}
            style={styles.tooltipGradient}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={skipOnboarding}
              accessibilityLabel="Fermer le guide"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              {/* Step indicator */}
              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>
                  {currentStepIndex + 1} / {totalSteps}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{currentStep.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{currentStep.description}</Text>

              {/* Progress dots */}
              <View style={styles.dotsContainer}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentStepIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Action buttons */}
              <View style={styles.buttonsContainer}>
                {!isFirstStep && (
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={previousStep}
                    accessibilityLabel="Étape précédente"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                    <Text style={styles.secondaryButtonText}>Précédent</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, styles.skipButton]}
                  onPress={skipOnboarding}
                  accessibilityLabel="Passer le guide"
                  accessibilityRole="button"
                >
                  <Text style={styles.skipButtonText}>Passer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={nextStep}
                  accessibilityLabel={isLastStep ? "Terminer le guide" : "Étape suivante"}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>
                    {isLastStep ? 'Terminer' : 'Suivant'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  spotlight: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: Colors.white,
    opacity: 0.3,
  },
  tooltipContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  tooltipCenterContainer: {
    top: SCREEN_HEIGHT / 2 - 200,
  },
  tooltipTopContainer: {
    top: 120,
  },
  tooltipBottomContainer: {
    bottom: 120,
  },
  tooltipGradient: {
    padding: 24,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: {
    alignItems: 'center',
  },
  stepIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  stepText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.white,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
  },
  secondaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});
