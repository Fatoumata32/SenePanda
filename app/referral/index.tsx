import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Clipboard,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  Users,
  Gift,
  Copy,
  Share2,
  Check,
  Volume2,
  Award,
  TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

type ReferralStats = {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  total_points_earned: number;
};

type Referral = {
  id: string;
  referred_username: string;
  status: 'pending' | 'completed';
  referrer_points: number;
  created_at: string;
  completed_at: string | null;
};

export default function ReferralScreen() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      // Charger le code de parrainage
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Charger les statistiques
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          referrer_points,
          created_at,
          completed_at,
          referred:profiles!referred_id(username)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsData) {
        const total = referralsData.length;
        const pending = referralsData.filter(r => r.status === 'pending').length;
        const completed = referralsData.filter(r => r.status === 'completed').length;
        const totalPoints = referralsData
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + r.referrer_points, 0);

        setStats({
          total_referrals: total,
          pending_referrals: pending,
          completed_referrals: completed,
          total_points_earned: totalPoints,
        });

        // Formater les parrainages
        const formattedReferrals = referralsData.map(r => ({
          id: r.id,
          referred_username: (r.referred as any)?.username || 'Utilisateur',
          status: r.status,
          referrer_points: r.referrer_points,
          created_at: r.created_at,
          completed_at: r.completed_at,
        }));

        setReferrals(formattedReferrals);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    await Clipboard.setString(referralCode);
    setCopied(true);
    Speech.speak('Code copié', { language: 'fr-FR', rate: 0.9 });

    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Rejoins-moi sur SenePanda avec mon code de parrainage ${referralCode} et reçois 50 Panda Coins gratuits! 🎁`,
        title: 'Parrainage SenePanda',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const speakInstructions = () => {
    Speech.speak(
      `Partagez votre code ${referralCode.split('').join(' ')} avec vos amis. Vous gagnez 200 points quand ils font leur premier achat. Ils reçoivent 50 points de bienvenue.`,
      { language: 'fr-FR', rate: 0.8 }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Parrainage' }} />
        <View style={styles.emptyContainer}>
          <Users size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Connectez-vous pour parrainer vos amis</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Parrainage',
          headerShown: true,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconCircle}>
            <Users size={48} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={styles.heroTitle}>Parrainez vos amis</Text>
          <Text style={styles.heroSubtitle}>
            Gagnez 200 points par ami qui fait un achat
          </Text>
        </LinearGradient>

        {/* Code de parrainage */}
        <View style={styles.codeSection}>
          <View style={styles.codeLabelRow}>
            <Text style={styles.codeLabel}>Votre code de parrainage</Text>
            <TouchableOpacity
              style={styles.audioButton}
              onPress={speakInstructions}
            >
              <Volume2 size={20} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.codeCard}>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={copyCode}
            >
              {copied ? (
                <Check size={24} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Copy size={24} color="#FFFFFF" strokeWidth={2.5} />
              )}
              <Text style={styles.actionButtonText}>
                {copied ? 'Copié!' : 'Copier'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareCode}
            >
              <Share2 size={24} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.actionButtonText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comment ça marche */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Partagez votre code</Text>
              <Text style={styles.stepDescription}>
                Envoyez votre code de parrainage à vos amis
              </Text>
            </View>
            <Share2 size={32} color="#10B981" />
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ils s'inscrivent</Text>
              <Text style={styles.stepDescription}>
                Votre ami reçoit 50 points de bienvenue
              </Text>
            </View>
            <Gift size={32} color="#F59E0B" />
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Premier achat</Text>
              <Text style={styles.stepDescription}>
                Vous recevez 200 points quand il achète
              </Text>
            </View>
            <Award size={32} color="#10B981" />
          </View>
        </View>

        {/* Statistiques */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Vos statistiques</Text>

            <View style={styles.statsGrid}>
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.statCard}
              >
                <Users size={32} color="#2563EB" />
                <Text style={styles.statValue}>{String(stats.total_referrals)}</Text>
                <Text style={styles.statLabel}>Total parrainages</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.statCard}
              >
                <TrendingUp size={32} color="#D97706" />
                <Text style={styles.statValue}>{String(stats.pending_referrals)}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.statCard}
              >
                <Award size={32} color="#059669" />
                <Text style={styles.statValue}>{String(stats.completed_referrals)}</Text>
                <Text style={styles.statLabel}>Confirmés</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#FCE7F3', '#FBCFE8']}
                style={styles.statCard}
              >
                <Gift size={32} color="#DB2777" />
                <Text style={styles.statValue}>{String(stats.total_points_earned)}</Text>
                <Text style={styles.statLabel}>Points gagnés</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Liste des parrainages */}
        {referrals.length > 0 && (
          <View style={styles.referralsSection}>
            <Text style={styles.sectionTitle}>Mes parrainages</Text>

            {referrals.map((referral) => (
              <View key={referral.id} style={styles.referralCard}>
                <View style={[
                  styles.referralStatus,
                  { backgroundColor: referral.status === 'completed' ? '#D1FAE5' : '#FEF3C7' }
                ]}>
                  <View style={styles.statusIcon}>
                    {referral.status === 'completed' ? (
                      <Check size={16} color="#059669" />
                    ) : (
                      <TrendingUp size={16} color="#D97706" />
                    )}
                  </View>
                </View>

                <View style={styles.referralContent}>
                  <Text style={styles.referralUsername}>
                    @{referral.referred_username}
                  </Text>
                  <Text style={styles.referralDate}>
                    {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>

                <View style={[
                  styles.referralPoints,
                  { backgroundColor: referral.status === 'completed' ? '#D1FAE5' : '#F3F4F6' }
                ]}>
                  <Text style={[
                    styles.referralPointsText,
                    { color: referral.status === 'completed' ? '#059669' : '#6B7280' }
                  ]}>
                    {referral.status === 'completed' ? '+' : ''}
                    {String(referral.referrer_points)} pts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
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
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
  codeSection: {
    marginBottom: 32,
  },
  codeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  copyButton: {
    backgroundColor: '#10B981',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  howItWorksSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  referralsSection: {
    marginBottom: 32,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  referralStatus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralContent: {
    flex: 1,
  },
  referralUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  referralDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  referralPoints: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  referralPointsText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
