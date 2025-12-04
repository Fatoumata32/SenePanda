import { ReputationLevel, ReputationData } from '@/components/SellerReputationBadge';

/**
 * Configuration des seuils de niveau de réputation
 * Basé sur un score global calculé à partir de plusieurs facteurs
 */
export const REPUTATION_THRESHOLDS = {
  nouveau: { min: 0, max: 19, nextLevel: 'bronze' },
  bronze: { min: 20, max: 39, nextLevel: 'silver' },
  silver: { min: 40, max: 59, nextLevel: 'gold' },
  gold: { min: 60, max: 79, nextLevel: 'platinum' },
  platinum: { min: 80, max: 94, nextLevel: 'diamond' },
  diamond: { min: 95, max: 100, nextLevel: null },
} as const;

/**
 * Poids des différents facteurs dans le calcul du score
 */
export const REPUTATION_WEIGHTS = {
  averageRating: 40, // La note moyenne compte pour 40%
  totalReviews: 25, // Le nombre d'avis compte pour 25%
  positiveVotes: 20, // Les votes positifs comptent pour 20%
  responseRate: 10, // Le taux de réponse compte pour 10%
  completionRate: 5, // Le taux de complétion des commandes compte pour 5%
} as const;

/**
 * Seuils pour les différents facteurs
 */
export const REPUTATION_BENCHMARKS = {
  reviews: {
    excellent: 100, // 100+ avis = score maximum
    good: 50,
    average: 20,
    poor: 5,
  },
  votes: {
    excellent: 200,
    good: 100,
    average: 30,
    poor: 10,
  },
  rating: {
    excellent: 4.8,
    good: 4.5,
    average: 4.0,
    poor: 3.5,
  },
} as const;

interface ReputationCalculationInput {
  averageRating: number; // Note moyenne (0-5)
  totalReviews: number; // Nombre total d'avis
  totalVotes: number; // Nombre total de votes utiles
  responseRate?: number; // Taux de réponse aux messages (0-100)
  completionRate?: number; // Taux de complétion des commandes (0-100)
  // Statistiques détaillées optionnelles
  positiveReviews?: number; // Nombre d'avis positifs (4-5 étoiles)
  communicationRating?: number; // Note de communication (0-5)
  shippingSpeedRating?: number; // Note de rapidité d'envoi (0-5)
}

/**
 * Normalise un score entre 0 et 100 selon des seuils définis
 */
function normalizeScore(
  value: number,
  benchmarks: { excellent: number; good: number; average: number; poor: number }
): number {
  if (value >= benchmarks.excellent) return 100;
  if (value >= benchmarks.good) {
    // Interpolation linéaire entre good et excellent
    const ratio = (value - benchmarks.good) / (benchmarks.excellent - benchmarks.good);
    return 75 + ratio * 25; // 75-100
  }
  if (value >= benchmarks.average) {
    const ratio = (value - benchmarks.average) / (benchmarks.good - benchmarks.average);
    return 50 + ratio * 25; // 50-75
  }
  if (value >= benchmarks.poor) {
    const ratio = (value - benchmarks.poor) / (benchmarks.average - benchmarks.poor);
    return 25 + ratio * 25; // 25-50
  }
  // En dessous du seuil "poor"
  const ratio = value / benchmarks.poor;
  return ratio * 25; // 0-25
}

/**
 * Calcule le score de la note moyenne
 */
function calculateRatingScore(averageRating: number): number {
  // Convertir la note sur 5 en score sur 100
  if (averageRating >= REPUTATION_BENCHMARKS.rating.excellent) return 100;
  if (averageRating >= REPUTATION_BENCHMARKS.rating.good) {
    const ratio =
      (averageRating - REPUTATION_BENCHMARKS.rating.good) /
      (REPUTATION_BENCHMARKS.rating.excellent - REPUTATION_BENCHMARKS.rating.good);
    return 80 + ratio * 20;
  }
  if (averageRating >= REPUTATION_BENCHMARKS.rating.average) {
    const ratio =
      (averageRating - REPUTATION_BENCHMARKS.rating.average) /
      (REPUTATION_BENCHMARKS.rating.good - REPUTATION_BENCHMARKS.rating.average);
    return 60 + ratio * 20;
  }
  if (averageRating >= REPUTATION_BENCHMARKS.rating.poor) {
    const ratio =
      (averageRating - REPUTATION_BENCHMARKS.rating.poor) /
      (REPUTATION_BENCHMARKS.rating.average - REPUTATION_BENCHMARKS.rating.poor);
    return 40 + ratio * 20;
  }
  // En dessous de 3.5
  return (averageRating / REPUTATION_BENCHMARKS.rating.poor) * 40;
}

/**
 * Calcule le score de réputation global
 */
