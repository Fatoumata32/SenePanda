import React, { useState, useEffect
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import {
  ArrowLeft,
  Gift,
  Users,
  Copy,
  Share2,
  Trophy,
  Star,
  CheckCircle,
  Clock,
  User,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

// Utiliser primaryOrange comme couleur principale
const PRIMARY_COLOR = Colors.primaryOrange;

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarned: number;
}

interface Referral {
  id: string;
  referred_user: {
    id: string;
    full_name: string;
    avatar_url: string;
    created_at: string;
  };
  status: string;
  reward_amount: number;
  created_at: string;
}

const REWARD_AMOUNT = 500; // FCFA par parrainage

export default function ReferralScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: '',
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarned: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadReferralData();
  }, []);

  // Générer un code de parrainage unique
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's referral code
      let { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      // Si pas de code de parrainage, en générer un
      if (!profile?.referral_code) {
        const newCode = generateReferralCode();
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', user.id)
          .select('referral_code')
          .single();

        if (!error && updatedProfile) {
          profile = updatedProfile;
        }
      }

      // Get all referred users
      const { data: referredUsers } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, avatar_url, created_at')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      // Get referral records from referrals table
      const { data: referralRecords } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      // Map referrals with user info
      const mappedReferrals: Referral[] = (referredUsers || []).map((referredUser) => {
        const record = referralRecords?.find(r => r.referred_id === referredUser.id);
        return {
          id: referredUser.id,
          referred_user: {
            id: referredUser.id,
            full_name: referredUser.full_name || `${referredUser.first_name || ''} ${referredUser.last_name || ''}`.trim() || 'Utilisateur',
            avatar_url: referredUser.avatar_url,
            created_at: referredUser.created_at,
          },
          status: record?.status || 'completed',
          reward_amount: record?.reward_amount || REWARD_AMOUNT,
          created_at: referredUser.created_at,
        };
      });

      const totalReferrals = mappedReferrals.length;
      const completedReferrals = mappedReferrals.filter(r => r.status === 'completed').length;
      const pendingReferrals = mappedReferrals.filter(r => r.status === 'pending').length;

      setStats({
        referralCode: profile?.referral_code || '',
        totalReferrals,
        pendingReferrals,
        completedReferrals,
        totalEarned: completedReferrals * REWARD_AMOUNT,
      });

      setReferrals(mappedReferrals);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReferralData();
  };

  const copyReferralCode = async () => {
    if (!stats.referralCode) {
      Alert.alert('Erreur', 'Code de parrainage non disponible');
      return;
    }
    await Clipboard.setStringAsync(stats.referralCode);
    Alert.alert('Copié !', 'Code copié dans le presse-papier.');
  };

  const shareReferralCode = async () => {
    if (!stats.referralCode) {
      Alert.alert('Erreur', 'Code de parrainage non disponible');
      return;
    }
    try {
      await Share.share({
        message: `Rejoins SenePanda avec mon code ${stats.referralCode} et gagne ${REWARD_AMOUNT} FCFA ! Télécharge l'app : https://senepanda.com/app`,
        title: 'Parrainage SenePanda',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getFilteredReferrals = () => {
    switch (activeTab) {
      case 'pending':
        return referrals.filter(r => r.status === 'pending');
      case 'completed':
        return referrals.filter(r => r.status === 'completed');
      default:
        return referrals;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderReferralItem = ({ item }: { item: Referral }) => (
    <View style={styles.referralItem}>
      <View style={styles.referralAvatar}>
        <Text style={styles.referralInitials}>
          {getInitials(item.referred_user.full_name)}
        </Text>
      </View>
      <View style={styles.referralInfo}>
        <Text style={styles.referralName}>{item.referred_user.full_name}</Text>
        <Text style={styles.referralDate}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.referralStatus}>
        {item.status === 'completed' ? (
          <>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.referralReward}>+{item.reward_amount} FCFA</Text>
          </>
        ) : (
          <>
            <Clock size={16} color="#F59E0B" />
            <Text style={[styles.referralReward, { color: '#F59E0B' }]}>En attente</Text>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parrainage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <Gift size={40} color="#F97316" />
          </View>
          <Text style={styles.heroTitle}>Parrainez et gagnez !</Text>
          <Text style={styles.heroDescription}>
            {REWARD_AMOUNT} FCFA pour vous et votre ami à chaque parrainage réussi.
          </Text>
        </View>

        {/* Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Votre code de parrainage</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{stats.referralCode || '------'}</Text>
            <TouchableOpacity onPress={copyReferralCode} style={styles.copyButton}>
              <Copy size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={shareReferralCode}>
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Partager mon code</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.completedReferrals}</Text>
            <Text style={styles.statLabel}>Validés</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.totalEarned.toLocaleString()}</Text>
            <Text style={styles.statLabel}>FCFA gagnés</Text>
          </View>
        </View>

        {/* Rewards Info */}
        <View style={styles.rewardsInfo}>
          <Sparkles size={20} color="#F59E0B" />
          <View style={styles.rewardsContent}>
            <Text style={styles.rewardsTitle}>Bonus parrain</Text>
            <Text style={styles.rewardsText}>
              Gagnez {REWARD_AMOUNT} FCFA par filleul inscrit. Les gains sont ajoutés à votre portefeuille.
            </Text>
          </View>
        </View>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <View style={styles.referralsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes filleuls</Text>
              <Text style={styles.sectionCount}>{referrals.length}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              {[
                { key: 'all', label: 'Tous', count: stats.totalReferrals },
                { key: 'completed', label: 'Validés', count: stats.completedReferrals },
                { key: 'pending', label: 'En attente', count: stats.pendingReferrals },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key as typeof activeTab)}
                >
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                      <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Referrals List */}
            {getFilteredReferrals().map((item) => (
              <View key={item.id}>
                {renderReferralItem({ item })}
              </View>
            ))}

            {getFilteredReferrals().length === 0 && (
              <View style={styles.emptyState}>
                <User size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  {activeTab === 'pending' ? 'Aucun parrainage en attente' : 'Aucun filleul'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
          {[
            { num: '1', title: 'Partagez', desc: 'Envoyez votre code à vos amis' },
            { num: '2', title: 'Inscription', desc: 'Ils créent un compte avec votre code' },
            { num: '3', title: 'Récompense', desc: `Vous gagnez tous les deux ${REWARD_AMOUNT} FCFA` },
          ].map((step) => (
            <View key={step.num} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.num}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.desc}</Text>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </View>
          ))}
        </View>

        {/* Terms */}
        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Conditions</Text>
          <Text style={styles.termsText}>
            • Le filleul doit s'inscrire avec votre code{'\n'}
            • La récompense est versée après validation du compte{'\n'}
            • Les gains sont utilisables pour vos achats sur SenePanda
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: '#FFF7ED',
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  heroDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  codeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  codeText: {
    flex: 1,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  copyButton: {
    padding: Spacing.sm,
  },
  shareButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  shareButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rewardsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  rewardsContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  rewardsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: '#92400E',
    marginBottom: 4,
  },
  rewardsText: {
    fontSize: Typography.fontSize.xs,
    color: '#92400E',
    lineHeight: 18,
  },
  referralsSection: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.white,
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  tabBadge: {
    backgroundColor: Colors.textSecondary + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  referralAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY_COLOR + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  referralInitials: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: PRIMARY_COLOR,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  referralDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  referralStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  referralReward: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  stepDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  termsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  termsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  termsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
