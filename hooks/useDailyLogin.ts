import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_CHECK_KEY = '@senepanda_last_daily_check';

/**
 * Hook qui gère automatiquement le suivi de connexion quotidienne
 * Vérifie et enregistre la connexion une seule fois par jour
 */
export function useDailyLogin() {
  const { user } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!user || hasChecked.current) return;

    checkAndRecordDailyLogin();
  }, [user]);

  const checkAndRecordDailyLogin = async () => {
    if (!user) return;

    try {
      // Vérifier la dernière date de vérification
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const today = new Date().toISOString().split('T')[0];

      // Si déjà vérifié aujourd'hui, ne rien faire
      if (lastCheck === today) {
        hasChecked.current = true;
        return;
      }

      // Enregistrer la connexion quotidienne
      const { data, error } = await supabase.rpc('record_daily_login', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error recording daily login:', error);
        return;
      }

      // Marquer comme vérifié aujourd'hui
      await AsyncStorage.setItem(LAST_CHECK_KEY, today);
      hasChecked.current = true;

      // Si succès, logger le résultat (optionnel - peut être utilisé pour afficher une notification)
      if (data?.success) {
        console.log('✅ Daily login recorded:', {
          points: data.points,
          streak: data.streak,
          message: data.message,
        });

        // Ici, vous pouvez déclencher une notification toast si souhaité
        // showToast(data.message);
      }
    } catch (error) {
      console.error('Error in daily login check:', error);
    }
  };

  return null;
}
