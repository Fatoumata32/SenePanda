import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@senepanda_onboarding_completed';

interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  shouldShowModal: boolean;
  isLoading: boolean;
}

/**
 * Hook pour gérer le flux d'onboarding
 *
 * Fonctionnalités :
 * - Détecte si c'est la première connexion
 * - Gère l'affichage du modal d'onboarding
 * - Sauvegarde le statut dans AsyncStorage
 *
 * @example
 * const { shouldShowModal, completeOnboarding } = useOnboarding();
 *
 * return (
 *   <OnboardingSubscriptionModal
 *     visible={shouldShowModal}
 *     onBecomeSeller={completeOnboarding}
 *     onSkip={completeOnboarding}
 *   />
 * );
 */
export function useOnboarding(): {
  hasCompletedOnboarding: boolean;
  shouldShowModal: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
} {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  /**
   * Vérifie si l'utilisateur a déjà complété l'onboarding
   */
  const checkOnboardingStatus = async () => {
    try {
      setIsLoading(true);

      // Vérifier dans AsyncStorage
      const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
      const storedValue = stored ? JSON.parse(stored) : null;

      if (storedValue?.completed) {
        setHasCompletedOnboarding(true);
        setShouldShowModal(false);
        return;
      }

      // Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setHasCompletedOnboarding(true);
        setShouldShowModal(false);
        return;
      }

      // Vérifier si c'est une nouvelle inscription (created_at récent)
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setHasCompletedOnboarding(true);
        setShouldShowModal(false);
        return;
      }

      // Si le profil a été créé il y a moins de 5 minutes, c'est une nouvelle inscription
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      const isNewUser = diffMinutes < 5;

      if (isNewUser && !storedValue?.completed) {
        // Nouveau utilisateur qui n'a pas complété l'onboarding
        setHasCompletedOnboarding(false);
        setShouldShowModal(true);
      } else {
        setHasCompletedOnboarding(true);
        setShouldShowModal(false);
      }
    } catch (error) {
      console.error('Erreur vérification onboarding:', error);
      setHasCompletedOnboarding(true);
      setShouldShowModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Marquer l'onboarding comme complété
   */
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_KEY,
        JSON.stringify({
          completed: true,
          completedAt: new Date().toISOString(),
        })
      );

      setHasCompletedOnboarding(true);
      setShouldShowModal(false);
    } catch (error) {
      console.error('Erreur sauvegarde onboarding:', error);
    }
  };

  /**
   * Réinitialiser l'onboarding (pour tests)
   */
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(false);
      setShouldShowModal(true);
    } catch (error) {
      console.error('Erreur reset onboarding:', error);
    }
  };

  return {
    hasCompletedOnboarding,
    shouldShowModal,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}

/**
 * Utilitaire pour vérifier si l'utilisateur a choisi d'être vendeur
 */
export async function hasChosenSellerRole(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, subscription_plan')
      .eq('id', userId)
      .single();

    return data?.role === 'seller' || data?.subscription_plan !== 'free';
  } catch (error) {
    console.error('Erreur vérification rôle:', error);
    return false;
  }
}
