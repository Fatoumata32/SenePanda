import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

// Import conditionnel de Firebase (peut échouer dans Expo Go)
let messaging: any = null;
let analytics: any = null;
let isFirebaseAvailable = false;

try {
  messaging = require('@react-native-firebase/messaging').default;
  analytics = require('@react-native-firebase/analytics').default;
  isFirebaseAvailable = true;
  console.log('✅ [Firebase] Modules chargés avec succès');
} catch (error) {
  console.warn('⚠️ [Firebase] Non disponible dans Expo Go. Rebuild natif requis.');
  isFirebaseAvailable = false;
}

interface FirebaseContextType {
  fcmToken: string | null;
  notificationPermission: boolean;
  isAvailable: boolean;
  logEvent: (eventName: string, params?: { [key: string]: any }) => Promise<void>;
  logScreenView: (screenName: string, screenClass?: string) => Promise<void>;
  setUserProperties: (properties: { [key: string]: any }) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    if (isFirebaseAvailable) {
      initializeFirebase();
    } else {
      console.log('ℹ️ [Firebase] Désactivé - Utilisez "npx expo prebuild" puis "npx expo run:android" pour activer Firebase');
    }
  }, []);

  const initializeFirebase = async () => {
    try {
      console.log('🔥 [Firebase] Initialisation...');

      if (!messaging) {
        console.warn('⚠️ [Firebase] Messaging non disponible');
        return;
      }

      // 1. Demander la permission pour les notifications
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setNotificationPermission(enabled);

      if (enabled) {
        console.log('✅ [Firebase] Permission notifications accordée');

        // 2. Obtenir le token FCM
        const token = await messaging().getToken();
        setFcmToken(token);
        console.log('✅ [Firebase] FCM Token:', token);

        // Sauvegarder le token dans Supabase (pour envoyer des notifications)
        // await saveFCMTokenToSupabase(token);
      } else {
        console.log('❌ [Firebase] Permission notifications refusée');
      }

      // 3. Listener pour les nouveaux tokens
      messaging().onTokenRefresh(async (newToken: string) => {
        console.log('🔄 [Firebase] Nouveau token FCM:', newToken);
        setFcmToken(newToken);
        // await saveFCMTokenToSupabase(newToken);
      });

      // 4. Listener pour les notifications en foreground
      messaging().onMessage(async (remoteMessage: any) => {
        console.log('📬 [Firebase] Notification reçue (foreground):', remoteMessage);

        // Afficher une notification locale
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title || 'Nouvelle notification',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data,
          },
          trigger: null, // Immédiatement
        });
      });

      // 5. Listener pour les notifications en background
      messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('📬 [Firebase] Notification reçue (background):', remoteMessage);
        // La notification est automatiquement affichée par Firebase
      });

      // 6. Gérer le clic sur une notification
      messaging().onNotificationOpenedApp((remoteMessage: any) => {
        console.log('👆 [Firebase] Notification cliquée (app en background):', remoteMessage);
        handleNotificationClick(remoteMessage);
      });

      // 7. Vérifier si l'app a été ouverte via une notification
      messaging()
        .getInitialNotification()
        .then((remoteMessage: any) => {
          if (remoteMessage) {
            console.log('👆 [Firebase] App ouverte via notification:', remoteMessage);
            handleNotificationClick(remoteMessage);
          }
        });

      console.log('✅ [Firebase] Initialisation terminée');
    } catch (error) {
      console.error('❌ [Firebase] Erreur initialisation:', error);
    }
  };

  const handleNotificationClick = (remoteMessage: any) => {
    const { data, notification } = remoteMessage;

    // Router vers la bonne page selon le type de notification
    if (data?.type === 'order') {
      console.log('🛍️ Ouvrir la commande:', data.order_id);
      // navigation.navigate('orders', { orderId: data.order_id });
    } else if (data?.type === 'live') {
      console.log('📺 Ouvrir le live:', data.live_session_id);
      // navigation.navigate('live', { id: data.live_session_id });
    } else if (data?.type === 'chat') {
      console.log('💬 Ouvrir le chat:', data.conversation_id);
      // navigation.navigate('chat', { conversationId: data.conversation_id });
    } else {
      console.log('🔔 Notification générique');
    }
  };

  // Fonction pour logger un événement
  const logEvent = async (eventName: string, params?: { [key: string]: any }) => {
    if (!isFirebaseAvailable || !analytics) {
      console.log(`📊 [Analytics - Mock] Event: ${eventName}`, params);
      return;
    }

    try {
      await analytics().logEvent(eventName, params);
      console.log(`📊 [Analytics] Event: ${eventName}`, params);
    } catch (error) {
      console.error('❌ [Analytics] Erreur log event:', error);
    }
  };

  // Fonction pour logger une vue d'écran
  const logScreenView = async (screenName: string, screenClass?: string) => {
    if (!isFirebaseAvailable || !analytics) {
      console.log(`📊 [Analytics - Mock] Screen view: ${screenName}`);
      return;
    }

    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      console.log(`📊 [Analytics] Screen view: ${screenName}`);
    } catch (error) {
      console.error('❌ [Analytics] Erreur log screen:', error);
    }
  };

  // Fonction pour définir les propriétés utilisateur
  const setUserProperties = async (properties: { [key: string]: any }) => {
    if (!isFirebaseAvailable || !analytics) {
      console.log(`📊 [Analytics - Mock] User properties:`, properties);
      return;
    }

    try {
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, String(value));
      }
      console.log(`📊 [Analytics] User properties:`, properties);
    } catch (error) {
      console.error('❌ [Analytics] Erreur set user properties:', error);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        fcmToken,
        notificationPermission,
        isAvailable: isFirebaseAvailable,
        logEvent,
        logScreenView,
        setUserProperties,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
};
