import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan, SubscriptionPlanType, Profile } from '@/types/database';
import {
  Check,
  Crown,
  Zap,
  TrendingUp,
  Package,
  Camera,
  Video,
  Eye,
  Headphones,
  BarChart3,
  Sparkles,
  Target,
  ChevronRight,
  X,
  CreditCard,
  Smartphone,
  Building2,
  Clock,
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const planIcons: Record<SubscriptionPlanType, any> = {
  free: Package,
  starter: Zap,
  pro: TrendingUp,
  premium: Crown,
};

const planColors: Record<SubscriptionPlanType, string> = {
  free: '#6B7280',
  starter: '#3B82F6',
  pro: '#8B5CF6',
  premium: '#F59E0B',
};

// Méthodes de paiement disponibles
const paymentMethods = [
  { id: 'orange_money', name: 'Orange Money', icon: Smartphone, color: '#FF6600' },
  { id: 'wave', name: 'Wave', icon: Smartphone, color: '#1DC8FF' },
  { id: 'free_money', name: 'Free Money', icon: Smartphone, color: '#CD1126' },
  { id: 'card', name: 'Carte Bancaire', icon: CreditCard, color: '#1E40AF' },
  { id: 'bank', name: 'Virement Bancaire', icon: Building2, color: '#059669' },
];

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanType>('free');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // États pour le modal de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'success' | 'error'>('method');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadData();
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (!userData) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        router.back();
        return;
      }
      setUser(userData);

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setCurrentPlan(profileData.subscription_plan || 'free');

      // Calculer les jours restants
      if (profileData.subscription_expires_at) {
        const expiresAt = new Date(profileData.subscription_expires_at);
        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays > 0 ? diffDays : 0);
      }

      // Get available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user || !profile) return;

    // Si plan gratuit
    if (plan.plan_type === 'free') {
      if (currentPlan === 'free') {
        Alert.alert('Info', 'Vous êtes déjà sur le plan gratuit');
      } else {
        Alert.alert(
          'Rétrograder vers Gratuit',
          'Êtes-vous sûr de vouloir passer au plan gratuit ? Vous perdrez tous les avantages de votre plan actuel.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Confirmer',
              style: 'destructive',
              onPress: () => downgradeTtoFree(),
            },
          ]
        );
      }
      return;
    }

    // Si déjà sur ce plan
    if (currentPlan === plan.plan_type) {
      if (daysRemaining && daysRemaining > 0) {
        Alert.alert(
          'Renouveler l\'abonnement',
          `Votre abonnement expire dans ${daysRemaining} jours. Voulez-vous le renouveler maintenant ?`,
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Renouveler',
              onPress: () => openPaymentModal(plan),
            },
          ]
        );
      } else {
        Alert.alert('Info', 'Vous êtes déjà abonné à ce plan');
      }
      return;
    }

    // Ouvrir le modal de paiement
    openPaymentModal(plan);
  };

  const openPaymentModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentStep('method');
    setSelectedPaymentMethod(null);
    setPhoneNumber('');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    setSelectedPaymentMethod(null);
    setPhoneNumber('');
    setPaymentStep('method');
  };

  const downgradeTtoFree = async () => {
    try {
      setSubscribing(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'free',
          is_premium: false,
          subscription_expires_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Enregistrer dans l'historique
      await supabase.from('subscription_history').insert({
        user_id: user.id,
        plan_type: 'free',
        action: 'downgrade',
        amount: 0,
        currency: 'XOF',
      });

      Alert.alert('Succès', 'Vous êtes maintenant sur le plan gratuit');
      await loadData();
    } catch (error: any) {
      console.error('Error downgrading:', error);
      Alert.alert('Erreur', error.message || 'Impossible de rétrograder');
    } finally {
      setSubscribing(false);
    }
  };

  const processPayment = async () => {
    if (!selectedPlan || !selectedPaymentMethod || !user) return;

    // Validation du numéro de téléphone pour mobile money
    if (['orange_money', 'wave', 'free_money'].includes(selectedPaymentMethod)) {
      if (!phoneNumber || phoneNumber.length < 9) {
        Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
        return;
      }
    }

    setPaymentStep('processing');

    try {
      // Simuler le traitement du paiement (2-3 secondes)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Calculer la date d'expiration
      const expiresAt = new Date();
      if (billingPeriod === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: selectedPlan.plan_type,
          is_premium: selectedPlan.plan_type !== 'free',
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Calculer le montant
      const amount = billingPeriod === 'monthly'
        ? selectedPlan.price_monthly
        : (selectedPlan.price_yearly || selectedPlan.price_monthly * 10);

      // Enregistrer dans l'historique
      await supabase.from('subscription_history').insert({
        user_id: user.id,
        plan_type: selectedPlan.plan_type,
        action: currentPlan === selectedPlan.plan_type ? 'renewal' : 'upgrade',
        amount: amount,
        currency: selectedPlan.currency,
        payment_method: selectedPaymentMethod,
        billing_period: billingPeriod,
        expires_at: expiresAt.toISOString(),
      });

      setPaymentStep('success');

      // Recharger les données après 2 secondes
      setTimeout(async () => {
        await loadData();
      }, 2000);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setPaymentStep('error');
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'yearly' && plan.price_yearly) {
      return plan.price_yearly;
    }
    return plan.price_monthly;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'yearly' && plan.price_yearly) {
      const yearlyIfMonthly = plan.price_monthly * 12;
      const savings = yearlyIfMonthly - plan.price_yearly;
      return savings > 0 ? savings : 0;
    }
    return 0;
  };

  const renderFeature = (icon: any, text: string, included: boolean = true) => {
    const Icon = icon;
    return (
      <View style={styles.featureRow}>
        {included ? (
          <Check size={16} color="#10B981" strokeWidth={3} />
        ) : (
          <View style={styles.featureNotIncluded} />
        )}
        <Icon size={16} color={included ? '#6B7280' : '#D1D5DB'} />
        <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>
          {text}
        </Text>
      </View>
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan, index: number) => {
    const Icon = planIcons[plan.plan_type];
    const color = planColors[plan.plan_type];
    const isCurrentPlan = currentPlan === plan.plan_type;
    const isPopular = plan.plan_type === 'pro';
    const price = getPrice(plan);
    const savings = getSavings(plan);

    return (
      <Animated.View
        key={plan.id}
        style={[
          styles.planCardWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}>
        {isPopular && (
          <View style={styles.popularBadge}>
            <Sparkles size={14} color="#FFFFFF" />
            <Text style={styles.popularText}>POPULAIRE</Text>
          </View>
        )}
        {isCurrentPlan && daysRemaining !== null && daysRemaining > 0 && (
          <View style={[styles.currentBadge, { backgroundColor: color }]}>
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.currentBadgeText}>{daysRemaining}j restants</Text>
          </View>
        )}
        <View
          style={[
            styles.planCard,
            isCurrentPlan && styles.planCardActive,
            { borderColor: color },
          ]}>
          {/* Header */}
          <View style={styles.planHeader}>
            <View style={[styles.planIconContainer, { backgroundColor: color + '20' }]}>
              <Icon size={32} color={color} />
            </View>
            <View style={styles.planHeaderText}>
              <Text style={[styles.planName, { color }]}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            {price === 0 ? (
              <Text style={styles.priceFree}>Gratuit</Text>
            ) : (
              <View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>
                    {price.toLocaleString()}
                  </Text>
                  <View>
                    <Text style={styles.priceCurrency}>{plan.currency}</Text>
                    <Text style={styles.pricePeriod}>
                      /{billingPeriod === 'monthly' ? 'mois' : 'an'}
                    </Text>
                  </View>
                </View>
                {savings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>
                      Économisez {savings.toLocaleString()} {plan.currency}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {renderFeature(
              Target,
              `Commission ${plan.commission_rate}%`
            )}
            {renderFeature(
              Package,
              plan.max_products >= 999999
                ? 'Produits illimités'
                : `${plan.max_products} produits max`
            )}
            {renderFeature(
              Eye,
              plan.visibility_boost > 0
                ? `Visibilité +${plan.visibility_boost}%`
                : 'Visibilité standard'
            )}
            {renderFeature(
              Camera,
              plan.hd_photos ? 'Photos HD' : 'Photos standard',
              plan.hd_photos
            )}
            {renderFeature(
              Video,
              plan.video_allowed ? 'Vidéos autorisées' : 'Pas de vidéos',
              plan.video_allowed
            )}
            {plan.badge_name &&
              renderFeature(Check, `Badge "${plan.badge_name}"`)}
            {renderFeature(
              Headphones,
              plan.support_level === 'concierge'
                ? 'Concierge 24/7'
                : plan.support_level === 'vip'
                ? 'Support VIP'
                : plan.support_level === 'priority'
                ? 'Support prioritaire'
                : 'Support standard',
              plan.support_level !== 'standard'
            )}
            {renderFeature(
              BarChart3,
              'Statistiques avancées',
              plan.advanced_analytics
            )}
            {renderFeature(
              Sparkles,
              'Analytics IA',
              plan.ai_analytics
            )}
            {renderFeature(
              TrendingUp,
              'Campagnes sponsorisées',
              plan.sponsored_campaigns
            )}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              { backgroundColor: color },
              isCurrentPlan && daysRemaining && daysRemaining > 0 ? styles.subscribeButtonRenew : undefined,
              subscribing ? styles.subscribeButtonDisabled : undefined,
            ]}
            onPress={() => handleSubscribe(plan)}
            disabled={subscribing}>
            {subscribing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  {isCurrentPlan
                    ? (daysRemaining && daysRemaining > 0 ? 'Renouveler' : 'Plan actuel')
                    : plan.plan_type === 'free'
                    ? 'Passer au gratuit'
                    : 'Choisir ce plan'}
                </Text>
                {(!isCurrentPlan || (daysRemaining && daysRemaining > 0)) && (
                  <ChevronRight size={20} color="#FFFFFF" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderPaymentModal = () => {
    if (!selectedPlan) return null;

    const price = getPrice(selectedPlan);
    const savings = getSavings(selectedPlan);

    return (
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closePaymentModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              {paymentStep !== 'success' && paymentStep !== 'processing' && (
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closePaymentModal}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {paymentStep === 'method' && 'Choisir le paiement'}
                {paymentStep === 'details' && 'Détails du paiement'}
                {paymentStep === 'processing' && 'Traitement en cours'}
                {paymentStep === 'success' && 'Paiement réussi !'}
                {paymentStep === 'error' && 'Erreur de paiement'}
              </Text>
            </View>

            {/* Plan Summary */}
            {paymentStep !== 'success' && paymentStep !== 'error' && (
              <View style={styles.planSummary}>
                <View style={styles.planSummaryRow}>
                  <Text style={styles.planSummaryLabel}>Plan</Text>
                  <Text style={styles.planSummaryValue}>{selectedPlan.name}</Text>
                </View>
                <View style={styles.planSummaryRow}>
                  <Text style={styles.planSummaryLabel}>Période</Text>
                  <View style={styles.billingToggle}>
                    <TouchableOpacity
                      style={[
                        styles.billingOption,
                        billingPeriod === 'monthly' && styles.billingOptionActive,
                      ]}
                      onPress={() => setBillingPeriod('monthly')}>
                      <Text
                        style={[
                          styles.billingOptionText,
                          billingPeriod === 'monthly' && styles.billingOptionTextActive,
                        ]}>
                        Mensuel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.billingOption,
                        billingPeriod === 'yearly' && styles.billingOptionActive,
                      ]}
                      onPress={() => setBillingPeriod('yearly')}>
                      <Text
                        style={[
                          styles.billingOptionText,
                          billingPeriod === 'yearly' && styles.billingOptionTextActive,
                        ]}>
                        Annuel
                      </Text>
                      {selectedPlan.price_yearly && (
                        <Text style={styles.billingDiscount}>-17%</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.planSummaryRow, styles.planSummaryTotal]}>
                  <Text style={styles.planSummaryTotalLabel}>Total</Text>
                  <View style={styles.totalContainer}>
                    <Text style={styles.planSummaryTotalValue}>
                      {price.toLocaleString()} {selectedPlan.currency}
                    </Text>
                    {savings > 0 && (
                      <Text style={styles.savingsSmall}>
                        -{savings.toLocaleString()} {selectedPlan.currency}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Step: Method Selection */}
            {paymentStep === 'method' && (
              <View style={styles.paymentMethods}>
                <Text style={styles.sectionTitle}>Méthode de paiement</Text>
                {paymentMethods.map((method) => {
                  const MethodIcon = method.icon;
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodItem,
                        selectedPaymentMethod === method.id && styles.paymentMethodItemActive,
                      ]}
                      onPress={() => setSelectedPaymentMethod(method.id)}>
                      <View style={[styles.paymentMethodIcon, { backgroundColor: method.color + '20' }]}>
                        <MethodIcon size={24} color={method.color} />
                      </View>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                      {selectedPaymentMethod === method.id && (
                        <Check size={20} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    !selectedPaymentMethod && styles.continueButtonDisabled,
                  ]}
                  disabled={!selectedPaymentMethod}
                  onPress={() => setPaymentStep('details')}>
                  <Text style={styles.continueButtonText}>Continuer</Text>
                  <ChevronRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Payment Details */}
            {paymentStep === 'details' && (
              <View style={styles.paymentDetails}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setPaymentStep('method')}>
                  <ArrowLeft size={20} color="#6B7280" />
                  <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>

                {['orange_money', 'wave', 'free_money'].includes(selectedPaymentMethod || '') && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                    <View style={styles.phoneInputWrapper}>
                      <Text style={styles.phonePrefix}>+221</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="77 123 45 67"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        maxLength={12}
                      />
                    </View>
                    <Text style={styles.inputHint}>
                      Vous recevrez une demande de paiement sur ce numéro
                    </Text>
                  </View>
                )}

                {selectedPaymentMethod === 'card' && (
                  <View style={styles.cardInfo}>
                    <Text style={styles.inputLabel}>Paiement par carte</Text>
                    <Text style={styles.inputHint}>
                      Vous serez redirigé vers une page de paiement sécurisée
                    </Text>
                  </View>
                )}

                {selectedPaymentMethod === 'bank' && (
                  <View style={styles.bankInfo}>
                    <Text style={styles.inputLabel}>Virement bancaire</Text>
                    <View style={styles.bankDetails}>
                      <Text style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Banque: </Text>
                        CBAO
                      </Text>
                      <Text style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>IBAN: </Text>
                        SN08 SN12 3456 7890 1234 5678 901
                      </Text>
                      <Text style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Ref: </Text>
                        {user?.id?.slice(0, 8).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.securityNote}>
                  <Shield size={16} color="#10B981" />
                  <Text style={styles.securityNoteText}>
                    Paiement sécurisé et crypté
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.payButton}
                  onPress={processPayment}>
                  <Text style={styles.payButtonText}>
                    Payer {price.toLocaleString()} {selectedPlan.currency}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Processing */}
            {paymentStep === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.processingText}>
                  Traitement de votre paiement...
                </Text>
                <Text style={styles.processingSubtext}>
                  Ne fermez pas cette fenêtre
                </Text>
              </View>
            )}

            {/* Step: Success */}
            {paymentStep === 'success' && (
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <CheckCircle size={64} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Paiement réussi !</Text>
                <Text style={styles.successText}>
                  Votre abonnement {selectedPlan.name} est maintenant actif.
                </Text>
                <View style={styles.successDetails}>
                  <Text style={styles.successDetailText}>
                    Valide jusqu'au{' '}
                    {new Date(
                      Date.now() + (billingPeriod === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={closePaymentModal}>
                  <Text style={styles.successButtonText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Error */}
            {paymentStep === 'error' && (
              <View style={styles.errorContainer}>
                <View style={styles.errorIconContainer}>
                  <AlertCircle size={64} color="#EF4444" />
                </View>
                <Text style={styles.errorTitle}>Échec du paiement</Text>
                <Text style={styles.errorText}>
                  Une erreur est survenue lors du traitement de votre paiement.
                  Veuillez réessayer.
                </Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => setPaymentStep('method')}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closePaymentModal}>
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Chargement des plans...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plans d'Abonnement</Text>
          <Text style={styles.subtitle}>
            Choisissez le plan qui correspond à vos besoins
          </Text>
        </View>

        {/* Billing Period Toggle */}
        <View style={styles.billingPeriodContainer}>
          <TouchableOpacity
            style={[
              styles.billingPeriodOption,
              billingPeriod === 'monthly' && styles.billingPeriodOptionActive,
            ]}
            onPress={() => setBillingPeriod('monthly')}>
            <Text
              style={[
                styles.billingPeriodText,
                billingPeriod === 'monthly' && styles.billingPeriodTextActive,
              ]}>
              Mensuel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.billingPeriodOption,
              billingPeriod === 'yearly' && styles.billingPeriodOptionActive,
            ]}
            onPress={() => setBillingPeriod('yearly')}>
            <Text
              style={[
                styles.billingPeriodText,
                billingPeriod === 'yearly' && styles.billingPeriodTextActive,
              ]}>
              Annuel
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>-17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Sparkles size={24} color="#F59E0B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Maximisez votre visibilité</Text>
            <Text style={styles.infoText}>
              Chaque plan offre des avantages progressifs pour mettre en valeur
              vos produits et augmenter vos ventes.
            </Text>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => renderPlanCard(plan, index))}
        </View>

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Tous les plans incluent un accès complet à la plateforme et à ses
            fonctionnalités de base. Vous pouvez changer ou annuler votre plan à
            tout moment.
          </Text>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      {renderPaymentModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  billingPeriodContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  billingPeriodOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  billingPeriodOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  billingPeriodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  billingPeriodTextActive: {
    color: '#111827',
  },
  saveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  planCardWrapper: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardActive: {
    borderWidth: 3,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  priceContainer: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  priceFree: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  savingsBadge: {
    marginTop: 8,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureNotIncluded: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  featureTextDisabled: {
    color: '#9CA3AF',
  },
  subscribeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonRenew: {
    backgroundColor: '#059669',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerInfo: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  planSummary: {
    margin: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  planSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  planSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  planSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 2,
  },
  billingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  billingOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  billingOptionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  billingOptionTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  billingDiscount: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  planSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  planSummaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  planSummaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  savingsSmall: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  paymentMethods: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentDetails: {
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  cardInfo: {
    marginBottom: 20,
  },
  bankInfo: {
    marginBottom: 20,
  },
  bankDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  bankDetailRow: {
    fontSize: 14,
    color: '#374151',
  },
  bankDetailLabel: {
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#10B981',
  },
  payButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDetails: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  successDetailText: {
    fontSize: 14,
    color: '#059669',
  },
  successButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
