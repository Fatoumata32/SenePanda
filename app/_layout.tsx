import { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PandaLogo from '@/components/PandaLogo';
import { AuthProvider } from '@/providers/AuthProvider';
import { FirebaseProvider } from '@/providers/FirebaseProvider';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { CoinsProvider } from '@/contexts/CoinsContext';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RoleRedirect } from '@/components/RoleRedirect';
import { Colors } from '@/constants/Colors';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import OnboardingScreen, { ONBOARDING_COMPLETED_KEY } from '@/components/OnboardingScreen';
import OfflineBanner from '@/components/OfflineBanner';
import SubscriptionNotificationListener from '@/components/SubscriptionNotificationListener';
import DailyLoginTracker from '@/components/DailyLoginTracker';
import CoinNotificationToast from '@/components/rewards/CoinNotificationToast';
import { OnboardingTooltip } from '@/components/onboarding';

export default function RootLayout() {
  useFrameworkReady();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      setShowOnboarding(!completed);
    } catch (error) {
      console.error('Error checking onboarding:', error);
    } finally {
      setOnboardingChecked(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  useEffect(() => {
    // Start animation immediately
    Animated.sequence([
      // Scale and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Slight rotation bounce
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(400),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplash(false);
    });
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate },
              ],
            },
          ]}>
          <PandaLogo size="large" showText={true} />
        </Animated.View>
        <StatusBar style="dark" />
      </View>
    );
  }

  // Show onboarding for new users
  if (onboardingChecked && showOnboarding) {
    return (
      <>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FirebaseProvider>
          <AuthProvider>
            <CoinsProvider>
              <NavigationProvider>
                <CartProvider>
                  <NotificationProvider>
                    <ToastProvider>
                      <OnboardingProvider>
                        <AuthGuard>
                          <RoleRedirect>
                            <Stack screenOptions={{ headerShown: false }} />
                            <PrivacyPolicyModal />
                            <OfflineBanner />
                            <SubscriptionNotificationListener />
                            <DailyLoginTracker />
                            <CoinNotificationToast />
                            <OnboardingTooltip />
                            <StatusBar style="auto" />
                          </RoleRedirect>
                        </AuthGuard>
                      </OnboardingProvider>
                    </ToastProvider>
                  </NotificationProvider>
                </CartProvider>
              </NavigationProvider>
            </CoinsProvider>
          </AuthProvider>
        </FirebaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
