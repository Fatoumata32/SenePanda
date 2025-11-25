import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import {
  X,
  Check,
  Crown,
  Zap,
  TrendingUp,
  Package,
  Target,
  Eye,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface SubscriptionPlan {
  id: string;
  plan_type: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly?: number;
  currency: string;
  commission_rate: number;
  max_products: number;
  visibility_boost: number;
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const planIcons: Record<string, any> = {
  free: Package,
  starter: Zap,
  pro: TrendingUp,
  premium: Crown,
};

const planColors: Record<string, string> = {
  free: '#6B7280',
  starter: '#3B82F6',
  pro: '#8B5CF6',
  premium: '#F59E0B',
};

const paymentMethods = [
  { id: 'orange_money', name: 'Orange Money', icon: Smartphone, color: '#FF6600' },
  { id: 'wave', name: 'Wave', icon: Smartphone, color: '#1DC8FF' },
  { id: 'free_money', name: 'Free Money', icon: Smartphone, color: '#CD1126' },
  { id: 'card', name: 'Carte Bancaire', icon: CreditCard, color: '#1E40AF' },
];

export default function SubscriptionModal({ visible, onClose, onSuccess }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [userId, setUserId] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // États pour le paiement
  const [step, setStep] = useState<'plans' | 'payment' | 'details' | 'processing' | 'success' | 'error'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (visible) {
      loadData();
      setStep('plans');
      setSelectedPlan(null);
      setSelectedPaymentMethod(null);
      setPhoneNumber('');
    }
  }, [visible]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Get current plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_expires_at')
        .eq('id', user.id)
        .single();

      setCurrentPlan(profile?.subscription_plan || 'free');

      // Calculer jours restants
      if (profile?.subscription_expires_at) {
        const expiresAt = new Date(profile.subscription_expires_at);
        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays > 0 ? diffDays : 0);
      }

      // Get plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      setPlans(plansData || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.plan_type === 'free') {
      if (currentPlan === 'free') {
        Alert.alert('Info', 'Vous êtes déjà sur le plan gratuit');
      } else {
        Alert.alert(
          'Rétrograder',
          'Voulez-vous passer au plan gratuit ?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Confirmer',
              style: 'destructive',
              onPress: () => downgradeToFree(),
            },
          ]
        );
      }
      return;
    }

    setSelectedPlan(plan);
    setStep('payment');
  };

  const downgradeToFree = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'free',
          is_premium: false,
          subscription_expires_at: null,
        })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Succès', 'Vous êtes maintenant sur le plan gratuit');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const processPayment = async () => {
    if (!selectedPlan || !selectedPaymentMethod || !userId) return;

    if (['orange_money', 'wave', 'free_money'].includes(selectedPaymentMethod)) {
      if (!phoneNumber || phoneNumber.length < 9) {
        Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
        return;
      }
    }

    setStep('processing');

    try {
      // Simuler le traitement
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Calculer expiration
      const expiresAt = new Date();
      if (billingPeriod === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // Mettre à jour le profil
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: selectedPlan.plan_type,
          is_premium: true,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Enregistrer dans l'historique
      const amount = billingPeriod === 'monthly'
        ? selectedPlan.price_monthly
        : (selectedPlan.price_yearly || selectedPlan.price_monthly * 10);

      await supabase.from('subscription_history').insert({
        user_id: userId,
        plan_type: selectedPlan.plan_type,
        action: 'upgrade',
        amount,
        currency: selectedPlan.currency,
        payment_method: selectedPaymentMethod,
        billing_period: billingPeriod,
        expires_at: expiresAt.toISOString(),
      });

      setStep('success');
    } catch (error: any) {
      console.error('Payment error:', error);
      setStep('error');
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'yearly' && plan.price_yearly) {
      return plan.price_yearly;
    }
    return plan.price_monthly;
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const Icon = planIcons[plan.plan_type] || Package;
    const color = planColors[plan.plan_type] || '#6B7280';
    const isCurrentPlan = currentPlan === plan.plan_type;
    const isPopular = plan.plan_type === 'pro';
    const price = getPrice(plan);

    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planCard, isCurrentPlan && { borderColor: color, borderWidth: 2 }]}
        onPress={() => handleSelectPlan(plan)}
        activeOpacity={0.7}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.popularText}>POPULAIRE</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={[styles.planIconContainer, { backgroundColor: color + '20' }]}>
            <Icon size={24} color={color} />
          </View>
          <View style={styles.planInfo}>
            <Text style={[styles.planName, { color }]}>{plan.name}</Text>
            <Text style={styles.planDescription} numberOfLines={1}>
              {plan.description}
            </Text>
          </View>
          {isCurrentPlan && daysRemaining !== null && daysRemaining > 0 && (
            <View style={[styles.daysBadge, { backgroundColor: color }]}>
              <Clock size={10} color="#FFF" />
              <Text style={styles.daysText}>{daysRemaining}j</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          {price === 0 ? (
            <Text style={styles.priceFree}>Gratuit</Text>
          ) : (
            <>
              <Text style={styles.priceAmount}>{price.toLocaleString()}</Text>
              <Text style={styles.priceCurrency}>
                {plan.currency}/{billingPeriod === 'monthly' ? 'mois' : 'an'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Check size={14} color="#10B981" />
            <Text style={styles.featureText}>Commission {plan.commission_rate}%</Text>
          </View>
          <View style={styles.featureItem}>
            <Check size={14} color="#10B981" />
            <Text style={styles.featureText}>
              {plan.max_products >= 999999 ? 'Produits illimités' : `${plan.max_products} produits`}
            </Text>
          </View>
          {plan.visibility_boost > 0 && (
            <View style={styles.featureItem}>
              <Check size={14} color="#10B981" />
              <Text style={styles.featureText}>Visibilité +{plan.visibility_boost}%</Text>
            </View>
          )}
        </View>

        <View style={[styles.selectButton, { backgroundColor: isCurrentPlan ? '#10B981' : color }]}>
          <Text style={styles.selectButtonText}>
            {isCurrentPlan ? 'Plan actuel' : 'Choisir'}
          </Text>
          {!isCurrentPlan && <ChevronRight size={16} color="#FFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentStep = () => (
    <View style={styles.paymentContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('plans')}>
        <ArrowLeft size={20} color="#6B7280" />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      {selectedPlan && (
        <View style={styles.planSummary}>
          <Text style={styles.summaryTitle}>{selectedPlan.name}</Text>
          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[styles.billingOption, billingPeriod === 'monthly' && styles.billingActive]}
              onPress={() => setBillingPeriod('monthly')}
            >
              <Text style={[styles.billingText, billingPeriod === 'monthly' && styles.billingTextActive]}>
                Mensuel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.billingOption, billingPeriod === 'yearly' && styles.billingActive]}
              onPress={() => setBillingPeriod('yearly')}
            >
              <Text style={[styles.billingText, billingPeriod === 'yearly' && styles.billingTextActive]}>
                Annuel
              </Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-17%</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.totalPrice}>
            {getPrice(selectedPlan).toLocaleString()} {selectedPlan.currency}
          </Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Méthode de paiement</Text>
      {paymentMethods.map((method) => {
        const MethodIcon = method.icon;
        return (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === method.id && styles.paymentMethodActive,
            ]}
            onPress={() => setSelectedPaymentMethod(method.id)}
          >
            <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
              <MethodIcon size={20} color={method.color} />
            </View>
            <Text style={styles.methodName}>{method.name}</Text>
            {selectedPaymentMethod === method.id && <Check size={20} color="#10B981" />}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.continueBtn, !selectedPaymentMethod && styles.continueBtnDisabled]}
        onPress={() => setStep('details')}
        disabled={!selectedPaymentMethod}
      >
        <Text style={styles.continueBtnText}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.detailsContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep('payment')}>
        <ArrowLeft size={20} color="#6B7280" />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      {['orange_money', 'wave', 'free_money'].includes(selectedPaymentMethod || '') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Numéro de téléphone</Text>
          <View style={styles.phoneInput}>
            <Text style={styles.phonePrefix}>+221</Text>
            <TextInput
              style={styles.phoneField}
              placeholder="77 123 45 67"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={12}
            />
          </View>
        </View>
      )}

      {selectedPaymentMethod === 'card' && (
        <View style={styles.cardInfo}>
          <Text style={styles.inputLabel}>Paiement sécurisé</Text>
          <Text style={styles.cardHint}>Vous serez redirigé vers une page sécurisée</Text>
        </View>
      )}

      <View style={styles.securityNote}>
        <Shield size={16} color="#10B981" />
        <Text style={styles.securityText}>Paiement sécurisé et crypté</Text>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={processPayment}>
        <Text style={styles.payBtnText}>
          Payer {selectedPlan ? getPrice(selectedPlan).toLocaleString() : ''} {selectedPlan?.currency}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.statusContainer}>
      <ActivityIndicator size="large" color={Colors.primaryOrange} />
      <Text style={styles.statusTitle}>Traitement en cours...</Text>
      <Text style={styles.statusSubtext}>Ne fermez pas cette fenêtre</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContainer}>
      <CheckCircle size={64} color="#10B981" />
      <Text style={styles.successTitle}>Paiement réussi !</Text>
      <Text style={styles.statusSubtext}>
        Votre abonnement {selectedPlan?.name} est maintenant actif.
      </Text>
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => {
          onSuccess?.();
          onClose();
        }}
      >
        <Text style={styles.doneBtnText}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.statusContainer}>
      <AlertCircle size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Échec du paiement</Text>
      <Text style={styles.statusSubtext}>Une erreur est survenue. Veuillez réessayer.</Text>
      <View style={styles.errorActions}>
        <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('payment')}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === 'plans' && 'Abonnements'}
              {step === 'payment' && 'Paiement'}
              {step === 'details' && 'Détails'}
              {step === 'processing' && 'Traitement'}
              {step === 'success' && 'Succès'}
              {step === 'error' && 'Erreur'}
            </Text>
            {step !== 'processing' && step !== 'success' && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryOrange} />
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {step === 'plans' && (
                <>
                  <View style={styles.periodToggle}>
                    <TouchableOpacity
                      style={[styles.periodOption, billingPeriod === 'monthly' && styles.periodActive]}
                      onPress={() => setBillingPeriod('monthly')}
                    >
                      <Text style={[styles.periodText, billingPeriod === 'monthly' && styles.periodTextActive]}>
                        Mensuel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.periodOption, billingPeriod === 'yearly' && styles.periodActive]}
                      onPress={() => setBillingPeriod('yearly')}
                    >
                      <Text style={[styles.periodText, billingPeriod === 'yearly' && styles.periodTextActive]}>
                        Annuel
                      </Text>
                      <View style={styles.saveBadge}>
                        <Text style={styles.saveText}>-17%</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {plans.map(renderPlanCard)}
                  <Text style={styles.footerText}>
                    Changez ou annulez votre plan à tout moment.
                  </Text>
                </>
              )}
              {step === 'payment' && renderPaymentStep()}
              {step === 'details' && renderDetailsStep()}
              {step === 'processing' && renderProcessing()}
              {step === 'success' && renderSuccess()}
              {step === 'error' && renderError()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  periodOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  periodActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#111827',
  },
  saveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceFree: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  priceCurrency: {
    fontSize: 14,
    color: '#6B7280',
  },
  features: {
    marginBottom: 12,
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  // Payment styles
  paymentContainer: {
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: '#6B7280',
  },
  planSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  billingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  billingActive: {
    backgroundColor: '#FFFFFF',
  },
  billingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  billingTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  continueBtn: {
    backgroundColor: Colors.primaryOrange,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  continueBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Details styles
  detailsContainer: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
  },
  phoneField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  cardInfo: {
    marginBottom: 20,
  },
  cardHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
  },
  payBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Status styles
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 20,
  },
  doneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 10,
    marginTop: 24,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  retryBtn: {
    backgroundColor: Colors.primaryOrange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
