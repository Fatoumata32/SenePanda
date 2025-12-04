import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  SubscriptionPlanType,
  SubscriptionStatus,
  hasSellerAccess,
  isShopVisible,
  getSubscriptionLimits,
  getSubscriptionStatus,
  SUBSCRIPTION_MESSAGES,
} from '@/utils/subscriptionAccess';

interface UseSubscriptionAccessReturn {
  loading: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  hasAccess: boolean;
  shopVisible: boolean;
  limits: ReturnType<typeof getSubscriptionLimits> | null;
  checkAccess: (showAlert?: boolean) => boolean;
  checkProductLimit: (currentProductCount: number, showAlert?: boolean) => boolean;
  redirectToPlans: () => void;
  refreshStatus: () => Promise<void>;
}

/**
 * Hook pour gérer l'accès basé sur l'abonnement
 * Inclut l'écoute en temps réel des changements d'abonnement
 */
export function useSubscriptionAccess(): UseSubscriptionAccessReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Charger l'ID utilisateur
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  // Charger le statut initial
  useEffect(() => {
    if (userId) {
      loadSubscriptionStatus();
    }
  }, [userId]);

  // Écoute en temps réel des changements d'abonnement
  useEffect(() => {
    if (!userId) return;

    console.log('🔔 [useSubscriptionAccess] Configuration écoute temps réel pour:', userId);

    // Créer le canal d'écoute
    const channel = supabase
      .channel(`subscription-access-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          console.log('✅ [useSubscriptionAccess] Changement détecté:', payload);

          const oldData = payload.old as any;
          const newData = payload.new as any;

          // Vérifier si l'abonnement a changé
          const planChanged = oldData?.subscription_plan !== newData?.subscription_plan;
          const statusChanged = oldData?.subscription_status !== newData?.subscription_status;
          const expiresChanged = oldData?.subscription_expires_at !== newData?.subscription_expires_at;

          if (planChanged || statusChanged || expiresChanged) {
            console.log('🔄 [useSubscriptionAccess] Mise à jour du statut d\'abonnement');

            // Mettre à jour le statut localement
            const status = getSubscriptionStatus(
              newData?.subscription_plan || 'free',
              newData?.subscription_expires_at || null
            );
            setSubscriptionStatus(status);
            // Note: La notification est gérée par SubscriptionNotificationListener
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [useSubscriptionAccess] Statut canal:', status);
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('🔇 [useSubscriptionAccess] Arrêt écoute temps réel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId]);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscriptionStatus(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_expires_at, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const status = getSubscriptionStatus(
        profile?.subscription_plan || 'free',
        profile?.subscription_expires_at || null
      );

      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setSubscriptionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    await loadSubscriptionStatus();
  };

  const hasAccess = subscriptionStatus
    ? hasSellerAccess(subscriptionStatus.plan, subscriptionStatus.expiresAt)
    : false;

  const shopVisible = subscriptionStatus
    ? isShopVisible(subscriptionStatus.plan, subscriptionStatus.expiresAt)
    : false;

  const limits = subscriptionStatus
    ? getSubscriptionLimits(subscriptionStatus.plan)
    : null;

  /**
   * Vérifie si l'utilisateur a accès aux fonctionnalités vendeur
   */
  const checkAccess = (showAlert: boolean = true): boolean => {
    if (!subscriptionStatus) return false;

    const access = hasSellerAccess(
      subscriptionStatus.plan,
      subscriptionStatus.expiresAt
    );

    if (!access && showAlert) {
      if (subscriptionStatus.plan === 'free') {
        Alert.alert(
          SUBSCRIPTION_MESSAGES.NO_ACCESS_TITLE,
          SUBSCRIPTION_MESSAGES.NO_ACCESS_MESSAGE,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Voir les plans',
              onPress: () => redirectToPlans(),
            },
          ]
        );
      } else {
        Alert.alert(
          SUBSCRIPTION_MESSAGES.EXPIRED_TITLE,
          SUBSCRIPTION_MESSAGES.EXPIRED_MESSAGE,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Renouveler',
              onPress: () => redirectToPlans(),
            },
          ]
        );
      }
    }

    return access;
  };

  /**
   * Vérifie si l'utilisateur peut ajouter plus de produits
   */
  const checkProductLimit = (
    currentProductCount: number,
    showAlert: boolean = true
  ): boolean => {
    if (!limits) return false;

    const canAdd = currentProductCount < limits.maxProducts;

    if (!canAdd && showAlert) {
      Alert.alert(
        SUBSCRIPTION_MESSAGES.MAX_PRODUCTS_TITLE,
        SUBSCRIPTION_MESSAGES.MAX_PRODUCTS_MESSAGE,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Voir les plans',
            onPress: () => redirectToPlans(),
          },
        ]
      );
    }

    return canAdd;
  };

  /**
   * Redirige vers la page des plans d'abonnement
   */
  const redirectToPlans = () => {
    router.push('/seller/subscription-plans');
  };

  return {
    loading,
    subscriptionStatus,
    hasAccess,
    shopVisible,
    limits,
    checkAccess,
    checkProductLimit,
    redirectToPlans,
    refreshStatus,
  };
}
