import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlanType } from '@/types/database';

export interface PlanLimits {
  maxProducts: number;
  maxImagesPerProduct: number;
  canUseFeaturedListing: boolean;
  canUseAdvancedAnalytics: boolean;
  canUsePrioritySupport: boolean;
  canUseCustomBranding: boolean;
  canUseVideoProducts: boolean;
  shopIsVisible: boolean;
}

export interface UseSubscriptionPlanReturn {
  loading: boolean;
  currentPlan: SubscriptionPlanType;
  shopIsActive: boolean;
  limits: PlanLimits;
  canAddProduct: (currentCount: number) => boolean;
  canAddImage: (currentCount: number) => boolean;
  hasFeature: (feature: keyof PlanLimits) => boolean;
  refresh: () => Promise<void>;
}

const PLAN_LIMITS: Record<SubscriptionPlanType, PlanLimits> = {
  free: {
    maxProducts: 10,
    maxImagesPerProduct: 1,
    canUseFeaturedListing: false,
    canUseAdvancedAnalytics: false,
    canUsePrioritySupport: false,
    canUseCustomBranding: false,
    canUseVideoProducts: false,
    shopIsVisible: false, // Boutique non visible publiquement
  },
  starter: {
    maxProducts: 50,
    maxImagesPerProduct: 3,
    canUseFeaturedListing: true,
    canUseAdvancedAnalytics: false,
    canUsePrioritySupport: false,
    canUseCustomBranding: false,
    canUseVideoProducts: false,
    shopIsVisible: true,
  },
  pro: {
    maxProducts: 200,
    maxImagesPerProduct: 5,
    canUseFeaturedListing: true,
    canUseAdvancedAnalytics: true,
    canUsePrioritySupport: true,
    canUseCustomBranding: true,
    canUseVideoProducts: false,
    shopIsVisible: true,
  },
  premium: {
    maxProducts: 999999, // Illimité
    maxImagesPerProduct: 10,
    canUseFeaturedListing: true,
    canUseAdvancedAnalytics: true,
    canUsePrioritySupport: true,
    canUseCustomBranding: true,
    canUseVideoProducts: true,
    shopIsVisible: true,
  },
};

export function useSubscriptionPlan(userId?: string): UseSubscriptionPlanReturn {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanType>('free');
  const [shopIsActive, setShopIsActive] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSubscription();
    }
  }, [userId]);

  const loadSubscription = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Récupérer le profil avec subscription_plan et shop_is_active
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_plan, shop_is_active')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        setCurrentPlan((profile.subscription_plan as SubscriptionPlanType) || 'free');
        setShopIsActive(profile.shop_is_active || false);
      }
    } catch (error) {
      console.error('Erreur chargement plan:', error);
      // Par défaut, plan free
      setCurrentPlan('free');
      setShopIsActive(false);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadSubscription();
  };

  const limits = PLAN_LIMITS[currentPlan];

  const canAddProduct = (currentCount: number): boolean => {
    return currentCount < limits.maxProducts;
  };

  const canAddImage = (currentCount: number): boolean => {
    return currentCount < limits.maxImagesPerProduct;
  };

  const hasFeature = (feature: keyof PlanLimits): boolean => {
    return !!limits[feature];
  };

  return {
    loading,
    currentPlan,
    shopIsActive,
    limits,
    canAddProduct,
    canAddImage,
    hasFeature,
    refresh,
  };
}

/**
 * Fonction utilitaire pour obtenir le nom d'affichage d'un plan
 */
export function getPlanDisplayName(plan: SubscriptionPlanType): string {
  const names: Record<SubscriptionPlanType, string> = {
    free: 'Gratuit',
    starter: 'Starter',
    pro: 'Pro',
    premium: 'Premium',
  };
  return names[plan];
}

/**
 * Fonction utilitaire pour obtenir la couleur d'un plan
 */
export function getPlanColor(plan: SubscriptionPlanType): string {
  const colors: Record<SubscriptionPlanType, string> = {
    free: '#6B7280',
    starter: '#3B82F6',
    pro: '#8B5CF6',
    premium: '#F59E0B',
  };
  return colors[plan];
}

/**
 * Fonction utilitaire pour formater les limites
 */
export function formatLimit(value: number): string {
  if (value >= 999999) return 'Illimité';
  return value.toString();
}
