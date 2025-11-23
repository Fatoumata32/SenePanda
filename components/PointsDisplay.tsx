import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Flame, Gift, TrendingUp } from 'lucide-react-native';
import { useBonusSystem, useDailyStreak } from '@/hooks/useBonusSystem';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useRouter } from 'expo-router';

interface PointsDisplayProps {
  compact?: boolean;
  showStreak?: boolean;
  onPress?: () => void;
}

export default function PointsDisplay({
  compact = false,
  showStreak = true,
  onPress
}: PointsDisplayProps) {
  const router = useRouter();
  const { userPoints, loading: pointsLoading, refreshPoints } = useBonusSystem();
  const { streak, updateDailyStreak, loading: streakLoading } = useDailyStreak();
  const [claiming, setClaiming] = useState(false);

  // Essayer de claim le daily streak au chargement
  useEffect(() => {
    const claimDailyStreak = async () => {
      if (streak && streak.last_login_date !== new Date().toISOString().split('T')[0]) {
        const result = await updateDailyStreak();
        if (result.success && result.points_earned > 0) {
          Alert.alert(
            '🔥 Streak Quotidien!',
            `Vous avez gagné ${result.points_earned} points!\nJour ${result.current_streak} consécutif!`,
            [{ text: 'Super!' }]
          );
          refreshPoints();
        }
      }
    };

    claimDailyStreak();
  }, []);

  const handleClaimStreak = async () => {
    setClaiming(true);
    try {
      const result = await updateDailyStreak();

      if (result.success) {
        if (result.already_logged_today) {
          Alert.alert(
            'Déjà réclamé',
            'Vous avez déjà réclamé votre streak aujourd\'hui!\nRevenez demain pour continuer votre série.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            '🎉 Points Gagnés!',
            `+${result.points_earned} points!\nJour ${result.current_streak} de votre streak!`,
            [{ text: 'Génial!' }]
          );
          refreshPoints();
        }
      }
    } catch (error) {
      console.error('Error claiming streak:', error);
    } finally {
      setClaiming(false);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/rewards' as any);
    }
  };

  if (pointsLoading && !userPoints) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator color={Colors.primaryOrange} />
      </View>
    );
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.containerCompact}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FF8C00', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactGradient}
        >
          <Coins size={16} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.compactPoints}>
            {userPoints?.points?.toLocaleString() || 0}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const totalPoints = userPoints?.points || 0;
  const level = userPoints?.level || 'bronze';

  // Calculer le prochain niveau
  const levelThresholds = {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 15000,
  };

  const levelNames = {
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    platinum: 'Platine',
  };

  const levelColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };

  const nextLevel = level === 'bronze' ? 'silver' : level === 'silver' ? 'gold' : level === 'gold' ? 'platinum' : null;
  const nextLevelPoints = nextLevel ? levelThresholds[nextLevel] : null;
  const currentLevelPoints = levelThresholds[level];
  const progress = nextLevelPoints ? ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100 : 100;

  return (
    <View style={styles.container}>
      {/* Points Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FF8C00', '#FFA500', '#FFB520']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Coins size={24} color={Colors.white} strokeWidth={2.5} />
              <View>
                <Text style={styles.cardLabel}>Vos Points</Text>
                <Text style={styles.cardPoints}>{totalPoints.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.rewardsButton} onPress={handlePress}>
              <Gift size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Level Progress */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <View style={[styles.levelBadge, { backgroundColor: levelColors[level] }]}>
                <Text style={styles.levelText}>{levelNames[level]}</Text>
              </View>
              {nextLevel && nextLevelPoints && (
                <Text style={styles.nextLevelText}>
                  {nextLevelPoints - totalPoints} points → {levelNames[nextLevel]}
                </Text>
              )}
            </View>
            {nextLevel && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Daily Streak Card */}
      {showStreak && (
        <TouchableOpacity
          style={styles.streakCard}
          onPress={handleClaimStreak}
          disabled={claiming || streakLoading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF4500', '#FF6347', '#FF7F50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakGradient}
          >
            <View style={styles.streakHeader}>
              <Flame size={28} color={Colors.white} strokeWidth={2.5} />
              <View style={styles.streakInfo}>
                <Text style={styles.streakLabel}>Streak Quotidien</Text>
                <Text style={styles.streakDays}>{currentStreak} jours</Text>
              </View>
              {claiming || streakLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <TrendingUp size={20} color={Colors.white} />
              )}
            </View>
            <View style={styles.streakFooter}>
              <Text style={styles.streakSubtext}>
                Record: {longestStreak} jours • Jusqu'à 30 pts/jour
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  containerCompact: {
    height: 36,
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  compactPoints: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Points Card
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  gradient: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardLabel: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  cardPoints: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  rewardsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Level Section
  levelSection: {
    marginTop: Spacing.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  levelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  nextLevelText: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: Typography.fontWeight.semibold,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },

  // Streak Card
  streakCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  streakGradient: {
    padding: Spacing.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  streakDays: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  streakFooter: {
    marginTop: Spacing.xs,
  },
  streakSubtext: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
