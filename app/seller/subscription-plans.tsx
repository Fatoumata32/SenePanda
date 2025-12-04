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
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mapping des icônes pour chaque plan
const planIcons: Record<SubscriptionPlanType, { name: string; type: any }> = {
  free: { name: 'cube-outline', type: Ionicons },
  starter: { name: 'flash', type: Ionicons },
  pro: { name: 'trending-up', type: Ionicons },
  premium: { name: 'crown', type: FontAwesome5 },
};

const planColors: Record<SubscriptionPlanType, string> = {
  free: '#6B7280',
  starter: '#3B82F6',
  pro: '#8B5CF6',
  premium: '#F59E0B',
};

// Méthodes de paiement disponibles
const paymentMethods = [
  { id: 'orange_money', name: 'Orange Money', icon: 'phone-portrait-outline', iconType: Ionicons, color: '#FF6600' },
  { id: 'wave', name: 'Wave', icon: 'phone-portrait-outline', iconType: Ionicons, color: '#1DC8FF' },
  { id: 'free_money', name: 'Free Money', icon: 'phone-portrait-outline', iconType: Ionicons, color: '#CD1126' },
  { id: 'card', name: 'Carte Bancaire', icon: 'card-outline', iconType: Ionicons, color: '#1E40AF' },
  { id: 'bank', name: 'Virement Bancaire', icon: 'business-outline', iconType: Ionicons, color: '#059669' },
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

  // Hook de synchronisation en temps réel
  const { subscription, isActive, refresh: refreshSubscription } = useSubscriptionSync(user?.id);

  // États pour le modal de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'confirm' | 'processing' | 'success' | 'error'>('method');
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

  // Recharger les données quand l'abonnement change (en temps réel)
  useEffect(() => {
    if (isActive) {
      console.log('🔄 Abonnement activé - rechargement des données');
      loadData();
    }
  }, [isActive]);

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

      // Get available plans (sans le plan gratuit)
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (plansError) throw plansError;
      // Filtrer pour retirer le plan gratuit
      const paidPlans = (plansData || []).filter(p => p.plan_type !== 'free');
      setPlans(paidPlans);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user || !profile) {
      console.log('❌ Utilisateur non connecté');
      Alert.alert('Erreur', 'Vous devez être connecté pour souscrire à un abonnement');
      return;
    }

    console.log('📋 Tentative d\'abonnement:', {
      planChoisi: plan.name,
      planActuel: currentPlan
    });

    const planHierarchy = { starter: 1, pro: 2, premium: 3 };
    const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
    const newLevel = planHierarchy[plan.plan_type as keyof typeof planHierarchy] || 0;

    // Si déjà sur ce plan - Renouvellement
    if (currentPlan === plan.plan_type) {
      if (daysRemaining && daysRemaining > 0) {
        Alert.alert(
          'Renouveler l\'abonnement',
          `Votre abonnement ${plan.name} expire dans ${daysRemaining} jours. Voulez-vous le renouveler maintenant ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Renouveler',
              onPress: () => openPaymentModal(plan),
            },
          ]
        );
      } else {
        Alert.alert(
          'Renouveler l\'abonnement',
          `Voulez-vous renouveler votre abonnement ${plan.name} ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Renouveler',
              onPress: () => openPaymentModal(plan),
            },
          ]
        );
      }
      return;
    }

    // Upgrade - Passer à un plan supérieur
    if (newLevel > currentLevel) {
      Alert.alert(
        'Passer à un plan supérieur',
        `Voulez-vous passer de ${currentPlan.toUpperCase()} à ${plan.name} ?\n\nVous bénéficierez immédiatement de tous les avantages du nouveau plan.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Continuer',
            onPress: () => openPaymentModal(plan),
          },
        ]
      );
      return;
    }

    // Downgrade - Passer à un plan inférieur
    if (newLevel < currentLevel) {
      Alert.alert(
        'Passer à un plan inférieur',
        `Attention : Vous allez passer de ${currentPlan.toUpperCase()} à ${plan.name}.\n\nVous perdrez certains avantages de votre plan actuel. Êtes-vous sûr ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Continuer',
            style: 'destructive',
            onPress: () => openPaymentModal(plan),
          },
        ]
      );
      return;
    }

    // Cas par défaut - Ouvrir le modal de paiement
    openPaymentModal(plan);
  };

  const openPaymentModal = (plan: SubscriptionPlan) => {
    console.log('🔓 Ouverture du modal de confirmation pour:', plan.name);
    // Définir le plan avant d'ouvrir le modal
    setSelectedPlan(plan);
    setPaymentStep('confirm');
    // Utiliser setTimeout pour s'assurer que l'état est mis à jour
    setTimeout(() => {
      setShowPaymentModal(true);
    }, 0);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    setSelectedPaymentMethod(null);
    setPhoneNumber('');
    setPaymentStep('method');
  };

  const processSubscriptionRequest = async () => {
    if (!selectedPlan || !user) {
      Alert.alert('Erreur', 'Veuillez sélectionner un plan');
      return;
    }

    setPaymentStep('processing');

    try {
      // Créer une demande d'abonnement simple
      const { data: result, error } = await supabase.rpc('request_subscription', {
        p_user_id: user.id,
        p_plan_type: selectedPlan.plan_type,
        p_billing_period: billingPeriod
      });

      if (error) {
        console.error('❌ Erreur:', error);
        throw error;
      }

      // Vérifier le succès
      if (!result || !result.success) {
        throw new Error(result?.error || 'Erreur lors de la demande d\'abonnement');
      }

      console.log('✅ Demande envoyée:', result.request_id);
      console.log('✅ Message:', result.message);

      setPaymentStep('success');

      // Recharger les données et fermer le modal après 3 secondes
      setTimeout(async () => {
        console.log('🔄 Rechargement des données...');
        await loadData();
        setShowPaymentModal(false);
      }, 3000);

    } catch (error: any) {
      console.error('❌ Erreur lors du traitement du paiement:', error);
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // Message d'erreur personnalisé
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        errorMessage = 'La fonction de validation n\'est pas encore installée. Veuillez exécuter COMPLETE_DATABASE_SETUP.sql dans Supabase.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(
        'Erreur de paiement',
        errorMessage,
        [{ text: 'OK' }]
      );
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

  const renderFeature = (iconName: string, text: string, included: boolean = true) => {
    return (
      <View style={styles.featureRow}>
        {included ? (
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
        ) : (
          <View style={styles.featureNotIncluded} />
        )}
        <Ionicons name={iconName as any} size={16} color={included ? '#6B7280' : '#D1D5DB'} />
        <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>
          {text}
        </Text>
      </View>
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan, index: number) => {
    const iconConfig = planIcons[plan.plan_type];

    // Si le plan n'a pas d'icône configurée, ne pas l'afficher
    if (!iconConfig) {
      return null;
    }

    const IconComponent = iconConfig.type;
    const color = planColors[plan.plan_type];
    const isCurrentPlan = currentPlan === plan.plan_type;
    const isPopular = plan.plan_type === 'pro';
    const price = getPrice(plan);
    const savings = getSavings(plan);

    // Déterminer le type de changement de plan
    const planHierarchy = { starter: 1, pro: 2, premium: 3 };
    const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
    const newLevel = planHierarchy[plan.plan_type as keyof typeof planHierarchy] || 0;
    const isUpgrade = newLevel > currentLevel;
    const isDowngrade = newLevel < currentLevel;

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
        {isPopular && !isCurrentPlan && (
          <View style={styles.popularBadge}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            <Text style={styles.popularText}>POPULAIRE</Text>
          </View>
        )}
        {isCurrentPlan && (
          <View style={[styles.currentBadge, { backgroundColor: color }]}>
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            <Text style={styles.currentBadgeText}>
              {daysRemaining && daysRemaining > 0
                ? `PLAN ACTUEL · ${daysRemaining}j restants`
                : 'PLAN ACTUEL'}
            </Text>
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
              <IconComponent name={iconConfig.name} size={32} color={color} />
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
              'pricetag-outline',
              `Commission ${plan.commission_rate}%`
            )}
            {renderFeature(
              'cube-outline',
              plan.max_products >= 999999
                ? 'Produits illimités'
                : `${plan.max_products} produits max`
            )}
            {renderFeature(
              'eye-outline',
              plan.visibility_boost > 0
                ? `Visibilité +${plan.visibility_boost}%`
                : 'Visibilité standard'
            )}
            {renderFeature(
              'camera-outline',
              plan.hd_photos ? 'Photos HD' : 'Photos standard',
              plan.hd_photos
            )}
            {renderFeature(
              'videocam-outline',
              plan.video_allowed ? 'Vidéos autorisées' : 'Pas de vidéos',
              plan.video_allowed
            )}
            {plan.badge_name &&
              renderFeature('ribbon-outline', `Badge "${plan.badge_name}"`)}
            {renderFeature(
              'headset-outline',
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
              'bar-chart-outline',
              'Statistiques avancées',
              plan.advanced_analytics
            )}
            {renderFeature(
              'analytics-outline',
              'Analytics IA',
              plan.ai_analytics
            )}
            {renderFeature(
              'trending-up-outline',
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
                    ? 'Renouveler'
                    : isUpgrade
                    ? 'Passer au plan supérieur'
                    : isDowngrade
                    ? 'Passer au plan inférieur'
                    : 'Choisir ce plan'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderPaymentModal = () => {
    // Ne pas rendre le modal si selectedPlan n'est pas défini ou si le modal n'est pas visible
    if (!selectedPlan || !showPaymentModal) {
      if (!selectedPlan && showPaymentModal) {
        console.log('❌ Modal: selectedPlan est null');
      }
      return null;
    }

    const price = getPrice(selectedPlan);
    const savings = getSavings(selectedPlan);

    console.log('📱 Rendu du modal - Étape:', paymentStep, 'Plan:', selectedPlan.name);

    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent={true}
        onRequestClose={closePaymentModal}
        statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              {paymentStep !== 'success' && paymentStep !== 'processing' && (
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closePaymentModal}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {paymentStep === 'method' && 'Choisir le paiement'}
                {paymentStep === 'details' && 'Détails du paiement'}
                {paymentStep === 'confirm' && 'Confirmation'}
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
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodItem,
                        selectedPaymentMethod === method.id && styles.paymentMethodItemActive,
                      ]}
                      onPress={() => setSelectedPaymentMethod(method.id)}>
                      <View style={[styles.paymentMethodIcon, { backgroundColor: method.color + '20' }]}>
                        <method.iconType name={method.icon as any} size={24} color={method.color} />
                      </View>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                      {selectedPaymentMethod === method.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
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
                  onPress={() => {
                    // Pour les paiements bancaires, passer directement à la confirmation
                    if (selectedPaymentMethod === 'bank') {
                      setPaymentStep('confirm');
                    } else {
                      setPaymentStep('details');
                    }
                  }}>
                  <Text style={styles.continueButtonText}>Continuer</Text>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Payment Details */}
            {paymentStep === 'details' && (
              <View style={styles.paymentDetails}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setPaymentStep('method')}>
                  <Ionicons name="arrow-back" size={20} color="#6B7280" />
                  <Text style={styles.modalBackButtonText}>Retour</Text>
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
                        autoFocus
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
                      Vous serez redirigé vers une page de paiement sécurisée lors de la confirmation
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
                    <Text style={styles.inputHint}>
                      Effectuez le virement puis confirmez pour activer votre abonnement
                    </Text>
                  </View>
                )}

                <View style={styles.securityNote}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={styles.securityNoteText}>
                    Paiement sécurisé et crypté
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.payButton,
                    (['orange_money', 'wave', 'free_money'].includes(selectedPaymentMethod || '') &&
                     (!phoneNumber || phoneNumber.length < 9)) && styles.payButtonDisabled
                  ]}
                  disabled={
                    ['orange_money', 'wave', 'free_money'].includes(selectedPaymentMethod || '') &&
                    (!phoneNumber || phoneNumber.length < 9)
                  }
                  onPress={() => {
                    console.log('✅ Passage à l\'étape de confirmation');
                    setPaymentStep('confirm');
                  }}>
                  <Text style={styles.payButtonText}>
                    Continuer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Confirmation */}
            {paymentStep === 'confirm' && selectedPlan && (
              <View style={styles.confirmContainer}>
                <View style={styles.confirmHeader}>
                  <Ionicons name="checkmark-circle" size={64} color="#F59E0B" />
                  <Text style={styles.confirmTitle}>Demander cet abonnement</Text>
                  <Text style={styles.confirmSubtitle}>
                    Votre demande sera envoyée à l'administrateur pour validation
                  </Text>
                </View>

                <View style={styles.confirmDetails}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Plan choisi:</Text>
                    <Text style={styles.confirmValue}>{selectedPlan.name}</Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Période:</Text>
                    <Text style={styles.confirmValue}>
                      {billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </Text>
                  </View>
                  <View style={[styles.confirmRow, styles.confirmRowTotal]}>
                    <Text style={styles.confirmLabelTotal}>Montant:</Text>
                    <Text style={styles.confirmValueTotal}>
                      {(billingPeriod === 'monthly' ? selectedPlan.price_monthly : (selectedPlan.price_yearly || selectedPlan.price_monthly * 10)).toLocaleString()} {selectedPlan.currency}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Comment ça marche ?</Text>
                    <Text style={styles.infoText}>
                      1. Vous envoyez votre demande d'abonnement{'\n'}
                      2. L'administrateur vérifie et valide{'\n'}
                      3. Votre abonnement est activé{'\n'}
                      4. Vous recevrez une notification de confirmation
                    </Text>
                  </View>
                </View>

                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.confirmButtonPrimary}
                    onPress={processSubscriptionRequest}>
                    <Text style={styles.confirmButtonPrimaryText}>
                      Envoyer la demande
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButtonSecondary}
                    onPress={() => closePaymentModal()}>
                    <Text style={styles.confirmButtonSecondaryText}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.confirmNote}>
                  <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
                  <Text style={styles.confirmNoteText}>
                    Votre paiement est sécurisé et crypté
                  </Text>
                </View>
              </View>
            )}

            {/* Step: Processing */}
            {paymentStep === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.processingText}>
                  Envoi de votre demande...
                </Text>
                <Text style={styles.processingSubtext}>
                  Veuillez patienter
                </Text>
              </View>
            )}

            {/* Step: Success */}
            {paymentStep === 'success' && (
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="time" size={64} color="#F59E0B" />
                </View>
                <Text style={styles.successTitle}>Demande envoyée !</Text>
                <Text style={styles.successText}>
                  Votre demande d'abonnement {selectedPlan.name} a été envoyée à l'administrateur.
                </Text>
                <View style={styles.successDetails}>
                  <Text style={styles.successDetailText}>
                    Vous serez notifié une fois que votre abonnement sera activé.
                  </Text>
                  <Text style={styles.successDetailText}>
                    Status: En attente de validation
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={closePaymentModal}>
                  <Text style={styles.successButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Error */}
            {paymentStep === 'error' && (
              <View style={styles.errorContainer}>
                <View style={styles.errorIconContainer}>
                  <Ionicons name="alert-circle" size={64} color="#EF4444" />
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
          </ScrollView>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Plans d'Abonnement</Text>
            <Text style={styles.subtitle}>
              Choisissez le plan qui correspond à vos besoins
            </Text>
          </View>
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
          <Ionicons name="sparkles" size={24} color="#F59E0B" />
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
    paddingHorizontal: Math.min(20, SCREEN_WIDTH * 0.05),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // Pour centrer le texte malgré la flèche
  },
  title: {
    fontSize: Math.min(32, SCREEN_WIDTH * 0.08),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.min(16, SCREEN_WIDTH * 0.04),
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  billingPeriodContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  billingPeriodOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: Math.min(16, SCREEN_WIDTH * 0.04),
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  infoText: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
    color: '#92400E',
    lineHeight: 20,
  },
  plansContainer: {
    gap: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
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
    padding: Math.min(20, SCREEN_WIDTH * 0.05),
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
    flexWrap: 'wrap',
  },
  planIconContainer: {
    width: Math.min(64, SCREEN_WIDTH * 0.15),
    height: Math.min(64, SCREEN_WIDTH * 0.15),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planHeaderText: {
    flex: 1,
    minWidth: 150,
  },
  planName: {
    fontSize: Math.min(24, SCREEN_WIDTH * 0.06),
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
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
    fontSize: Math.min(32, SCREEN_WIDTH * 0.08),
    fontWeight: '700',
    color: '#10B981',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  priceAmount: {
    fontSize: Math.min(40, SCREEN_WIDTH * 0.1),
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  priceCurrency: {
    fontSize: Math.min(18, SCREEN_WIDTH * 0.045),
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
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
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
  modalScrollContent: {
    flexGrow: 1,
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
  modalBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  modalBackButtonText: {
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
  payButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Confirmation Styles
  confirmContainer: {
    paddingHorizontal: Math.min(20, SCREEN_WIDTH * 0.05),
    paddingVertical: 20,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  confirmTitle: {
    fontSize: Math.min(22, SCREEN_WIDTH * 0.055),
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  confirmDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: Math.min(16, SCREEN_WIDTH * 0.04),
    marginBottom: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  confirmRowTotal: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#F59E0B',
  },
  confirmLabel: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmValue: {
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
    color: '#111827',
    fontWeight: '600',
  },
  confirmLabelTotal: {
    fontSize: Math.min(16, SCREEN_WIDTH * 0.04),
    color: '#111827',
    fontWeight: '700',
  },
  confirmValueTotal: {
    fontSize: Math.min(18, SCREEN_WIDTH * 0.045),
    color: '#F59E0B',
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  confirmActions: {
    gap: 12,
    marginBottom: 16,
  },
  confirmButtonPrimary: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: Math.min(16, SCREEN_WIDTH * 0.04),
    fontWeight: '700',
  },
  confirmButtonSecondary: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonSecondaryText: {
    color: '#6B7280',
    fontSize: Math.min(14, SCREEN_WIDTH * 0.035),
    fontWeight: '600',
  },
  confirmNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  confirmNoteText: {
    fontSize: Math.min(12, SCREEN_WIDTH * 0.03),
    color: '#6B7280',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  // Bank Info Card Styles
  bankInfoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: Math.min(20, SCREEN_WIDTH * 0.05),
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bankInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bankInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  bankInfoDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  bankInfoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  bankInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  bankInfoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  // Payment Proof Styles
  paymentProofSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: Math.min(20, SCREEN_WIDTH * 0.05),
  },
  paymentProofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paymentProofTitle: {
    fontSize: Math.min(16, SCREEN_WIDTH * 0.04),
    fontWeight: '700',
    color: '#111827',
  },
  paymentProofSubtitle: {
    fontSize: Math.min(13, SCREEN_WIDTH * 0.0325),
    color: '#6B7280',
    marginBottom: 16,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    gap: 8,
  },
  imagePickerButtonText: {
    fontSize: Math.min(13, SCREEN_WIDTH * 0.0325),
    color: '#F59E0B',
    fontWeight: '600',
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageValidBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 20,
  },
  imageValidText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
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
