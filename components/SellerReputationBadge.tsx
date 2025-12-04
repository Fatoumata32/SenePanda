import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export type ReputationLevel = 'nouveau' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface ReputationData {
  level: ReputationLevel;
  averageRating: number;
  totalReviews: number;
  totalVotes: number;
  score: number; // Score global sur 100
  nextLevelScore?: number;
  progress?: number; // Progression vers le niveau suivant (0-100)
}

interface SellerReputationBadgeProps {
  reputation: ReputationData;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  showProgress?: boolean;
  capturable?: boolean; // Pour la capture d'écran lors du partage
}

const getLevelConfig = (level: ReputationLevel) => {
  const configs = {
    nouveau: {
      label: 'Nouveau',
      color: '#94A3B8',
      gradientStart: '#94A3B8',
      gradientEnd: '#64748B',
      icon: 'leaf-outline' as const,
      emoji: '🌱',
    },
    bronze: {
      label: 'Bronze',
      color: '#CD7F32',
      gradientStart: '#CD7F32',
      gradientEnd: '#8B5A2B',
      icon: 'shield-outline' as const,
      emoji: '🥉',
    },
    silver: {
      label: 'Argent',
      color: '#C0C0C0',
      gradientStart: '#E5E4E2',
      gradientEnd: '#A8A9AD',
      icon: 'shield-checkmark-outline' as const,
      emoji: '🥈',
    },
    gold: {
      label: 'Or',
      color: '#FFD700',
      gradientStart: '#FFD700',
      gradientEnd: '#DAA520',
      icon: 'star-outline' as const,
      emoji: '🥇',
    },
    platinum: {
      label: 'Platine',
      color: '#E5E4E2',
      gradientStart: '#E5E4E2',
      gradientEnd: '#B4B4B8',
      icon: 'diamond-outline' as const,
      emoji: '💎',
    },
    diamond: {
      label: 'Diamant',
      color: '#B9F2FF',
      gradientStart: '#B9F2FF',
      gradientEnd: '#00CED1',
      icon: 'diamond' as const,
      emoji: '💠',
    },
  };

  return configs[level] || configs.nouveau;
};

const getSizeConfig = (size: 'small' | 'medium' | 'large') => {
  const configs = {
    small: {
      badgeSize: 40,
      iconSize: 20,
      fontSize: 11,
      detailsFontSize: 10,
    },
    medium: {
      badgeSize: 60,
      iconSize: 28,
      fontSize: 13,
      detailsFontSize: 12,
    },
    large: {
      badgeSize: 80,
      iconSize: 36,
      fontSize: 15,
      detailsFontSize: 13,
    },
  };

  return configs[size];
};

const SellerReputationBadge = forwardRef<View, SellerReputationBadgeProps>(({
  reputation,
  size = 'medium',
  showDetails = true,
  showProgress = false,
  capturable = false,
}, ref) => {
  const levelConfig = getLevelConfig(reputation.level);
  const sizeConfig = getSizeConfig(size);

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(reputation.averageRating);
    const hasHalfStar = reputation.averageRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={14} color={Colors.primaryGold} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={14} color={Colors.primaryGold} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={14} color="#CBD5E1" />
        );
      }
    }

    return stars;
  };

  return (
    <View ref={ref} style={[styles.container, capturable && styles.capturableContainer]}>
      {/* Badge principal */}
      <View style={styles.badgeContainer}>
        <View
          style={[
            styles.badge,
            {
              width: sizeConfig.badgeSize,
              height: sizeConfig.badgeSize,
              backgroundColor: levelConfig.gradientStart,
              borderColor: levelConfig.gradientEnd,
            },
          ]}
        >
          <Text style={{ fontSize: sizeConfig.iconSize }}>
            {levelConfig.emoji}
          </Text>
        </View>

        {/* Nom du niveau */}
        <View style={styles.levelContainer}>
          <Text
            style={[
              styles.levelText,
              {
                fontSize: sizeConfig.fontSize,
                color: levelConfig.color,
              },
            ]}
          >
            {levelConfig.label}
          </Text>
        </View>
      </View>

      {/* Détails */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          {/* Note moyenne */}
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>{renderStars()}</View>
            <Text style={styles.ratingText}>
              {reputation.averageRating.toFixed(1)}
            </Text>
          </View>

          {/* Statistiques */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="chatbox-outline" size={14} color={Colors.gray} />
              <Text style={styles.statText}>
                {reputation.totalReviews} avis
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="thumbs-up-outline" size={14} color={Colors.gray} />
              <Text style={styles.statText}>
                {reputation.totalVotes} votes
              </Text>
            </View>
          </View>

          {/* Score global */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score de réputation</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${reputation.score}%`,
                    backgroundColor: levelConfig.gradientStart,
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreText}>{reputation.score}/100</Text>
          </View>

          {/* Barre de progression vers le niveau suivant */}
          {showProgress && reputation.nextLevelScore && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                Progression vers le niveau suivant
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${reputation.progress || 0}%`,
                      backgroundColor: levelConfig.gradientEnd,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {reputation.score}/{reputation.nextLevelScore} points
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

SellerReputationBadge.displayName = 'SellerReputationBadge';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  capturableContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    borderRadius: 100,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  levelContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  levelText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsContainer: {
    width: '100%',
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
  scoreContainer: {
    gap: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 11,
    color: Colors.gray,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressContainer: {
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: Colors.gray,
    textAlign: 'center',
  },
});

export default SellerReputationBadge;
