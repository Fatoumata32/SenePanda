/**
 * Utilitaire pour gérer les accès basés sur les abonnements
 */

export type SubscriptionPlanType = 'free' | 'starter' | 'pro' | 'premium';

export interface SubscriptionStatus {
  plan: SubscriptionPlanType;
  isActive: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
}

/**
 * Vérifie si un abonnement est actif
 */
export function isSubscriptionActive(expiresAt: string | null): boolean {
  if (!expiresAt) return false;

  const expirationDate = new Date(expiresAt);
  const now = new Date();

  return expirationDate > now;
}

/**
 * Calcule les jours restants d'un abonnement
 */
export function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Vérifie si un utilisateur a accès aux fonctionnalités vendeur
 */
export function hasSellerAccess(
  subscriptionPlan: SubscriptionPlanType,
  subscriptionExpiresAt: string | null
): boolean {
  // Plan gratuit a accès avec des limites
  if (subscriptionPlan === 'free') {
    return true;
  }

  // Pour les plans payants, vérifier si l'abonnement est actif
  return isSubscriptionActive(subscriptionExpiresAt);
}

/**
 * Vérifie si la boutique doit être visible
 */
export function isShopVisible(
  subscriptionPlan: SubscriptionPlanType,
  subscriptionExpiresAt: string | null
): boolean {
  // Le plan FREE permet aussi la visibilité de la boutique
  if (subscriptionPlan === 'free') {
    return true;
  }
  return hasSellerAccess(subscriptionPlan, subscriptionExpiresAt);
}

/**
 * Obtient les limites selon le plan d'abonnement
 */
export function getSubscriptionLimits(plan: SubscriptionPlanType) {
  const limits = {
    free: {
      maxProducts: 5,
      canAddProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      shopVisible: true,
      commissionRate: 20,
      visibilityBoost: 0,
      hdPhotos: false,
      videoAllowed: false,
      advancedAnalytics: false,
    },
    starter: {
      maxProducts: 50,
      canAddProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      shopVisible: true,
      commissionRate: 15,
      visibilityBoost: 20,
      hdPhotos: false,
      videoAllowed: false,
      advancedAnalytics: false,
    },
    pro: {
      maxProducts: 200,
      canAddProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      shopVisible: true,
      commissionRate: 10,
      visibilityBoost: 50,
      hdPhotos: true,
      videoAllowed: true,
      advancedAnalytics: true,
    },
    premium: {
      maxProducts: 999999, // illimité
      canAddProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      shopVisible: true,
      commissionRate: 5,
      visibilityBoost: 100,
      hdPhotos: true,
      videoAllowed: true,
      advancedAnalytics: true,
    },
  };

  return limits[plan];
}

/**
 * Obtient le statut de l'abonnement
 */
export function getSubscriptionStatus(
  plan: SubscriptionPlanType,
  expiresAt: string | null
): SubscriptionStatus {
  return {
    plan,
    isActive: isSubscriptionActive(expiresAt),
    expiresAt,
    daysRemaining: getDaysRemaining(expiresAt),
  };
}

/**
 * Messages d'erreur selon le contexte
 */
export const SUBSCRIPTION_MESSAGES = {
  NO_ACCESS_TITLE: 'Abonnement requis',
  NO_ACCESS_MESSAGE: 'Vous devez souscrire à un abonnement pour accéder aux fonctionnalités vendeur.',
  EXPIRED_TITLE: 'Abonnement expiré',
  EXPIRED_MESSAGE: 'Votre abonnement a expiré. Renouvelez-le pour continuer à vendre.',
  SHOP_HIDDEN_TITLE: 'Boutique masquée',
  SHOP_HIDDEN_MESSAGE: 'Votre boutique est actuellement masquée. Souscrivez à un abonnement pour la rendre visible.',
  MAX_PRODUCTS_TITLE: 'Limite atteinte',
  MAX_PRODUCTS_MESSAGE: 'Vous avez atteint la limite de produits de votre plan. Passez à un plan supérieur pour ajouter plus de produits.',
};
