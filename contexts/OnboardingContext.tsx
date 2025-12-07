import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // ID of the element to highlight
  screen: string;
  position?: 'top' | 'bottom' | 'center';
  action?: string; // Optional action text
  order: number;
}

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  currentStep: OnboardingStep | null;
  currentStepIndex: number;
  totalSteps: number;
  isActive: boolean;
  startOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setActiveScreen: (screen: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = '@onboarding_completed';

// Define all onboarding steps
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur SenePanda! 👋',
    description: 'Découvrez toutes les fonctionnalités de votre marketplace préférée',
    screen: 'home',
    position: 'center',
    order: 0,
  },
  {
    id: 'search',
    title: 'Recherche intelligente 🔍',
    description: 'Utilisez la recherche vocale ou par texte pour trouver vos produits',
    target: 'search-bar',
    screen: 'home',
    position: 'top',
    order: 1,
  },
  {
    id: 'categories',
    title: 'Explorer les catégories 📦',
    description: 'Parcourez nos catégories pour découvrir des milliers de produits',
    target: 'categories-section',
    screen: 'home',
    position: 'top',
    order: 2,
  },
  {
    id: 'flash-sales',
    title: 'Ventes Flash ⚡',
    description: 'Ne manquez pas nos offres limitées avec des réductions incroyables',
    target: 'flash-sales',
    screen: 'home',
    position: 'top',
    order: 3,
  },
  {
    id: 'favorites',
    title: 'Vos Favoris ❤️',
    description: 'Sauvegardez vos produits préférés pour les retrouver facilement',
    target: 'favorites-tab',
    screen: 'favorites',
    position: 'bottom',
    order: 4,
  },
  {
    id: 'cart',
    title: 'Panier & Commandes 🛒',
    description: 'Gérez votre panier et suivez vos commandes en temps réel',
    target: 'cart-tab',
    screen: 'cart',
    position: 'bottom',
    order: 5,
  },
  {
    id: 'profile',
    title: 'Votre Profil 👤',
    description: 'Accédez à vos informations, points de fidélité et paramètres',
    target: 'profile-tab',
    screen: 'profile',
    position: 'bottom',
    order: 6,
  },
  {
    id: 'points',
    title: 'Programme de Fidélité 🎁',
    description: 'Gagnez des points à chaque achat et échangez-les contre des récompenses',
    target: 'points-section',
    screen: 'profile',
    position: 'top',
    order: 7,
  },
  {
    id: 'referral',
    title: 'Parrainage 🤝',
    description: 'Invitez vos amis et gagnez des points pour chaque parrainage',
    target: 'referral-section',
    screen: 'profile',
    position: 'top',
    order: 8,
  },
  {
    id: 'seller',
    title: 'Devenir Vendeur 🏪',
    description: 'Créez votre boutique et vendez vos produits en quelques clics',
    target: 'seller-section',
    screen: 'profile',
    position: 'top',
    order: 9,
  },
  {
    id: 'complete',
    title: 'C\'est parti! 🚀',
    description: 'Vous êtes prêt à profiter de toutes les fonctionnalités. Bon shopping!',
    screen: 'home',
    position: 'center',
    order: 10,
  },
];

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      console.log('[OnboardingContext] 📝 Onboarding status in storage:', value);
      setIsOnboardingComplete(value === 'true');

      // Auto-start onboarding if not completed
      if (value !== 'true') {
        console.log('[OnboardingContext] ⏱️ Auto-starting in 1s...');
        setTimeout(() => {
          startOnboarding();
        }, 1000);
      } else {
        console.log('[OnboardingContext] ✅ Onboarding already completed');
      }
    } catch (error) {
      console.error('[OnboardingContext] ❌ Error checking onboarding status:', error);
    }
  };

  const startOnboarding = () => {
    console.log('[OnboardingContext] 🚀 Starting onboarding...');
    setCurrentStepIndex(0);
    setIsActive(true);
    console.log('[OnboardingContext] ✅ Onboarding started, isActive:', true);
  };

  const nextStep = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const skipOnboarding = async () => {
    setIsActive(false);
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsOnboardingComplete(true);
      setIsActive(false);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setIsOnboardingComplete(false);
      setCurrentStepIndex(0);
      setIsActive(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const currentStep = isActive ? ONBOARDING_STEPS[currentStepIndex] : null;

  // Auto-navigate to the screen when step changes
  useEffect(() => {
    if (currentStep && currentStep.screen !== activeScreen) {
      // This will be handled by the components listening to this context
    }
  }, [currentStep]);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        currentStep,
        currentStepIndex,
        totalSteps: ONBOARDING_STEPS.length,
        isActive,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
        setActiveScreen,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