export function calculateReputationScore(input: ReputationCalculationInput): number {
  // Score de la note moyenne (40%)
  const ratingScore = calculateRatingScore(input.averageRating);

  // Score du nombre d'avis (25%)
  const reviewsScore = normalizeScore(input.totalReviews, REPUTATION_BENCHMARKS.reviews);

  // Score des votes positifs (20%)
  const votesScore = normalizeScore(input.totalVotes, REPUTATION_BENCHMARKS.votes);

  // Score du taux de réponse (10%)
  const responseScore = input.responseRate ?? 50; // Par défaut 50%

  // Score du taux de complétion (5%)
  const completionScore = input.completionRate ?? 80; // Par défaut 80%

  // Calcul du score pondéré
  const totalScore =
    (ratingScore * REPUTATION_WEIGHTS.averageRating) / 100 +
    (reviewsScore * REPUTATION_WEIGHTS.totalReviews) / 100 +
    (votesScore * REPUTATION_WEIGHTS.positiveVotes) / 100 +
    (responseScore * REPUTATION_WEIGHTS.responseRate) / 100 +
    (completionScore * REPUTATION_WEIGHTS.completionRate) / 100;

  // Arrondir à l'entier le plus proche
  return Math.round(totalScore);
}

/**
 * Détermine le niveau de réputation en fonction du score
 */
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= REPUTATION_THRESHOLDS.diamond.min) return 'diamond';
  if (score >= REPUTATION_THRESHOLDS.platinum.min) return 'platinum';
  if (score >= REPUTATION_THRESHOLDS.gold.min) return 'gold';
  if (score >= REPUTATION_THRESHOLDS.silver.min) return 'silver';
  if (score >= REPUTATION_THRESHOLDS.bronze.min) return 'bronze';
  return 'nouveau';
}

/**
 * Calcule les données complètes de réputation
 */
export function calculateReputation(input: ReputationCalculationInput): ReputationData {
  const score = calculateReputationScore(input);
  const level = getReputationLevel(score);

  // Trouver le niveau suivant
  const currentThreshold = REPUTATION_THRESHOLDS[level];
  const nextLevelKey = currentThreshold.nextLevel;
  const nextLevelScore = nextLevelKey ? REPUTATION_THRESHOLDS[nextLevelKey].min : undefined;

  // Calculer la progression vers le niveau suivant
  let progress = 0;
  if (nextLevelScore) {
    const currentMin = currentThreshold.min;
    const currentMax = currentThreshold.max;
    const range = currentMax - currentMin + 1;
    const currentProgress = score - currentMin;
    progress = Math.round((currentProgress / range) * 100);
  } else {
    // Niveau maximum atteint
    progress = 100;
  }

  return {
    level,
    averageRating: input.averageRating,
    totalReviews: input.totalReviews,
    totalVotes: input.totalVotes,
    score,
    nextLevelScore,
    progress,
  };
}

/**
 * Obtient une description textuelle du niveau
 */
export function getReputationLevelDescription(level: ReputationLevel): string {
  const descriptions = {
    nouveau: 'Vendeur débutant - Construisez votre réputation !',
    bronze: 'Vendeur fiable - Vous êtes sur la bonne voie',
    silver: 'Bon vendeur - Les clients vous font confiance',
    gold: 'Excellent vendeur - Qualité reconnue',
    platinum: 'Vendeur d\'élite - Excellence constante',
    diamond: 'Vendeur légendaire - Le meilleur du meilleur !',
  };

  return descriptions[level];
}

/**
 * Obtient des conseils pour améliorer la réputation
 */
export function getReputationImprovementTips(input: ReputationCalculationInput): string[] {
  const tips: string[] = [];

  // Conseils basés sur la note moyenne
  if (input.averageRating < 4.5) {
    tips.push('Améliorez la qualité de vos produits et votre service client');
    tips.push('Répondez rapidement aux préoccupations des clients');
  }

  // Conseils basés sur le nombre d'avis
  if (input.totalReviews < 20) {
    tips.push('Encouragez vos clients satisfaits à laisser des avis');
    tips.push('Envoyez un message de remerciement après chaque commande');
  }

  // Conseils basés sur les votes
  if (input.totalVotes < 30) {
    tips.push('Répondez aux avis pour montrer votre engagement');
    tips.push('Fournissez des descriptions détaillées de vos produits');
  }

  // Conseils basés sur le taux de réponse
  if (input.responseRate && input.responseRate < 80) {
    tips.push('Répondez plus rapidement aux messages des clients');
    tips.push('Activez les notifications pour ne manquer aucune question');
  }

  // Conseils basés sur le taux de complétion
  if (input.completionRate && input.completionRate < 90) {
    tips.push('Assurez-vous de bien gérer votre stock');
    tips.push('Expédiez vos commandes rapidement et avec soin');
  }

  return tips;
}

/**
 * Calcule le pourcentage d'avis positifs
 */
export function calculatePositiveReviewsPercentage(
  positiveReviews: number,
  totalReviews: number
): number {
  if (totalReviews === 0) return 0;
  return Math.round((positiveReviews / totalReviews) * 100);
}

/**
 * Détermine si un vendeur mérite un badge vérifié
 */
export function shouldAwardVerifiedBadge(input: ReputationCalculationInput): boolean {
  return (
    input.averageRating >= 4.5 &&
    input.totalReviews >= 50 &&
    (input.responseRate ?? 0) >= 80 &&
    (input.completionRate ?? 0) >= 95
  );
}
