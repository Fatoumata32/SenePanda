import { useCallback, useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import { useFirebase } from '../providers/FirebaseProvider';
import { supabase } from '../lib/supabase';

/**
 * Hook pour gérer les notifications Firebase
 *
 * @example
 * const { sendNotification, updateFCMToken } = useFirebaseNotifications();
 *
 * // Envoyer une notification à un utilisateur
 * await sendNotification('user123', 'Nouvelle commande', 'Vous avez une nouvelle commande!');
 */
export function useFirebaseNotifications() {
  const { fcmToken, notificationPermission } = useFirebase();
  const [isTokenSaved, setIsTokenSaved] = useState(false);

  // Sauvegarder le token FCM dans Supabase quand il change
  useEffect(() => {
    if (fcmToken && !isTokenSaved) {
      saveFCMTokenToDatabase();
    }
  }, [fcmToken]);

  const saveFCMTokenToDatabase = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('⚠️ [FCM] Utilisateur non connecté, token non sauvegardé');
        return;
      }

      // Sauvegarder le token dans le profil utilisateur
      const { error } = await supabase
        .from('profiles')
        .update({
          fcm_token: fcmToken,
          fcm_token_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ [FCM] Erreur sauvegarde token:', error);
      } else {
        console.log('✅ [FCM] Token sauvegardé dans la base de données');
        setIsTokenSaved(true);
      }
    } catch (error) {
      console.error('❌ [FCM] Erreur sauvegarde token:', error);
    }
  };

  // Supprimer le token FCM de la base de données (lors de la déconnexion)
  const removeFCMTokenFromDatabase = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          fcm_token: null,
          fcm_token_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ [FCM] Erreur suppression token:', error);
      } else {
        console.log('✅ [FCM] Token supprimé de la base de données');
        setIsTokenSaved(false);
      }
    } catch (error) {
      console.error('❌ [FCM] Erreur suppression token:', error);
    }
  };

  // Envoyer une notification à un utilisateur spécifique
  // Note: Cette fonction nécessite une Cloud Function côté serveur
  const sendNotification = useCallback(
    async (
      userId: string,
      title: string,
      body: string,
      data?: { [key: string]: string }
    ) => {
      try {
        // Appeler une Edge Function Supabase qui enverra la notification via FCM
        const { data: result, error } = await supabase.functions.invoke(
          'send-notification',
          {
            body: {
              userId,
              notification: {
                title,
                body,
              },
              data,
            },
          }
        );

        if (error) {
          console.error('❌ [FCM] Erreur envoi notification:', error);
          return { success: false, error };
        }

        console.log('✅ [FCM] Notification envoyée:', result);
        return { success: true, data: result };
      } catch (error) {
        console.error('❌ [FCM] Erreur envoi notification:', error);
        return { success: false, error };
      }
    },
    []
  );

  // Envoyer une notification multicast (à plusieurs utilisateurs)
  const sendMulticastNotification = useCallback(
    async (
      userIds: string[],
      title: string,
      body: string,
      data?: { [key: string]: string }
    ) => {
      try {
        const { data: result, error } = await supabase.functions.invoke(
          'send-multicast-notification',
          {
            body: {
              userIds,
              notification: {
                title,
                body,
              },
              data,
            },
          }
        );

        if (error) {
          console.error('❌ [FCM] Erreur envoi multicast:', error);
          return { success: false, error };
        }

        console.log('✅ [FCM] Multicast envoyé:', result);
        return { success: true, data: result };
      } catch (error) {
        console.error('❌ [FCM] Erreur envoi multicast:', error);
        return { success: false, error };
      }
    },
    []
  );

  // Helpers pour envoyer des notifications spécifiques

  const sendOrderNotification = useCallback(
    async (sellerId: string, orderId: string, orderNumber: string, amount: number) => {
      return sendNotification(
        sellerId,
        '🛍️ Nouvelle commande',
        `Commande #${orderNumber} - ${amount.toLocaleString()} FCFA`,
        {
          type: 'order',
          order_id: orderId,
        }
      );
    },
    [sendNotification]
  );

  const sendLiveNotification = useCallback(
    async (followerIds: string[], sellerName: string, liveSessionId: string) => {
      return sendMulticastNotification(
        followerIds,
        '📺 Live en cours',
        `${sellerName} a démarré un live shopping !`,
        {
          type: 'live',
          live_session_id: liveSessionId,
        }
      );
    },
    [sendMulticastNotification]
  );

  const sendChatNotification = useCallback(
    async (userId: string, senderName: string, message: string, conversationId: string) => {
      return sendNotification(
        userId,
        `💬 ${senderName}`,
        message,
        {
          type: 'chat',
          conversation_id: conversationId,
        }
      );
    },
    [sendNotification]
  );

  const sendDealNotification = useCallback(
    async (userIds: string[], dealTitle: string, discount: number, dealId: string) => {
      return sendMulticastNotification(
        userIds,
        '⚡ Flash Deal',
        `${dealTitle} - ${discount}% de réduction`,
        {
          type: 'deal',
          deal_id: dealId,
        }
      );
    },
    [sendMulticastNotification]
  );

  const sendCoinsNotification = useCallback(
    async (userId: string, amount: number, reason: string) => {
      return sendNotification(
        userId,
        '🪙 Panda Coins',
        `+${amount} coins - ${reason}`,
        {
          type: 'coins',
        }
      );
    },
    [sendNotification]
  );

  const sendRewardNotification = useCallback(
    async (userId: string, rewardName: string) => {
      return sendNotification(
        userId,
        '🎁 Nouvelle récompense',
        `Vous avez débloqué : ${rewardName}`,
        {
          type: 'reward',
        }
      );
    },
    [sendNotification]
  );

  return {
    fcmToken,
    notificationPermission,
    isTokenSaved,
    saveFCMTokenToDatabase,
    removeFCMTokenFromDatabase,
    sendNotification,
    sendMulticastNotification,
    // Helpers
    sendOrderNotification,
    sendLiveNotification,
    sendChatNotification,
    sendDealNotification,
    sendCoinsNotification,
    sendRewardNotification,
  };
}
