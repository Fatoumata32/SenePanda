import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';
// Note: Les notifications sont gérées par SubscriptionNotificationListener

// Variables globales pour éviter les problèmes de re-render
let globalSyncChannelActive = false;
let globalSyncUserId: string | null = null;

export interface SubscriptionStatus {
  id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  starts_at: string | null;
  ends_at: string | null;
  plan_name?: string;
  is_approved?: boolean;
}

export interface UseSubscriptionSyncReturn {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  isActive: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook pour synchroniser en temps réel le statut d'abonnement
 * Écoute les changements dans la table user_subscriptions
 * Affiche automatiquement une notification quand l'admin valide l'abonnement
 */
export function useSubscriptionSync(userId?: string): UseSubscriptionSyncReturn {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(false);

  // Fonction pour récupérer l'abonnement actuel
  const fetchSubscription = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Récupérer l'abonnement actif ou le plus récent
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          plan_id,
          status,
          starts_at,
          ends_at,
          is_approved,
          subscription_plans (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Si aucun abonnement trouvé, ce n'est pas une vraie erreur
        if (error.code === 'PGRST116') {
          setSubscription(null);
          setIsActive(false);
          return;
        }
        throw error;
      }

      if (data) {
        const sub: SubscriptionStatus = {
          id: data.id,
          plan_id: data.plan_id,
          status: data.status,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          is_approved: data.is_approved,
          plan_name: (data.subscription_plans as any)?.name,
        };

        setSubscription(sub);
        setIsActive(data.status === 'active' && data.is_approved === true);
      }
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction refresh exposée pour forcer une mise à jour
  const refresh = async () => {
    await fetchSubscription();
  };

  // Effet pour charger l'abonnement au montage
  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  // Effet pour écouter les changements en temps réel sur profiles
  useEffect(() => {
    if (!userId) return;

    // Éviter les doublons si déjà actif pour cet utilisateur
    if (globalSyncChannelActive && globalSyncUserId === userId) {
      console.log('🔄 [useSubscriptionSync] Canal déjà actif, skip');
      return;
    }

    let channel: RealtimeChannel | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const setupRealtimeListener = () => {
      // Ne pas réessayer si déjà actif
      if (globalSyncChannelActive && globalSyncUserId === userId) {
        return;
      }

      try {
        console.log('🔔 [useSubscriptionSync] Configuration de l\'écoute pour:', userId);

        // Nettoyer l'ancien canal si existant
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            // Ignorer les erreurs de nettoyage
          }
        }

        // Créer un nouveau canal avec un nom unique
        const channelName = `sync-profile-${userId}-${Date.now()}`;

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
              console.log('✅ [useSubscriptionSync] Changement détecté dans profiles');

              const oldData = payload.old;
              const newData = payload.new;

              const statusChanged = oldData?.subscription_status !== newData?.subscription_status;
              const planChanged = oldData?.subscription_plan !== newData?.subscription_plan;

              if (statusChanged || planChanged) {
                console.log('🔄 [useSubscriptionSync] Rafraîchissement...');
                await fetchSubscription();
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ [useSubscriptionSync] Écoute activée');
              globalSyncChannelActive = true;
              globalSyncUserId = userId;
              retryCount = 0; // Reset retry count on success
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              // Ne pas logger d'erreur visible à l'utilisateur, juste un warning
              console.warn('⚠️ [useSubscriptionSync] Canal non disponible, fonctionnement en mode polling');

              // Réessayer silencieusement après un délai
              if (retryCount < maxRetries) {
                retryCount++;
                const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
                console.log(`🔄 [useSubscriptionSync] Tentative ${retryCount}/${maxRetries} dans ${delay}ms`);

                retryTimeout = setTimeout(() => {
                  globalSyncChannelActive = false;
                  setupRealtimeListener();
                }, delay);
              } else {
                console.log('ℹ️ [useSubscriptionSync] Mode polling activé (realtime non disponible)');
                // En mode polling, rafraîchir toutes les 30 secondes
                startPollingFallback();
              }
            } else if (status === 'CLOSED') {
              globalSyncChannelActive = false;
              globalSyncUserId = null;
            }
          });
      } catch (error) {
        console.warn('⚠️ [useSubscriptionSync] Erreur setup canal:', error);
        // Fallback silencieux au polling
        startPollingFallback();
      }
    };

    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    const startPollingFallback = () => {
      // Polling fallback si realtime ne fonctionne pas
      if (pollingInterval) return;

      pollingInterval = setInterval(() => {
        fetchSubscription();
      }, 30000); // Toutes les 30 secondes
    };

    const stopPollingFallback = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    // Écouter les changements d'état de l'app
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // App revient au premier plan, rafraîchir
        fetchSubscription();

        // Réessayer la connexion realtime si elle était perdue
        if (!globalSyncChannelActive) {
          retryCount = 0;
          setupRealtimeListener();
        }
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Démarrer l'écoute
    setupRealtimeListener();

    // Cleanup
    return () => {
      appStateSub.remove();
      stopPollingFallback();

      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }

      // Note: On ne ferme pas le canal global ici pour éviter les boucles
      // Le canal sera réutilisé ou recréé si nécessaire
    };
  }, [userId]);

  return {
    subscription,
    isLoading,
    isActive,
    refresh,
  };
}
