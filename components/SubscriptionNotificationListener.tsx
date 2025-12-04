import { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as Speech from 'expo-speech';

// Variable globale pour éviter les doublons entre re-renders
let globalChannelActive = false;
let globalUserId: string | null = null;

/**
 * Composant invisible qui écoute les changements d'abonnement en temps réel
 * et affiche une notification quand l'admin valide un abonnement
 *
 * À placer dans le layout principal de l'app
 */
export default function SubscriptionNotificationListener() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const authSubRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Éviter les configurations multiples via variable globale
    if (globalChannelActive) {
      console.log('⏭️ [SubListener] Canal global déjà actif');
      return;
    }

    const setupListener = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.log('⏭️ [SubListener] Pas d\'utilisateur connecté');
          return;
        }

        // Même utilisateur avec canal actif
        if (globalUserId === user.id && globalChannelActive) {
          return;
        }

        globalUserId = user.id;
        globalChannelActive = true;

        console.log('🔔 [SubListener] Setup pour:', user.id.substring(0, 8));

        // Créer le canal
        const channel = supabase
          .channel(`subscription-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              const oldData = payload.old as any;
              const newData = payload.new as any;

              const oldStatus = oldData?.subscription_status;
              const newStatus = newData?.subscription_status;
              const newPlan = newData?.subscription_plan;

              console.log(`📊 [SubListener] ${oldStatus} → ${newStatus}`);

              // Notification si abonnement validé
              if (oldStatus === 'pending' && newStatus === 'active') {
                const planName = newPlan?.toUpperCase() || 'ABONNEMENT';
                console.log('🎉 ABONNEMENT VALIDÉ:', planName);

                try {
                  Speech.speak(
                    `Félicitations! Votre abonnement ${planName} a été validé!`,
                    { language: 'fr-FR', rate: 0.9 }
                  );
                } catch (e) {}

                Alert.alert(
                  '🎉 Abonnement Validé !',
                  `Votre abonnement "${planName}" a été approuvé.\n\nProfitez de tous vos avantages !`,
                  [{ text: 'Super !', style: 'default' }]
                );
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ [SubListener] Canal activé');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              // Ne pas utiliser console.error pour éviter l'affichage d'erreur visible
              console.warn('⚠️ [SubListener] Canal non disponible - mode dégradé');
              globalChannelActive = false;
            } else if (status === 'CLOSED') {
              globalChannelActive = false;
            }
          });

        channelRef.current = channel;
      } catch (error) {
        // Erreur silencieuse - pas de console.error pour ne pas afficher d'erreur visible
        console.warn('⚠️ [SubListener] Canal non disponible, sera réessayé');
        globalChannelActive = false;
      }
    };

    setupListener();

    // Écouter les changements d'état de l'app pour reconnecter
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && !globalChannelActive) {
        console.log('📱 [SubListener] App active, reconnexion...');
        setupListener();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          globalChannelActive = false;
          globalUserId = null;
          if (channelRef.current) {
            await supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          if (globalUserId !== session.user.id) {
            globalChannelActive = false;
            if (channelRef.current) {
              await supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            setupListener();
          }
        }
      }
    );

    authSubRef.current = subscription;

    // Cleanup - NE PAS fermer le canal globalement
    return () => {
      appStateSub.remove();
      // Note: On ne ferme PAS le canal ici car il doit rester actif
      // Il sera fermé uniquement lors du SIGNED_OUT
    };
  }, []);

  return null;
}
