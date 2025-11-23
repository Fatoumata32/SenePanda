import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  ArrowLeft,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Coins,
  MessageSquare,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBonusSystem, useCharitableCauses } from '@/hooks/useBonusSystem';
import PointsDisplay from '@/components/PointsDisplay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import type { CharitableCause } from '@/types/database';

export default function CharityScreen() {
  const router = useRouter();
  const { userPoints, refreshPoints } = useBonusSystem();
  const { causes, loading, donate, refreshCauses } = useCharitableCauses();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCause, setSelectedCause] = useState<CharitableCause | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [donating, setDonating] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshCauses(), refreshPoints()]);
    setRefreshing(false);
  };

  const handleSelectCause = (cause: CharitableCause) => {
    setSelectedCause(cause);
    setDonationAmount('');
    setIsAnonymous(false);
    setMessage('');
  };

  const handleDonate = async () => {
    if (!selectedCause) return;

    const points = parseInt(donationAmount, 10);

    if (isNaN(points) || points < 10) {
      Alert.alert(
        'Montant invalide',
        'Le montant minimum pour un don est de 10 points.',
        [{ text: 'OK' }]
      );
      return;
    }

    const userPointsAmount = userPoints?.points || 0;
    if (points > userPointsAmount) {
      Alert.alert(
        'Points insuffisants',
        `Vous avez ${userPointsAmount} points mais vous essayez de donner ${points} points.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const amountInFCFA = points * 10;

    Alert.alert(
      'Confirmer le don',
      `Voulez-vous faire un don de ${points} points (${amountInFCFA.toLocaleString()} FCFA) à:\n\n${selectedCause.name}\n${selectedCause.organization}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setDonating(true);
            try {
              const result = await donate(
                selectedCause.id,
                points,
                isAnonymous,
                message || null
              );

              if (result.success) {
                Alert.alert(
                  '❤️ Don effectué!',
                  `Merci pour votre générosité!\n\nVous avez donné ${result.points_donated} points (${result.amount_converted?.toLocaleString()} FCFA) à ${result.cause_name}.\n\n${result.message}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setSelectedCause(null);
                        setDonationAmount('');
                        setMessage('');
                        refreshCauses();
                        refreshPoints();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Erreur', result.error || 'Une erreur est survenue', [{ text: 'OK' }]);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'effectuer le don', [{ text: 'OK' }]);
            } finally {
              setDonating(false);
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      education: '📚',
      health: '🏥',
      environment: '🌱',
      poverty: '🤝',
      animals: '🐾',
    };
    return iconMap[category] || '❤️';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string[]> = {
      education: ['#3B82F6', '#2563EB'],
      health: ['#EF4444', '#DC2626'],
      environment: ['#10B981', '#059669'],
      poverty: ['#F59E0B', '#D97706'],
      animals: ['#8B5CF6', '#7C3AED'],
    };
    return colorMap[category] || ['#6366F1', '#4F46E5'];
  };

  const renderCauseCard = (cause: CharitableCause) => {
    const progressPercent = cause.goal_amount
      ? (cause.current_amount / cause.goal_amount) * 100
      : 0;
    const colors = getCategoryColor(cause.category);

    return (
      <TouchableOpacity
        key={cause.id}
        style={styles.causeCard}
        onPress={() => handleSelectCause(cause)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.causeHeader}
        >
          <Text style={styles.causeIcon}>{getCategoryIcon(cause.category)}</Text>
          <View style={styles.causeHeaderInfo}>
            <Text style={styles.causeName}>{cause.name}</Text>
            <Text style={styles.causeOrganization}>{cause.organization}</Text>
          </View>
        </LinearGradient>

        <View style={styles.causeBody}>
          <Text style={styles.causeDescription} numberOfLines={3}>
            {cause.description}
          </Text>

          {cause.goal_amount && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressAmount}>
                  {cause.current_amount.toLocaleString()} FCFA
                </Text>
                <Text style={styles.progressGoal}>
                  sur {cause.goal_amount.toLocaleString()} FCFA
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: colors[0] },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>{Math.round(progressPercent)}% atteint</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.donateButton}
            onPress={() => handleSelectCause(cause)}
          >
            <Heart size={18} color={Colors.white} />
            <Text style={styles.donateButtonText}>Faire un don</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Vue du formulaire de don
  if (selectedCause) {
    const userPointsAmount = userPoints?.points || 0;
    const pointsValue = parseInt(donationAmount, 10) || 0;
    const fcfaValue = pointsValue * 10;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCause(null)}>
            <ArrowLeft size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Faire un don</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.donationContent} showsVerticalScrollIndicator={false}>
          {/* Cause Info */}
          <View style={styles.causeInfo}>
            <LinearGradient
              colors={getCategoryColor(selectedCause.category) as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.causeInfoHeader}
            >
              <Text style={styles.causeInfoIcon}>{getCategoryIcon(selectedCause.category)}</Text>
              <View style={styles.causeInfoText}>
                <Text style={styles.causeInfoName}>{selectedCause.name}</Text>
                <Text style={styles.causeInfoOrg}>{selectedCause.organization}</Text>
              </View>
            </LinearGradient>
            <View style={styles.causeInfoBody}>
              <Text style={styles.causeInfoDescription}>{selectedCause.description}</Text>
            </View>
          </View>

          {/* Available Points */}
          <View style={styles.availablePoints}>
            <Coins size={20} color={Colors.primaryOrange} />
            <Text style={styles.availablePointsText}>
              Vous avez {userPointsAmount.toLocaleString()} points disponibles
            </Text>
          </View>

          {/* Donation Amount */}
          <View style={styles.donationSection}>
            <Text style={styles.sectionTitle}>Montant du don</Text>
            <View style={styles.amountInput}>
              <TextInput
                style={styles.amountTextInput}
                placeholder="Nombre de points (min. 10)"
                placeholderTextColor={Colors.textSecondary}
                value={donationAmount}
                onChangeText={setDonationAmount}
                keyboardType="numeric"
              />
              <Text style={styles.pointsLabel}>points</Text>
            </View>
            {pointsValue > 0 && (
              <Text style={styles.conversionText}>
                = {fcfaValue.toLocaleString()} FCFA (1 point = 10 FCFA)
              </Text>
            )}

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {[10, 50, 100, 500].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setDonationAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Anonymous Option */}
          <TouchableOpacity
            style={styles.anonymousOption}
            onPress={() => setIsAnonymous(!isAnonymous)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isAnonymous && styles.checkboxSelected]}>
              {isAnonymous && <CheckCircle2 size={20} color={Colors.white} />}
            </View>
            <Text style={styles.anonymousText}>Faire un don anonyme</Text>
          </TouchableOpacity>

          {/* Message */}
          <View style={styles.donationSection}>
            <Text style={styles.sectionTitle}>Message (optionnel)</Text>
            <View style={styles.messageInput}>
              <MessageSquare size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.messageTextInput}
                placeholder="Laissez un message d'encouragement..."
                placeholderTextColor={Colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, (donating || pointsValue < 10) && styles.confirmButtonDisabled]}
            onPress={handleDonate}
            disabled={donating || pointsValue < 10}
            activeOpacity={0.8}
          >
            {donating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Heart size={20} color={Colors.white} />
                <Text style={styles.confirmButtonText}>
                  Confirmer le don de {pointsValue || 0} points
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              💡 Votre don sera converti en argent et reversé directement à l'organisation.{'\n\n'}
              🏅 Les donateurs généreux reçoivent des badges spéciaux!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Vue de la liste des causes
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dons Caritatifs</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pointsSection}>
          <PointsDisplay compact showStreak={false} />
        </View>

        <View style={styles.hero}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Heart size={48} color={Colors.white} strokeWidth={2} />
            <Text style={styles.heroTitle}>Aider les Autres</Text>
            <Text style={styles.heroSubtitle}>
              Votre générosité peut changer des vies. Donnez vos points à des causes qui comptent.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryOrange} />
            </View>
          ) : causes.length > 0 ? (
            <View style={styles.causesGrid}>{causes.map(renderCauseCard)}</View>
          ) : (
            <View style={styles.emptyState}>
              <Heart size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucune cause disponible</Text>
              <Text style={styles.emptyText}>
                Revenez plus tard pour découvrir de nouvelles causes!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  headerRight: {
    width: 40,
  },

  // Points Section
  pointsSection: {
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  // Hero
  hero: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  heroGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // Content
  content: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },

  // Causes Grid
  causesGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },

  // Cause Card
  causeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  causeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  causeIcon: {
    fontSize: 40,
  },
  causeHeaderInfo: {
    flex: 1,
  },
  causeName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  causeOrganization: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  causeBody: {
    padding: Spacing.lg,
  },
  causeDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.dark,
    marginBottom: Spacing.lg,
  },

  // Progress
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  progressAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  progressGoal: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Donate Button
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryOrange,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  donateButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Donation Content
  donationContent: {
    flex: 1,
  },
  causeInfo: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  causeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  causeInfoIcon: {
    fontSize: 48,
  },
  causeInfoText: {
    flex: 1,
  },
  causeInfoName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  causeInfoOrg: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  causeInfoBody: {
    padding: Spacing.lg,
  },
  causeInfoDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.dark,
  },

  // Available Points
  availablePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFF7ED',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  availablePointsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryOrange,
  },

  // Donation Section
  donationSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
  },

  // Amount Input
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primaryOrange,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  amountTextInput: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },
  pointsLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  conversionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  // Quick Amounts
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark,
  },

  // Anonymous Option
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.primaryOrange,
    backgroundColor: Colors.primaryOrange,
  },
  anonymousText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.dark,
  },

  // Message Input
  messageInput: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  messageTextInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.dark,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Confirm Button
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryOrange,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    margin: Spacing.lg,
    ...Shadows.medium,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Info Box
  infoBox: {
    backgroundColor: '#DBEAFE',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoBoxText: {
    fontSize: Typography.fontSize.sm,
    color: '#1E40AF',
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
