/**
 * Hook de synchronisation en temps réel des PandaCoins
 * Écoute les changements de points et met à jour automatiquement
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { speak } from '@/lib/voiceGuide';

interface PandaCoinsData {
  coins: number;
  totalEarned: number;
  totalSpent: number;
  level: string;
  loading: boolean;
}

export function usePandaCoinsSync(userId: string | undefined) {
  const [coinsData, setCoinsData] = useState<PandaCoinsData>({
    coins: 0,
    totalEarned: 0,
    totalSpent: 0,
    level: 'bronze',
    loading: true,
  });

  const [previousCoins, setPreviousCoins] = useState(0);

  // Charger les coins depuis le profil ET loyalty_points
  const loadCoins = useCallback(async () => {
    if (!userId) {
      setCoinsData({
        coins: 0,
        totalEarned: 0,
        totalSpent: 0,
        level: 'bronze',
        loading: false,
      });
      return;
    }

    try {
      // D'abord essayer depuis profiles.panda_coins
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('panda_coins')
        .eq('id', userId)
        .maybeSingle();

      if (!profileError && profile) {
        const currentCoins = profile.panda_coins || 0;

        // Vérifier aussi loyalty_points pour stats complètes
        const { data: loyalty } = await supabase
          .from('loyalty_points')
          .select('points, total_earned, total_spent, level')
          .eq('user_id', userId)
          .maybeSingle();

        setCoinsData({
          coins: currentCoins,
          totalEarned: loyalty?.total_earned || 0,
          totalSpent: loyalty?.total_spent || 0,
          level: loyalty?.level || 'bronze',
          loading: false,
        });

        // Synchroniser loyalty_points si différent
        if (loyalty && loyalty.points !== currentCoins) {
          await supabase
            .from('loyalty_points')
            .update({ points: currentCoins })
            .eq('user_id', userId);
        }

        setPreviousCoins(currentCoins);
      } else {
        // Fallback: loyalty_points seulement
        const { data: loyalty } = await supabase
          .from('loyalty_points')
          .select('points, total_earned, total_spent, level')
          .eq('user_id', userId)
          .maybeSingle();

        if (loyalty) {
          setCoinsData({
            coins: loyalty.points || 0,
            totalEarned: loyalty.total_earned || 0,
            totalSpent: loyalty.total_spent || 0,
            level: loyalty.level || 'bronze',
            loading: false,
          });
          setPreviousCoins(loyalty.points || 0);
        } else {
          setCoinsData({
            coins: 0,
            totalEarned: 0,
            totalSpent: 0,
            level: 'bronze',
            loading: false,
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement coins:', error);
      setCoinsData(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  // Charger au montage
  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  // Écouter les changements en temps réel sur profiles
  useEffect(() => {
    if (!userId) return;

    const profileChannel = supabase
      .channel(`profile_coins_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Profile coins updated:', payload.new);
          const newCoins = payload.new.panda_coins || 0;
          const diff = newCoins - previousCoins;

          setCoinsData(prev => ({
            ...prev,
            coins: newCoins,
          }));

          // Feedback si gain
          if (diff > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            speak(`Vous avez gagné ${diff} PandaCoins!`, { rate: 1.1, pitch: 1.1 });
          }

          setPreviousCoins(newCoins);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [userId, previousCoins]);

  // Écouter les transactions de points
  useEffect(() => {
    if (!userId) return;

    const transactionsChannel = supabase
      .channel(`points_transactions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 New points transaction:', payload.new);

          // Recharger les coins après une transaction
          loadCoins();

          const points = payload.new.points;
          const description = payload.new.description;

          // Feedback vocal
          if (points > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (description) {
              speak(`${description}: +${points} PandaCoins`, { rate: 1.0 });
            } else {
              speak(`+${points} PandaCoins`, { rate: 1.0 });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
    };
  }, [userId, loadCoins]);

  // Fonction pour rafraîchir manuellement
  const refresh = useCallback(() => {
    loadCoins();
  }, [loadCoins]);

  return {
    coins: coinsData.coins,
    totalEarned: coinsData.totalEarned,
    totalSpent: coinsData.totalSpent,
    level: coinsData.level,
    loading: coinsData.loading,
    refresh,
    previousCoins,
  };
}

export default usePandaCoinsSync;
