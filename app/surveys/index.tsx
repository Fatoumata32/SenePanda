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
  ClipboardList,
  ArrowLeft,
  Star,
  CheckCircle2,
  Clock,
  Users,
  Award,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBonusSystem, useSurveys } from '@/hooks/useBonusSystem';
import PointsDisplay from '@/components/PointsDisplay';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import type { Survey, SurveyQuestion } from '@/types/database';

export default function SurveysScreen() {
  const router = useRouter();
  const { userPoints, refreshPoints } = useBonusSystem();
  const { surveys, loading, submitSurvey, refreshSurveys } = useSurveys();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshSurveys(), refreshPoints()]);
    setRefreshing(false);
  };

  const handleStartSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setAnswers({});
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitSurvey = async () => {
    if (!selectedSurvey) return;

    // Vérifier que toutes les questions requises ont une réponse
    const unansweredRequired = selectedSurvey.questions.filter(
      (q) => q.required && !answers[q.id]
    );

    if (unansweredRequired.length > 0) {
      Alert.alert(
        'Questions manquantes',
        'Veuillez répondre à toutes les questions obligatoires.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitSurvey(selectedSurvey.id, answers);

      if (result.success) {
        Alert.alert(
          '🎉 Sondage complété!',
          `Félicitations! Vous avez gagné ${result.points_earned} points!\n\n${result.message}`,
          [
            {
              text: 'Super!',
              onPress: () => {
                setSelectedSurvey(null);
                setAnswers({});
                refreshSurveys();
                refreshPoints();
              },
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de soumettre le sondage', [{ text: 'OK' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'rating':
        return (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {index + 1}. {question.question}
              {question.required && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={styles.ratingButton}
                  onPress={() => handleAnswerChange(question.id, rating)}
                >
                  <Star
                    size={32}
                    color={answer >= rating ? '#FFB800' : '#E5E5E5'}
                    fill={answer >= rating ? '#FFB800' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'multiple_choice':
        return (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {index + 1}. {question.question}
              {question.required && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.optionsContainer}>
              {question.options?.map((option, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionButton,
                    answer === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleAnswerChange(question.id, option)}
                >
                  <View
                    style={[
                      styles.radioButton,
                      answer === option && styles.radioButtonSelected,
                    ]}
                  >
                    {answer === option && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      answer === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'text':
        return (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {index + 1}. {question.question}
              {question.required && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Votre réponse..."
              placeholderTextColor={Colors.textSecondary}
              value={answer || ''}
              onChangeText={(text) => handleAnswerChange(question.id, text)}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'yes_no':
        return (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {index + 1}. {question.question}
              {question.required && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[styles.yesNoButton, answer === true && styles.yesNoButtonSelected]}
                onPress={() => handleAnswerChange(question.id, true)}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    answer === true && styles.yesNoTextSelected,
                  ]}
                >
                  Oui
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yesNoButton, answer === false && styles.yesNoButtonSelected]}
                onPress={() => handleAnswerChange(question.id, false)}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    answer === false && styles.yesNoTextSelected,
                  ]}
                >
                  Non
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderSurveyCard = (survey: Survey) => {
    const isExpired = !!(survey.ends_at && new Date(survey.ends_at) < new Date());
    const isFull = !!(survey.max_responses && survey.current_responses >= survey.max_responses);
    const isDisabled = isExpired || isFull;

    return (
      <TouchableOpacity
        key={survey.id}
        style={[styles.surveyCard, isDisabled ? styles.surveyCardDisabled : null]}
        onPress={() => !isDisabled && handleStartSurvey(survey)}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.surveyIcon}
        >
          <ClipboardList size={24} color={Colors.white} />
        </LinearGradient>

        <View style={styles.surveyInfo}>
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          <Text style={styles.surveyDescription} numberOfLines={2}>
            {survey.description}
          </Text>

          <View style={styles.surveyMeta}>
            <View style={styles.metaItem}>
              <Users size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {survey.current_responses}
                {survey.max_responses ? `/${survey.max_responses}` : '+'} réponses
              </Text>
            </View>

            {survey.ends_at && (
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  Expire le{' '}
                  {new Date(survey.ends_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.surveyReward}>
          <Award size={20} color={Colors.primaryOrange} />
          <Text style={styles.rewardPoints}>+{survey.points_reward}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Vue du sondage en cours
  if (selectedSurvey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Alert.alert(
                'Quitter le sondage?',
                'Vos réponses seront perdues si vous quittez maintenant.',
                [
                  { text: 'Continuer', style: 'cancel' },
                  {
                    text: 'Quitter',
                    style: 'destructive',
                    onPress: () => {
                      setSelectedSurvey(null);
                      setAnswers({});
                    },
                  },
                ]
              );
            }}
          >
            <ArrowLeft size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedSurvey.title}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.surveyContent} showsVerticalScrollIndicator={false}>
          <View style={styles.surveyHeader}>
            <Text style={styles.surveyHeaderTitle}>{selectedSurvey.title}</Text>
            {selectedSurvey.description && (
              <Text style={styles.surveyHeaderDescription}>{selectedSurvey.description}</Text>
            )}
            <View style={styles.rewardBanner}>
              <Award size={20} color={Colors.primaryOrange} />
              <Text style={styles.rewardBannerText}>
                Gagnez {selectedSurvey.points_reward} points en complétant ce sondage!
              </Text>
            </View>
          </View>

          {selectedSurvey.questions.map((question, index) => renderQuestion(question, index))}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitSurvey}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <CheckCircle2 size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Soumettre mes réponses</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Vue de la liste des sondages
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sondages</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pointsSection}>
          <PointsDisplay compact showStreak={false} />
        </View>

        <View style={styles.infoCard}>
          <ClipboardList size={20} color={Colors.primaryOrange} />
          <Text style={styles.infoText}>
            Partagez votre avis et gagnez des points! Chaque sondage vous rapporte des récompenses.
          </Text>
        </View>

        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryOrange} />
            </View>
          ) : surveys.length > 0 ? (
            <View style={styles.surveysGrid}>{surveys.map(renderSurveyCard)}</View>
          ) : (
            <View style={styles.emptyState}>
              <ClipboardList size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucun sondage disponible</Text>
              <Text style={styles.emptyText}>
                Revenez plus tard pour découvrir de nouveaux sondages!
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

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.dark,
  },

  // Content
  content: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },

  // Surveys Grid
  surveysGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  // Survey Card
  surveyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.medium,
  },
  surveyCardDisabled: {
    opacity: 0.5,
  },
  surveyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  surveyDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  surveyMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  surveyReward: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rewardPoints: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryOrange,
  },

  // Survey Content
  surveyContent: {
    flex: 1,
  },
  surveyHeader: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  surveyHeaderTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  surveyHeaderDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFF7ED',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  rewardBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryOrange,
  },

  // Question Card
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    margin: Spacing.lg,
    ...Shadows.small,
  },
  questionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark,
    marginBottom: Spacing.lg,
  },
  required: {
    color: '#EF4444',
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ratingButton: {
    padding: Spacing.xs,
  },

  // Options
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  optionButtonSelected: {
    borderColor: Colors.primaryOrange,
    backgroundColor: '#FFF7ED',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primaryOrange,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primaryOrange,
  },
  optionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.dark,
  },
  optionTextSelected: {
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryOrange,
  },

  // Text Input
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.dark,
    textAlignVertical: 'top',
    minHeight: 100,
  },

  // Yes/No
  yesNoContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  yesNoButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    borderColor: Colors.primaryOrange,
    backgroundColor: '#FFF7ED',
  },
  yesNoText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.dark,
  },
  yesNoTextSelected: {
    color: Colors.primaryOrange,
  },

  // Submit Button
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
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
