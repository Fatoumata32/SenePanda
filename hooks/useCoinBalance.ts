/**
 * useCoinBalance Hook - Gère le solde de Panda Coins
 * 
 * Ce hook utilise maintenant le CoinsContext pour une synchronisation
 * en temps réel des coins à travers toute l'application.
 * 
 * @example
 * const { balance, spendCoins, addCoins } = useCoinBalance();
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type CoinBalance = {
  points: number;
  total_earned: number;
  total_spent: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

// Conversion: 1 coin = 5 FCFA
export const COINS_TO_FCFA_RATE = 5;
export const MIN_COINS_TO_USE = 100; // Minimum 100 coins pour utiliser (500 FCFA)
export const MAX_DISCOUNT_PERCENTAGE = 50; // Maximum 50% de réduction avec les coins

export function useCoinBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Essayer d'abord avec toutes les colonnes
      let { data, error: fetchError } = await supabase
        .from('loyalty_points')
        .select('points, total_earned, total_spent, level')
        .eq('user_id', user.id)
        .single();

      // Si erreur de colonne manquante, essayer sans total_spent
      if (fetchError?.code === '42703') {
        console.log('⚠️ Colonne total_spent manquante, mode basique activé');
        const { data: basicData, error: basicError } = await supabase
          .from('loyalty_points')
          .select('points, total_earned, level')
          .eq('user_id', user.id)
          .single();
        
        if (basicError && basicError.code !== 'PGRST116') {
          // Essayer avec juste points
          const { data: minimalData, error: minimalError } = await supabase
            .from('loyalty_points')
            .select('points')
            .eq('user_id', user.id)
            .single();
          
          if (minimalError && minimalError.code !== 'PGRST116') {
            throw minimalError;
          }
          
          data = minimalData ? {
            points: minimalData.points || 0,
            total_earned: minimalData.points || 0,
            total_spent: 0,
            level: 'bronze'
          } : null;
        } else {
          data = basicData ? {
            ...basicData,
            total_spent: 0
          } : null;
        }
        fetchError = null;
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setBalance({
          points: data.points || 0,
          total_earned: data.total_earned || 0,
          total_spent: data.total_spent || 0,
          level: data.level || 'bronze',
        });
      } else {
        // Créer une entrée si elle n'existe pas (sans total_spent pour compatibilité)
        const { data: newData, error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            points: 0,
            total_earned: 0,
            level: 'bronze',
          })
          .select('points, total_earned, level')
          .single();

        if (insertError) throw insertError;

        setBalance({
          points: newData?.points || 0,
          total_earned: newData?.total_earned || 0,
          total_spent: 0,
          level: newData?.level || 'bronze',
        });
      }
    } catch (err: any) {
      console.error('Error fetching coin balance:', err);
      setError(err.message);
      setBalance({ points: 0, total_earned: 0, total_spent: 0, level: 'bronze' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchBalance();

    // Subscribe to realtime changes for this user's loyalty_points
    if (!user) return;

    const channel = supabase
      .channel(`coins-hook-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_points',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🪙 Realtime coins update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as any;
            setBalance({
              points: newData.points || 0,
              total_earned: newData.total_earned || 0,
              total_spent: newData.total_spent || 0,
              level: newData.level || 'bronze',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBalance]);

  // Calcule la réduction maximale possible en FCFA
  const calculateMaxDiscount = useCallback((orderTotal: number): number => {
    if (!balance || balance.points < MIN_COINS_TO_USE) return 0;
    
    const maxFromCoins = balance.points * COINS_TO_FCFA_RATE;
    const maxFromPercentage = orderTotal * (MAX_DISCOUNT_PERCENTAGE / 100);
    
    return Math.min(maxFromCoins, maxFromPercentage);
  }, [balance]);

  // Calcule combien de coins sont nécessaires pour une réduction donnée
  const calculateCoinsNeeded = useCallback((discountAmount: number): number => {
    return Math.ceil(discountAmount / COINS_TO_FCFA_RATE);
  }, []);

  // Vérifie si l'utilisateur peut utiliser des coins
  const canUseCoins = useCallback((): boolean => {
    return balance !== null && balance.points >= MIN_COINS_TO_USE;
  }, [balance]);

  // Dépense des coins pour une réduction
  const spendCoins = useCallback(async (
    coinsToSpend: number,
    orderId: string,
    description: string
  ): Promise<boolean> => {
    if (!user || !balance || coinsToSpend > balance.points) {
      return false;
    }

    try {
      // 1. Déduire les points (sans total_spent pour compatibilité)
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          points: balance.points - coinsToSpend,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 2. Créer la transaction
      await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points: -coinsToSpend,
          type: 'redemption',
          description: description,
          related_id: orderId || null,
        });

      // Mettre à jour le solde local immédiatement
      setBalance(prev => prev ? {
        ...prev,
        points: prev.points - coinsToSpend,
        total_spent: (prev.total_spent || 0) + coinsToSpend,
      } : null);

      return true;
    } catch (err: any) {
      console.error('Error spending coins:', err);
      // Refresh pour obtenir l'état correct
      fetchBalance();
      return false;
    }
  }, [user, balance, fetchBalance]);

  // Ajoute des coins (pour les achats, bonus, etc.)
  const addCoins = useCallback(async (
    coinsToAdd: number,
    type: 'purchase' | 'review' | 'referral' | 'bonus' | 'welcome' | string,
    description: string,
    referenceId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const currentPoints = balance?.points || 0;
      const currentTotalEarned = balance?.total_earned || 0;
      const currentTotalSpent = balance?.total_spent || 0;
      const newTotalEarned = currentTotalEarned + coinsToAdd;

      // Déterminer le nouveau niveau
      let newLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (newTotalEarned >= 15000) newLevel = 'platinum';
      else if (newTotalEarned >= 5000) newLevel = 'gold';
      else if (newTotalEarned >= 1000) newLevel = 'silver';

      // Mettre à jour les points avec upsert (sans total_spent pour compatibilité)
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .upsert({
          user_id: user.id,
          points: currentPoints + coinsToAdd,
          total_earned: newTotalEarned,
          level: newLevel,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      // Créer la transaction
      await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points: coinsToAdd,
          type: type,
          description: description,
          related_id: referenceId || null,
        });

      // Mettre à jour le solde local immédiatement
      setBalance({
        points: currentPoints + coinsToAdd,
        total_earned: newTotalEarned,
        total_spent: currentTotalSpent,
        level: newLevel,
      });

      return true;
    } catch (err: any) {
      console.error('Error adding coins:', err);
      // Refresh pour obtenir l'état correct
      fetchBalance();
      return false;
    }
  }, [user, balance, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
    calculateMaxDiscount,
    calculateCoinsNeeded,
    canUseCoins,
    spendCoins,
    addCoins,
    COINS_TO_FCFA_RATE,
    MIN_COINS_TO_USE,
    MAX_DISCOUNT_PERCENTAGE,
  };
}

export default useCoinBalance;
