import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface QuotaUsage {
  minutesUsed: number;
  minutesLimit: number;
  sessionsCount: number;
  percentageUsed: number;
  billingPeriod: Date;
  planName: string;
  canStartLive: boolean;
  minutesRemaining: number;
}

export interface SubscriptionLimits {
  plan_type: 'free' | 'starter' | 'pro' | 'premium';
  can_create_live: boolean;
  max_concurrent_lives: number;
  max_products_per_live: number;
  has_live_access: boolean;
  has_video_support: boolean;
  needs_upgrade: boolean;
  upgrade_message?: string;
  // Nouvelles propriétés pour les quotas
  quota: QuotaUsage | null;
  liveHoursPerMonth: number;
}

export const useSubscriptionLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits>({
    plan_type: 'free',
    can_create_live: false,
    max_concurrent_lives: 0,
    max_products_per_live: 0,
    has_live_access: false,
    has_video_support: false,
    needs_upgrade: true,
    upgrade_message: 'Le Live Shopping est réservé aux abonnés Premium et Pro',
    quota: null,
    liveHoursPerMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionLimits();
    }
  }, [user]);

  const loadSubscriptionLimits = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Récupérer le profil et le plan d'abonnement
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_expires_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const planType = profile?.subscription_plan || 'free';
      const isActive = profile?.subscription_status === 'active';
      const isExpired = profile?.subscription_expires_at
        ? new Date(profile.subscription_expires_at) < new Date()
        : false;

      // Récupérer le quota actuel de l'utilisateur
      const { data: quotaData } = await supabase
        .rpc('get_current_quota', { p_user_id: user.id });

      let quota: QuotaUsage | null = null;
      if (quotaData && quotaData.length > 0) {
        const q = quotaData[0];
        quota = {
          minutesUsed: q.minutes_used || 0,
          minutesLimit: q.minutes_limit || 0,
          sessionsCount: q.sessions_count || 0,
          percentageUsed: q.percentage_used || 0,
          billingPeriod: new Date(q.billing_period),
          planName: q.plan_name || 'free',
          canStartLive: q.can_start_live || false,
          minutesRemaining: q.minutes_remaining || 0,
        };
      }

      // Définir les limites selon le plan
      let newLimits: SubscriptionLimits;

      switch (planType) {
        case 'premium':
          newLimits = {
            plan_type: 'premium',
            can_create_live: isActive && !isExpired,
            max_concurrent_lives: 5, // Plusieurs lives en même temps
            max_products_per_live: 50,
            has_live_access: true,
            has_video_support: true,
            needs_upgrade: false,
          };
          break;

        case 'pro':
          newLimits = {
            plan_type: 'pro',
            can_create_live: isActive && !isExpired,
            max_concurrent_lives: 2, // 2 lives simultanés max
            max_products_per_live: 30,
            has_live_access: true,
            has_video_support: true,
            needs_upgrade: false,
          };
          break;

        case 'starter':
          newLimits = {
            plan_type: 'starter',
            can_create_live: false,
            max_concurrent_lives: 0,
            max_products_per_live: 0,
            has_live_access: false,
            has_video_support: false,
            needs_upgrade: true,
            upgrade_message:
              'Le Live Shopping est disponible à partir du plan Pro (7000 FCFA/mois)',
          };
          break;

        default: // free
          newLimits = {
            plan_type: 'free',
            can_create_live: false,
            max_concurrent_lives: 0,
            max_products_per_live: 0,
            has_live_access: false,
            has_video_support: false,
            needs_upgrade: true,
            upgrade_message:
              'Le Live Shopping est réservé aux abonnés Premium (15000 FCFA/mois) et Pro (7000 FCFA/mois)',
          };
      }

      // Si le plan est expiré, désactiver l'accès
      if (isExpired || !isActive) {
        newLimits.can_create_live = false;
        newLimits.needs_upgrade = true;
        newLimits.upgrade_message = 'Votre abonnement a expiré. Renouvelez pour continuer à utiliser le Live Shopping.';
      }

      setLimits(newLimits);
    } catch (error) {
      console.error('Error loading subscription limits:', error);
    } finally {
      setLoading(false);
    }
  };

  return { limits, loading, refresh: loadSubscriptionLimits };
};
