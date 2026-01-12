import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { RealtimeChannel } from '@supabase/supabase-js';

export type CoinBalance = {
  points: number;
  total_earned: number;
  total_spent: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

export const COINS_TO_FCFA_RATE = 5; // 1 coin = 5 FCFA
export const MIN_COINS_TO_USE = 100; // Minimum 100 coins pour utiliser
export const MAX_DISCOUNT_PERCENTAGE = 50; // Maximum 50% de réduction

type CoinsContextType = {
  balance: CoinBalance | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  spendCoins: (amount: number, type: string, description: string, referenceId?: string) => Promise<boolean>;
  addCoins: (amount: number, type: string, description: string, referenceId?: string) => Promise<boolean>;
  calculateMaxDiscount: (orderTotal: number) => number;
  calculateCoinsNeeded: (discountAmount: number) => number;
  canUseCoins: () => boolean;
  COINS_TO_FCFA_RATE: number;
  MIN_COINS_TO_USE: number;
  MAX_DISCOUNT_PERCENTAGE: number;
};

const CoinsContext = createContext<CoinsContextType | null>(null);

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastFetchRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Fetch balance from database
  const fetchBalance = useCallback(async (force = false) => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    // Debounce: skip if fetched within last 500ms (unless forced)
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 500) {
      return;
    }
    lastFetchRef.current = now;

    try {
      setError(null);

      // Essayer d'abord avec toutes les colonnes
      let { data, error: fetchError } = await supabase
        .from('loyalty_points')
        .select('points, total_earned, total_spent, level')
        .eq('user_id', user.id)
        .single();

      // Si erreur de colonne manquante, essayer avec colonnes de base uniquement
      if (fetchError?.code === '42703') {
        console.log('⚠️ Colonnes manquantes, utilisation du mode basique');
        const { data: basicData, error: basicError } = await supabase
          .from('loyalty_points')
          .select('points, total_earned, level')
          .eq('user_id', user.id)
          .single();
        
        if (basicError && basicError.code !== 'PGRST116') {
          // Si même les colonnes de base n'existent pas, utiliser juste points
          const { data: minimalData, error: minimalError } = await supabase
            .from('loyalty_points')
            .select('points')
            .eq('user_id', user.id)
            .single();
          
          if (minimalError && minimalError.code !== 'PGRST116') {
            throw minimalError;
          }
          
          data = minimalData ? { 
            ...minimalData, 
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

      if (!isMountedRef.current) return;

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
        // Create entry if it doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            points: 0,
            total_earned: 0,
            total_spent: 0,
            level: 'bronze',
          })
          .select('points, total_earned, total_spent, level')
          .single();

        if (!isMountedRef.current) return;
        if (insertError) throw insertError;

        setBalance({
          points: newData?.points || 0,
          total_earned: newData?.total_earned || 0,
          total_spent: newData?.total_spent || 0,
          level: newData?.level || 'bronze',
        });
      }
    } catch (err: any) {
      console.error('Error fetching coin balance:', err);
      if (isMountedRef.current) {
        setError(err.message);
        setBalance({ points: 0, total_earned: 0, total_spent: 0, level: 'bronze' });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // Subscribe to realtime changes
  useEffect(() => {
    isMountedRef.current = true;

    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchBalance(true);

    // Setup realtime subscription
    const channel = supabase
      .channel(`coins-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_points',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🪙 Coins realtime update:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as any;
            if (isMountedRef.current && newData) {
              setBalance({
                points: newData.points || 0,
                total_earned: newData.total_earned || 0,
                total_spent: newData.total_spent || 0,
                level: newData.level || 'bronze',
              });
            }
          } else if (payload.eventType === 'DELETE') {
            if (isMountedRef.current) {
              setBalance({ points: 0, total_earned: 0, total_spent: 0, level: 'bronze' });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🪙 New transaction:', payload);
          // Refresh balance when a new transaction is added
          fetchBalance(true);
        }
      )
      .subscribe((status) => {
        console.log('🪙 Coins subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchBalance]);

  // Calculate max discount
  const calculateMaxDiscount = useCallback((orderTotal: number): number => {
    if (!balance || balance.points < MIN_COINS_TO_USE) return 0;
    
    const maxFromCoins = balance.points * COINS_TO_FCFA_RATE;
    const maxFromPercentage = orderTotal * (MAX_DISCOUNT_PERCENTAGE / 100);
    
    return Math.min(maxFromCoins, maxFromPercentage);
  }, [balance]);

  // Calculate coins needed
  const calculateCoinsNeeded = useCallback((discountAmount: number): number => {
    return Math.ceil(discountAmount / COINS_TO_FCFA_RATE);
  }, []);

  // Check if user can use coins
  const canUseCoins = useCallback((): boolean => {
    return balance !== null && balance.points >= MIN_COINS_TO_USE;
  }, [balance]);

  // Spend coins
  const spendCoins = useCallback(async (
    coinsToSpend: number,
    type: string,
    description: string,
    referenceId?: string
  ): Promise<boolean> => {
    if (!user || !balance || coinsToSpend > balance.points) {
      return false;
    }

    try {
      // Use the SQL function for atomic operation
      const { data, error: rpcError } = await supabase.rpc('spend_user_points', {
        p_user_id: user.id,
        p_amount: coinsToSpend,
        p_type: type,
        p_description: description,
      });

      if (rpcError) {
        // Fallback to manual update (sans total_spent pour compatibilité)
        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update({
            points: balance.points - coinsToSpend,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Log transaction
        await supabase.from('points_transactions').insert({
          user_id: user.id,
          points: -coinsToSpend,
          type: type,
          description: description,
          related_id: referenceId || null,
        });
      }

      // Optimistic update
      setBalance(prev => prev ? {
        ...prev,
        points: prev.points - coinsToSpend,
        total_spent: (prev.total_spent || 0) + coinsToSpend,
      } : null);

      return true;
    } catch (err: any) {
      console.error('Error spending coins:', err);
      // Refresh to get correct state
      fetchBalance(true);
      return false;
    }
  }, [user, balance, fetchBalance]);

  // Add coins
  const addCoins = useCallback(async (
    coinsToAdd: number,
    type: string,
    description: string,
    referenceId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const currentPoints = balance?.points || 0;
      const currentTotalEarned = balance?.total_earned || 0;
      const newTotalEarned = currentTotalEarned + coinsToAdd;

      // Calculate new level
      let newLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (newTotalEarned >= 15000) newLevel = 'platinum';
      else if (newTotalEarned >= 5000) newLevel = 'gold';
      else if (newTotalEarned >= 1000) newLevel = 'silver';

      // Try SQL function first
      const { data, error: rpcError } = await supabase.rpc('add_user_points', {
        p_user_id: user.id,
        p_amount: coinsToAdd,
        p_type: type,
        p_description: description,
      });

      if (rpcError) {
        // Fallback to manual upsert
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

        // Log transaction
        await supabase.from('points_transactions').insert({
          user_id: user.id,
          points: coinsToAdd,
          type: type,
          description: description,
          related_id: referenceId || null,
        });
      }

      // Optimistic update
      setBalance({
        points: currentPoints + coinsToAdd,
        total_earned: newTotalEarned,
        total_spent: balance?.total_spent || 0,
        level: newLevel,
      });

      return true;
    } catch (err: any) {
      console.error('Error adding coins:', err);
      // Refresh to get correct state
      fetchBalance(true);
      return false;
    }
  }, [user, balance, fetchBalance]);

  const value: CoinsContextType = {
    balance,
    loading,
    error,
    refresh: () => fetchBalance(true),
    spendCoins,
    addCoins,
    calculateMaxDiscount,
    calculateCoinsNeeded,
    canUseCoins,
    COINS_TO_FCFA_RATE,
    MIN_COINS_TO_USE,
    MAX_DISCOUNT_PERCENTAGE,
  };

  return (
    <CoinsContext.Provider value={value}>
      {children}
    </CoinsContext.Provider>
  );
}

export function useCoins() {
  const context = useContext(CoinsContext);
  if (!context) {
    throw new Error('useCoins must be used within a CoinsProvider');
  }
  return context;
}

// Backward compatibility - hook that uses the context
export function useCoinBalance() {
  return useCoins();
}

export default CoinsProvider;
