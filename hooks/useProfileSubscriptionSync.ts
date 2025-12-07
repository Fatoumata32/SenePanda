import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';

export interface ProfileSubscription {
  subscription_plan: 'free' | 'starter' | 'pro' | 'premium';
  subscription_expires_at: string | null;
  is_active: boolean;
  days_remaining: number | null;
}

export interface UseProfileSubscriptionSyncReturn {
  subscription: ProfileSubscription | null;
  isLoading: boolean;
  isActive: boolean;
  daysRemaining: number | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour synchroniser en temps réel l'abonnement depuis le profil
 * Écoute les changements de subscription_plan et subscription_expires_at
 */
export function useProfileSubscriptionSync(userId?: string): UseProfileSubscriptionSyncReturn {
  const [subscription, setSubscription] = useState<ProfileSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Fonction pour calculer si l'abonnement est actif
  const calculateIsActive = (plan: string, expiresAt: string | null): boolean => {
    if (plan === 'free') return true;
    if (!expiresAt) return false;
    return new Date(expiresAt) > new Date();
  };

  // Fonction pour calculer les jours restants
  const calculateDaysRemaining = (plan: string, expiresAt: string | null): number | null => {
    if (plan === 'free' || !expiresAt) return null;

    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // Fonction pour récupérer l'abonnement depuis le profil
  const fetchSubscription = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_expires_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erreur récupération abonnement:', error);
        setSubscription(null);
        setIsActive(false);
        setDaysRemaining(null);
        return;
      }

      if (data) {
        const plan = data.subscription_plan || 'free';
        const expiresAt = data.subscription_expires_at;
        const active = calculateIsActive(plan, expiresAt);
        const days = calculateDaysRemaining(plan, expiresAt);

        const sub: ProfileSubscription = {
          subscription_plan: plan as any,
          subscription_expires_at: expiresAt,
          is_active: active,
          days_remaining: days,
        };

        console.log('✅ Abonnement synchronisé:', {
          plan,
          active,
          days,
          expires: expiresAt
        });

        setSubscription(sub);
        setIsActive(active);
        setDaysRemaining(days);
      }
    } catch (error: any) {
      console.error('❌ Erreur fetchSubscription:', error);
      setSubscription(null);
      setIsActive(false);
      setDaysRemaining(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction refresh exposée
  const refresh = async () => {
    console.log('🔄 Refresh manuel de l\'abonnement');
    await fetchSubscription();
  };

  // Charger au montage
  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtimeListener = () => {
      try {
        console.log('🔔 Configuration écoute temps réel pour:', userId);

        // Nettoyer l'ancien canal
        if (channel) {
          supabase.removeChannel(channel);
        }

        const channelName = `profile-subscription-${userId}-${Date.now()}`;

        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${userId}`,
            },
            async (payload) => {
              console.log('📡 Changement détecté dans profiles');

              const oldData = payload.old;
              const newData = payload.new;

              // Vérifier si les colonnes d'abonnement ont changé
              const planChanged = oldData?.subscription_plan !== newData?.subscription_plan;
              const expiresChanged = oldData?.subscription_expires_at !== newData?.subscription_expires_at;

              if (planChanged || expiresChanged) {
                console.log('⚡ Abonnement modifié, synchronisation...', {
                  oldPlan: oldData?.subscription_plan,
                  newPlan: newData?.subscription_plan,
                  oldExpires: oldData?.subscription_expires_at,
                  newExpires: newData?.subscription_expires_at
                });

                // Mettre à jour immédiatement les états locaux
                const plan = newData?.subscription_plan || 'free';
                const expiresAt = newData?.subscription_expires_at;
                const active = calculateIsActive(plan, expiresAt);
                const days = calculateDaysRemaining(plan, expiresAt);

                const sub: ProfileSubscription = {
                  subscription_plan: plan,
                  subscription_expires_at: expiresAt,
                  is_active: active,
                  days_remaining: days,
                };

                setSubscription(sub);
                setIsActive(active);
                setDaysRemaining(days);

                // Rafraîchir depuis la base pour être sûr
                await fetchSubscription();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Écoute temps réel activée');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('⚠️ Écoute temps réel non disponible');
            }
          });
      } catch (error) {
        console.warn('⚠️ Erreur setup realtime:', error);
      }
    };

    // Écouter les changements d'état de l'app
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        console.log('📱 App au premier plan, refresh abonnement');
        fetchSubscription();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Démarrer l'écoute
    setupRealtimeListener();

    // Cleanup
    return () => {
      appStateSub.remove();

      if (channel) {
        try {
          supabase.removeChannel(channel);
          console.log('🔕 Canal temps réel fermé');
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
      }
    };
  }, [userId]);

  return {
    subscription,
    isLoading,
    isActive,
    daysRemaining,
    refresh,
  };
}
