/**
 * =============================================
 * 🔄 SYNCHRONISATION DES ABONNEMENTS
 * =============================================
 *
 * Ce fichier gère la synchronisation entre user_subscriptions
 * et profiles.subscription_plan / profiles.shop_is_active
 *
 * Utilisé au lieu d'un trigger SQL car la structure de
 * user_subscriptions peut varier
 */

import { supabase } from './supabase';
import { SubscriptionPlanType } from '@/types/database';

/**
 * Met à jour le plan d'abonnement dans le profil
 */
export async function syncSubscriptionPlan(
  userId: string,
  planType: SubscriptionPlanType
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: planType,
        shop_is_active: planType !== 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Erreur sync plan:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Plan ${planType} synchronisé pour user ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erreur sync plan:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Active ou désactive une boutique
 */
export async function setShopActive(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        shop_is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Erreur activation boutique:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Boutique ${isActive ? 'activée' : 'désactivée'} pour user ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erreur activation boutique:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère le plan actuel depuis le profil
 */
export async function getCurrentPlan(
  userId: string
): Promise<{ plan: SubscriptionPlanType; isActive: boolean } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_plan, shop_is_active')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Erreur récupération plan:', error);
      return null;
    }

    return {
      plan: (data.subscription_plan as SubscriptionPlanType) || 'free',
      isActive: data.shop_is_active || false,
    };
  } catch (error) {
    console.error('Erreur récupération plan:', error);
    return null;
  }
}

/**
 * Vérifie si un utilisateur a un abonnement actif
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_plan, shop_is_active')
      .eq('id', userId)
      .single();

    if (!data) return false;

    // Un abonnement est actif si ce n'est pas FREE
    // ou si shop_is_active est true
    return data.subscription_plan !== 'free' || data.shop_is_active === true;
  } catch (error) {
    console.error('Erreur vérification abonnement:', error);
    return false;
  }
}

/**
 * Passe au plan FREE (downgrade)
 */
export async function downgradeToFree(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: 'free',
        shop_is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Erreur downgrade:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Downgrade vers FREE pour user ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erreur downgrade:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upgrade vers un plan payant
 */
export async function upgradeToPaidPlan(
  userId: string,
  planType: 'starter' | 'pro' | 'premium'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: planType,
        shop_is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Erreur upgrade:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upgrade vers ${planType.toUpperCase()} pour user ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erreur upgrade:', error);
    return { success: false, error: error.message };
  }
}
