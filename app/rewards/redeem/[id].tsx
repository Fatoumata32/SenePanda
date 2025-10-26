import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  Gift,
  Coins,
  Check,
  X,
  AlertCircle,
  Volume2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

type Reward = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  category: 'discount' | 'boost' | 'premium' | 'gift';
  value: number | null;
  duration_days: number | null;
  stock: number | null;
  is_active: boolean;
  icon: string | null;
};

type UserPoints = {
  points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

export default function RedeemRewardScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [reward, setReward] = useState<Reward | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadReward();
      loadUserPoints();
    }
  }, [user, id]);

  const loadReward = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setReward(data);
    } catch (error) {
      console.error('Error loading reward:', error);
      Alert.alert('Erreur', 'Impossible de charger cette récompense');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadUserPoints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('points, level')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserPoints(data || { points: 0, level: 'bronze' });
    } catch (error) {
      console.error('Error loading user points:', error);
    }
  };

  const speakConfirmation = () => {
    if (!reward) return;

    Speech.speak(
      `Voulez-vous échanger ${reward.points_cost} points contre ${reward.title}?`,
      { language: 'fr-FR', rate: 0.85 }
    );
  };

  const handleClaim = async () => {
    if (!user || !reward || !userPoints) {
      Alert.alert('Erreur', 'Informations utilisateur manquantes');
      return;
    }

    // Vérifications
    if (userPoints.points < reward.points_cost) {
      Alert.alert(
        '💰 Points insuffisants',
        `Il vous manque ${reward.points_cost - userPoints.points} points.`
      );
      return;
    }

    if (reward.stock !== null && reward.stock <= 0) {
      Alert.alert('❌ Rupture de stock', 'Cette récompense n\'est plus disponible.');
      return;
    }

    setClaiming(true);

    try {
      console.log('🔄 Tentative de réclamation de récompense...', {
        user_id: user.id,
        reward_id: reward.id,
        reward_title: reward.title,
        points_cost: reward.points_cost,
        user_points: userPoints.points
      });

      // Essayer d'abord avec la fonction RPC
      let success = false;
      let userRewardId = null;

      try {
        const { data, error } = await supabase.rpc('redeem_reward', {
          p_user_id: user.id,
          p_reward_id: reward.id,
        });

        console.log('📊 Réponse de redeem_reward:', { data, error });

        if (!error && data && data.success) {
          success = true;
          userRewardId = data.user_reward_id;
          console.log('✅ Réclamation via RPC réussie');
        } else {
          throw new Error('RPC failed, using fallback');
        }
      } catch (rpcError: any) {
        console.log('⚠️ RPC non disponible, utilisation du fallback manuel...', rpcError.message);

        // FALLBACK: Méthode manuelle si la fonction RPC n'existe pas
        // 1. Déduire les points
        const { error: pointsError } = await supabase
          .from('loyalty_points')
          .update({
            points: userPoints.points - reward.points_cost,
          })
          .eq('user_id', user.id);

        if (pointsError) throw pointsError;

        // 2. Créer l'entrée claimed_rewards
        const { data: rewardData, error: rewardError } = await supabase
          .from('claimed_rewards')
          .insert({
            user_id: user.id,
            reward_id: reward.id,
            points_spent: reward.points_cost,
            status: 'active',
            expires_at: reward.duration_days
              ? new Date(Date.now() + reward.duration_days * 24 * 60 * 60 * 1000).toISOString()
              : null,
          })
          .select()
          .single();

        if (rewardError) throw rewardError;
        userRewardId = rewardData.id;

        // 3. Créer la transaction
        const { error: transactionError } = await supabase
          .from('points_transactions')
          .insert({
            user_id: user.id,
            points: -reward.points_cost,
            type: 'redemption',
            description: `Échange: ${reward.title}`,
            reference_id: userRewardId,
          });

        if (transactionError) console.warn('Transaction log failed:', transactionError);

        // 4. Mettre à jour le stock si applicable
        if (reward.stock !== null && reward.stock > 0) {
          const { error: stockError } = await supabase
            .from('rewards')
            .update({ stock: reward.stock - 1 })
            .eq('id', reward.id);

          if (stockError) console.warn('Stock update failed:', stockError);
        }

        success = true;
        console.log('✅ Réclamation via fallback réussie');
      }

      if (!success) {
        throw new Error('La réclamation a échoué');
      }

      // Succès!
      console.log('🎉 Récompense obtenue avec succès!');

      Speech.speak('Récompense obtenue avec succès!', {
        language: 'fr-FR',
        rate: 0.9,
      });

      const remainingPoints = userPoints.points - reward.points_cost;

      Alert.alert(
        '🎉 Récompense obtenue!',
        `Vous avez échangé ${reward.points_cost} points contre "${reward.title}". Il vous reste ${remainingPoints} points.`,
        [
          {
            text: 'Voir mes récompenses',
            onPress: () => router.replace('/rewards'),
          },
        ]
      );
    } catch (error: any) {
      console.error('💥 Erreur complète:', error);

      let errorMessage = 'Une erreur est survenue lors de la réclamation.';

      if (error.message) {
        errorMessage += `\n\nDétails: ${error.message}`;
      }

      if (error.hint) {
        errorMessage += `\n\nIndice: ${error.hint}`;
      }

      if (error.code) {
        errorMessage += `\n\nCode: ${error.code}`;
      }

      Alert.alert('Erreur de réclamation', errorMessage);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  if (!reward) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Récompense introuvable</Text>
      </SafeAreaView>
    );
  }

  const canAfford = userPoints && userPoints.points >= reward.points_cost;
  const outOfStock = reward.stock !== null && reward.stock <= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Réclamation',
          headerShown: true,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Carte récompense */}
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rewardCard}
        >
          <View style={styles.rewardIconCircle}>
            <Gift size={64} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          {reward.description && (
            <Text style={styles.rewardDescription}>{reward.description}</Text>
          )}

          {reward.value && (
            <View style={styles.valueTag}>
              <Text style={styles.valueText}>
                {`${reward.value.toLocaleString()} XOF`}
              </Text>
            </View>
          )}

          {reward.duration_days && (
            <Text style={styles.durationText}>
              Valable {reward.duration_days} jour{reward.duration_days > 1 ? 's' : ''}
            </Text>
          )}
        </LinearGradient>

        {/* Info points */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Coins size={20} color="#F59E0B" />
              <Text style={styles.infoLabelText}>Coût</Text>
            </View>
            <Text style={styles.infoValue}>{reward.points_cost.toLocaleString()} points</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Coins size={20} color={canAfford ? '#10B981' : '#EF4444'} />
              <Text style={styles.infoLabelText}>Votre solde</Text>
            </View>
            <Text style={[
              styles.infoValue,
              { color: canAfford ? '#10B981' : '#EF4444' }
            ]}>
              {userPoints?.points.toLocaleString() || '0'} points
            </Text>
          </View>

          {canAfford && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Check size={20} color="#10B981" />
                  <Text style={styles.infoLabelText}>Après échange</Text>
                </View>
                <Text style={[styles.infoValue, { color: '#10B981' }]}>
                  {((userPoints?.points || 0) - reward.points_cost).toLocaleString()} points
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Alerte stock */}
        {reward.stock !== null && reward.stock <= 10 && reward.stock > 0 && (
          <View style={styles.warningBox}>
            <AlertCircle size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Plus que {reward.stock} disponible{reward.stock > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {outOfStock && (
          <View style={[styles.warningBox, { backgroundColor: '#FEE2E2' }]}>
            <X size={20} color="#DC2626" />
            <Text style={[styles.warningText, { color: '#DC2626' }]}>
              Cette récompense est épuisée
            </Text>
          </View>
        )}

        {!canAfford && !outOfStock && (
          <View style={[styles.warningBox, { backgroundColor: '#FEE2E2' }]}>
            <X size={20} color="#DC2626" />
            <Text style={[styles.warningText, { color: '#DC2626' }]}>
              Points insuffisants ({(reward.points_cost - (userPoints?.points || 0)).toLocaleString()} manquants)
            </Text>
          </View>
        )}

        {/* Bouton audio */}
        <TouchableOpacity
          style={styles.audioButton}
          onPress={speakConfirmation}
        >
          <Volume2 size={24} color="#F59E0B" strokeWidth={2.5} />
          <Text style={styles.audioButtonText}>🔊 Écouter la confirmation</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#6B7280" strokeWidth={2.5} />
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.claimButton,
            (!canAfford || outOfStock || claiming) && styles.claimButtonDisabled,
          ]}
          onPress={handleClaim}
          disabled={!canAfford || outOfStock || claiming}
        >
          {claiming ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <LinearGradient
              colors={canAfford && !outOfStock ? ['#10B981', '#059669'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.claimButtonGradient}
            >
              <Check size={24} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.claimButtonText}>Échanger</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },
  scrollContent: {
    padding: 16,
  },
  rewardCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  rewardIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  valueTag: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  valueText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  durationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    flex: 1,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFEDD5',
    marginBottom: 16,
  },
  audioButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  claimButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  claimButtonDisabled: {
    opacity: 0.5,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
