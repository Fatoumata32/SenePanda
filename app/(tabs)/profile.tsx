import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  LogOut,
  ShoppingBag,
  Settings,
  Award,
  CreditCard,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  Sun,
  Moon,
  Shield,
  FileText,
  Trash2,
  Crown,
  Gift,
  Star,
  Heart,
  Phone,
  Mail,
  MapPin,
  Copy,
  Edit3,
  Package,
  TrendingUp,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as ClipboardLib from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { Profile } from '@/types/database';
import {
  validateUsername,
  validatePhoneNumber,
} from '@/lib/validation';
import TeardropAvatar from '@/components/TeardropAvatar';

// Fonction pour générer un avatar unique par utilisateur
const getDefaultAvatar = (userId: string) => {
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, setThemeMode, themeMode } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Stats dynamiques
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0); // Commandes reçues (ventes)
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Menu déroulant pour les commandes (vendeur)
  const [ordersMenuExpanded, setOrdersMenuExpanded] = useState(false);

  // Modals
  const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
  const [paymentsModalVisible, setPaymentsModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [informationModalVisible, setInformationModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);

  // Edit form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const themeColors = useMemo(() => ({
    background: isDark ? '#111827' : '#F0F9FF',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#1F2937',
    textSecondary: isDark ? '#D1D5DB' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
    statBadge: {
      blue: isDark ? '#1E3A8A' : '#DBEAFE',
      yellow: isDark ? '#78350F' : '#FEF3C7',
      green: isDark ? '#064E3B' : '#D1FAE5',
      red: isDark ? '#7F1D1D' : '#FEE2E2',
      purple: isDark ? '#581C87' : '#F3E8FF',
    },
    menuIcon: {
      text: isDark ? '#F9FAFB' : '#1F2937',
      bg: {
        yellow: isDark ? '#78350F' : '#FEF3C7',
        blue: isDark ? '#1E3A8A' : '#DBEAFE',
        lightBlue: isDark ? '#0C4A6E' : '#E0F2FE',
        green: isDark ? '#064E3B' : '#D1FAE5',
        red: isDark ? '#7F1D1D' : '#FEE2E2',
      }
    },
    planBadge: {
      blue: isDark ? '#1E3A8A' : '#DBEAFE',
      yellow: isDark ? '#78350F' : '#FEF3C7',
      purple: isDark ? '#581C87' : '#F3E8FF',
    },
    infoBadge: {
      blue: isDark ? '#1E3A8A' : '#DBEAFE',
      purple: isDark ? '#581C87' : '#F3E8FF',
      teal: isDark ? '#134E4A' : '#CCFBF1',
    },
  }), [isDark]);

  const userInitials = useMemo(() => {
    const fullName = profile?.full_name || profile?.username || 'User';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }, [profile?.full_name, profile?.username]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          fetchStats(session.user.id);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/simple-auth');
    }
  }, [user, loading, router]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
        await fetchStats(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
      if (data) {
        setAvatarUri(data.avatar_url || getDefaultAvatar(userId));
      } else {
        setAvatarUri(getDefaultAvatar(userId));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      // Récupérer le nombre de commandes passées (achats)
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Récupérer le nombre de commandes reçues (ventes) - pour les vendeurs
      const { count: salesCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

      // Récupérer le nombre de produits vendus (si vendeur)
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

      // Récupérer le nombre d'avis laissés
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setTotalOrders(ordersCount || 0);
      setTotalSales(salesCount || 0);
      setTotalProducts(productsCount || 0);
      setTotalReviews(reviewsCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);

        if (user) {
          await supabase
            .from('profiles')
            .update({ avatar_url: uri })
            .eq('id', user.id);
          Speech.speak('Photo de profil mise à jour', { language: 'fr-FR' });
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const openEditModal = () => {
    setEditFirstName(profile?.first_name || '');
    setEditLastName(profile?.last_name || '');
    setEditPhone(profile?.phone || '');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Validation
      const firstNameValidation = validateUsername(editFirstName);
      if (!firstNameValidation.isValid) {
        Alert.alert('Erreur', firstNameValidation.errors.join(', '));
        return;
      }

      const lastNameValidation = validateUsername(editLastName);
      if (!lastNameValidation.isValid) {
        Alert.alert('Erreur', lastNameValidation.errors.join(', '));
        return;
      }

      const phoneValidation = validatePhoneNumber(editPhone);
      if (!phoneValidation.isValid) {
        Alert.alert('Erreur', phoneValidation.errors.join(', '));
        return;
      }

      const updates: any = {
        id: user.id,
        first_name: editFirstName,
        last_name: editLastName,
        full_name: `${editFirstName} ${editLastName}`,
        phone: editPhone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      setEditModalVisible(false);
      await fetchProfile(user.id);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      Speech.speak('Profil mis à jour', { language: 'fr-FR' });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert('Erreur', error.message);
            setProfile(null);
          },
        },
      ]
    );
  };

  const copyReferralCode = async () => {
    if (profile?.referral_code) {
      await ClipboardLib.setStringAsync(profile.referral_code);
      Speech.speak('Code copié', { language: 'fr-FR' });
      Alert.alert('✓ Copié!', 'Code de parrainage copié');
    }
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </SafeAreaView>
    );
  }

  const totalPoints = profile?.panda_coins || 0;
  const referralPoints = (profile?.total_referrals || 0) * 50;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Mon Profil</Text>
        </View>

        {/* Avatar et Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={styles.avatarContainer}>
            <TeardropAvatar
              imageUri={avatarUri}
              size={140}
              shape="squircle"
              glowColor={['#93C5FD', '#60A5FA']}
              borderWidth={4}
              borderColor={isDark ? '#374151' : '#FFFFFF'}
            >
              <Text style={styles.avatarText}>{userInitials}</Text>
            </TeardropAvatar>
            <View style={styles.cameraButton}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: themeColors.text }]}>
            {profile?.full_name || 'Utilisateur'}
          </Text>
          <Text style={[styles.userHandle, { color: themeColors.textSecondary }]}>
            @{profile?.username || 'username'}
          </Text>

          {/* Bouton Modifier */}
          <TouchableOpacity
            style={[styles.editProfileButton, { backgroundColor: themeColors.card }]}
            onPress={openEditModal}>
            <Edit3 size={16} color={Colors.primaryOrange} />
            <Text style={[styles.editProfileText, { color: Colors.primaryOrange }]}>
              Modifier le profil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push('/orders')}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{totalOrders}</Text>
            <View style={[styles.statBadge, { backgroundColor: themeColors.statBadge.blue }]}>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Commandes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => setPointsModalVisible(true)}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{totalPoints}</Text>
            <View style={[styles.statBadge, { backgroundColor: themeColors.statBadge.yellow }]}>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Points</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={copyReferralCode}>
            <View style={styles.referralCodeContainer}>
              <Text style={[styles.statNumber, { color: themeColors.text, fontSize: 16 }]}>
                {profile?.referral_code || '---'}
              </Text>
              <Copy size={14} color="#10B981" />
            </View>
            <View style={[styles.statBadge, { backgroundColor: themeColors.statBadge.green }]}>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Code de parrainage</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, { backgroundColor: themeColors.card }]}>
          <MenuItem
            icon={<Crown size={24} color={themeColors.menuIcon.text} />}
            label="Abonnement"
            onPress={() => setSubscriptionModalVisible(true)}
            backgroundColor={themeColors.menuIcon.bg.yellow}
            themeColors={themeColors}
          />

          {/* Menu Commandes - avec sous-menu pour vendeurs */}
          {profile?.is_seller ? (
            <View>
              <MenuItem
                icon={<Package size={24} color={themeColors.menuIcon.text} />}
                label="Commandes"
                onPress={() => setOrdersMenuExpanded(!ordersMenuExpanded)}
                backgroundColor={themeColors.menuIcon.bg.blue}
                themeColors={themeColors}
                rightIcon={ordersMenuExpanded ?
                  <ChevronUp size={20} color={themeColors.textSecondary} /> :
                  <ChevronDown size={20} color={themeColors.textSecondary} />
                }
              />

              {ordersMenuExpanded && (
                <View style={[styles.subMenuContainer, { backgroundColor: themeColors.background }]}>
                  <TouchableOpacity
                    style={[styles.subMenuItem, { backgroundColor: themeColors.card }]}
                    onPress={() => {
                      setOrdersMenuExpanded(false);
                      router.push('/seller/orders');
                    }}>
                    <View style={[styles.subMenuIconWrapper, { backgroundColor: '#D1FAE5' }]}>
                      <TrendingUp size={20} color="#10B981" />
                    </View>
                    <View style={styles.subMenuContent}>
                      <Text style={[styles.subMenuLabel, { color: themeColors.text }]}>
                        Mes Ventes
                      </Text>
                      <Text style={[styles.subMenuDescription, { color: themeColors.textSecondary }]}>
                        {totalSales} commande{totalSales > 1 ? 's' : ''} reçue{totalSales > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={themeColors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subMenuItem, { backgroundColor: themeColors.card }]}
                    onPress={() => {
                      setOrdersMenuExpanded(false);
                      router.push('/orders');
                    }}>
                    <View style={[styles.subMenuIconWrapper, { backgroundColor: '#DBEAFE' }]}>
                      <ShoppingBag size={20} color="#2563EB" />
                    </View>
                    <View style={styles.subMenuContent}>
                      <Text style={[styles.subMenuLabel, { color: themeColors.text }]}>
                        Mes Achats
                      </Text>
                      <Text style={[styles.subMenuDescription, { color: themeColors.textSecondary }]}>
                        {totalOrders} commande{totalOrders > 1 ? 's' : ''} passée{totalOrders > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <MenuItem
              icon={<Package size={24} color={themeColors.menuIcon.text} />}
              label="Mes Commandes"
              onPress={() => router.push('/orders')}
              backgroundColor={themeColors.menuIcon.bg.blue}
              themeColors={themeColors}
            />
          )}

          <MenuItem
            icon={<Settings size={24} color={themeColors.menuIcon.text} />}
            label="Paramètres"
            onPress={() => setSettingsModalVisible(true)}
            backgroundColor={themeColors.menuIcon.bg.lightBlue}
            themeColors={themeColors}
          />

          <MenuItem
            icon={<Info size={24} color={themeColors.menuIcon.text} />}
            label="Informations"
            onPress={() => setInformationModalVisible(true)}
            backgroundColor={themeColors.menuIcon.bg.green}
            themeColors={themeColors}
          />

          <MenuItem
            icon={<LogOut size={24} color={themeColors.menuIcon.text} />}
            label="Déconnexion"
            onPress={handleSignOut}
            backgroundColor={themeColors.menuIcon.bg.red}
            themeColors={themeColors}
            isLast
          />
        </View>

        {/* Vendeur Section */}
        {profile?.is_seller && (
          <TouchableOpacity
            style={[styles.sellerCard, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/seller/products')}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sellerGradient}>
              <ShoppingBag size={24} color="#FFFFFF" />
              <View style={styles.sellerContent}>
                <Text style={styles.sellerTitle}>Espace Vendeur</Text>
                <Text style={styles.sellerText}>
                  {totalProducts} produit{totalProducts > 1 ? 's' : ''} en vente
                </Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!profile?.is_seller && (
          <TouchableOpacity
            style={[styles.sellerCard, { backgroundColor: themeColors.card }]}
            onPress={() => router.push('/seller/setup')}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sellerGradient}>
              <TrendingUp size={24} color="#FFFFFF" />
              <View style={styles.sellerContent}>
                <Text style={styles.sellerTitle}>Devenir Vendeur</Text>
                <Text style={styles.sellerText}>Commencez à vendre vos produits</Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Points Modal (avec Récompenses intégrées) */}
      <Modal
        visible={pointsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPointsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Mes Points & Récompenses</Text>
              <TouchableOpacity onPress={() => setPointsModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.pointsHeader, { backgroundColor: themeColors.background }]}>
                <Sparkles size={40} color="#F59E0B" />
                <Text style={[styles.pointsTotal, { color: themeColors.text }]}>{totalPoints}</Text>
                <Text style={[styles.pointsLabel, { color: themeColors.textSecondary }]}>Panda Coins disponibles</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 20, marginBottom: 12 }]}>
                Récompenses disponibles
              </Text>

              <View style={styles.rewardsList}>
                <RewardItem
                  icon={<Gift size={24} color={isDark ? '#C084FC' : '#8B5CF6'} />}
                  name="Bon d'achat 5000 FCFA"
                  description="Valable sur tous les produits"
                  cost="500 pts"
                  bgColor={themeColors.statBadge.purple}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Star size={24} color={isDark ? '#34D399' : '#059669'} />}
                  name="Livraison gratuite"
                  description="1 mois de livraison offerte"
                  cost="300 pts"
                  bgColor={themeColors.statBadge.green}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Crown size={24} color={isDark ? '#FBBF24' : '#D97706'} />}
                  name="Badge Premium"
                  description="Accès premium 3 mois"
                  cost="1000 pts"
                  bgColor={themeColors.statBadge.yellow}
                  themeColors={themeColors}
                />
                <RewardItem
                  icon={<Heart size={24} color={isDark ? '#60A5FA' : '#2563EB'} />}
                  name="Don à une association"
                  description="Conversion en don caritatif"
                  cost="100 pts"
                  bgColor={themeColors.statBadge.blue}
                  themeColors={themeColors}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        visible={subscriptionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSubscriptionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Abonnement Premium</Text>
              <TouchableOpacity onPress={() => setSubscriptionModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.subscriptionIntro, { color: themeColors.textSecondary }]}>
                Choisissez votre plan et profitez d'avantages exclusifs
              </Text>

              <View style={styles.subscriptionPlans}>
                {/* Plan Starter - 3000F */}
                <TouchableOpacity style={[styles.planCard, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.planBadge, { backgroundColor: themeColors.planBadge.blue }]}>
                    <Star size={18} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    <Text style={[styles.planBadgeText, { color: themeColors.text }]}>Starter</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: themeColors.text }]}>3000 FCFA</Text>
                  <Text style={[styles.planPeriod, { color: themeColors.textSecondary }]}>par mois</Text>
                  <View style={styles.planFeatures}>
                    <PlanFeature text="20 produits maximum" themeColors={themeColors} />
                    <PlanFeature text="5 photos par produit" themeColors={themeColors} />
                    <PlanFeature text="Commission 12%" themeColors={themeColors} />
                    <PlanFeature text="Support par email" themeColors={themeColors} />
                  </View>
                  <TouchableOpacity style={styles.selectPlanButton}>
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectPlanGradient}>
                      <Text style={styles.selectPlanText}>Choisir</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Plan Pro - 5000F */}
                <TouchableOpacity style={[styles.planCard, styles.planCardPopular, { backgroundColor: themeColors.background }]}>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                  </View>
                  <View style={[styles.planBadge, { backgroundColor: themeColors.planBadge.yellow }]}>
                    <Crown size={18} color={isDark ? '#FBBF24' : '#F59E0B'} />
                    <Text style={[styles.planBadgeText, { color: themeColors.text }]}>Pro</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: themeColors.text }]}>5000 FCFA</Text>
                  <Text style={[styles.planPeriod, { color: themeColors.textSecondary }]}>par mois</Text>
                  <View style={styles.planFeatures}>
                    <PlanFeature text="100 produits maximum" themeColors={themeColors} />
                    <PlanFeature text="10 photos par produit" themeColors={themeColors} />
                    <PlanFeature text="Commission 8%" themeColors={themeColors} />
                    <PlanFeature text="Support prioritaire" themeColors={themeColors} />
                    <PlanFeature text="Badge Pro" themeColors={themeColors} />
                  </View>
                  <TouchableOpacity style={styles.selectPlanButton}>
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectPlanGradient}>
                      <Text style={styles.selectPlanText}>Choisir</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Plan Premium - 15000F */}
                <TouchableOpacity style={[styles.planCard, { backgroundColor: themeColors.background }]}>
                  <View style={[styles.planBadge, { backgroundColor: themeColors.planBadge.purple }]}>
                    <Sparkles size={18} color={isDark ? '#C084FC' : '#8B5CF6'} />
                    <Text style={[styles.planBadgeText, { color: themeColors.text }]}>Premium</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: themeColors.text }]}>15000 FCFA</Text>
                  <Text style={[styles.planPeriod, { color: themeColors.textSecondary }]}>par mois</Text>
                  <View style={styles.planFeatures}>
                    <PlanFeature text="Produits illimités" themeColors={themeColors} />
                    <PlanFeature text="20 photos par produit" themeColors={themeColors} />
                    <PlanFeature text="Commission 5%" themeColors={themeColors} />
                    <PlanFeature text="Support dédié 24/7" themeColors={themeColors} />
                    <PlanFeature text="Badge Premium" themeColors={themeColors} />
                    <PlanFeature text="Analytics avancés" themeColors={themeColors} />
                  </View>
                  <TouchableOpacity style={styles.selectPlanButton}>
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectPlanGradient}>
                      <Text style={styles.selectPlanText}>Choisir</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Paramètres</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Apparence</Text>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    themeMode === 'light' && styles.settingsItemSelected
                  ]}
                  onPress={() => setThemeMode('light')}>
                  <Sun size={20} color={themeMode === 'light' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Mode clair</Text>
                  {themeMode === 'light' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    themeMode === 'dark' && styles.settingsItemSelected
                  ]}
                  onPress={() => setThemeMode('dark')}>
                  <Moon size={20} color={themeMode === 'dark' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Mode sombre</Text>
                  {themeMode === 'dark' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.settingsItem,
                    { backgroundColor: themeColors.background },
                    themeMode === 'system' && styles.settingsItemSelected
                  ]}
                  onPress={() => setThemeMode('system')}>
                  <Settings size={20} color={themeMode === 'system' ? '#D97706' : themeColors.textSecondary} />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Automatique</Text>
                  {themeMode === 'system' && (
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Confidentialité & Légal</Text>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    setSettingsModalVisible(false);
                    router.push('/settings/privacy');
                  }}>
                  <Shield size={20} color="#8B5CF6" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Confidentialité</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    setSettingsModalVisible(false);
                    router.push('/settings/terms');
                  }}>
                  <FileText size={20} color="#3B82F6" />
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>Conditions d'utilisation</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    setSettingsModalVisible(false);
                    router.push('/settings/delete-account');
                  }}>
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={[styles.settingsText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
                  <ChevronRight size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Information Modal */}
      <Modal
        visible={informationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInformationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Informations</Text>
              <TouchableOpacity onPress={() => setInformationModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoSection}>
                <InfoItem
                  icon={<Phone size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />}
                  label="Téléphone"
                  value={profile?.phone || 'Non renseigné'}
                  bgColor={themeColors.infoBadge.blue}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<Mail size={20} color={isDark ? '#C084FC' : '#8B5CF6'} />}
                  label="Email"
                  value={user?.email || 'Non renseigné'}
                  bgColor={themeColors.infoBadge.purple}
                  themeColors={themeColors}
                />
                <InfoItem
                  icon={<MapPin size={20} color={isDark ? '#2DD4BF' : '#0D9488'} />}
                  label="Localisation"
                  value={profile?.city || profile?.country || 'Non renseigné'}
                  bgColor={themeColors.infoBadge.teal}
                  themeColors={themeColors}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Prénom</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="Jean"
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Nom</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Dupont"
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.textSecondary }]}>Téléphone</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+221 77 123 45 67"
                  keyboardType="phone-pad"
                  placeholderTextColor={themeColors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveEdit}
                disabled={saving}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}>
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Composants
function MenuItem({
  icon,
  label,
  onPress,
  backgroundColor,
  isLast = false,
  themeColors,
  rightIcon,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  backgroundColor: string;
  isLast?: boolean;
  themeColors: any;
  rightIcon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor }]}>
        {icon}
      </View>
      <Text style={[styles.menuLabel, { color: themeColors.text }]}>{label}</Text>
      {rightIcon || <ChevronRight size={20} color={themeColors.textSecondary} />}
    </TouchableOpacity>
  );
}

function RewardItem({
  icon,
  name,
  description,
  cost,
  bgColor,
  themeColors,
}: any) {
  return (
    <TouchableOpacity style={[styles.rewardItem, { backgroundColor: themeColors.background }]}>
      <View style={[styles.rewardIcon, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <View style={styles.rewardInfo}>
        <Text style={[styles.rewardName, { color: themeColors.text }]}>{name}</Text>
        <Text style={[styles.rewardDescription, { color: themeColors.textSecondary }]}>{description}</Text>
      </View>
      <Text style={[styles.rewardCost, { color: themeColors.text }]}>{cost}</Text>
    </TouchableOpacity>
  );
}

function InfoItem({
  icon,
  label,
  value,
  bgColor,
  themeColors,
}: any) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconCircle, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: themeColors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function PlanFeature({ text, themeColors }: { text: string; themeColors: any }) {
  return (
    <View style={styles.planFeatureItem}>
      <Check size={16} color="#10B981" />
      <Text style={[styles.planFeatureText, { color: themeColors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  sellerCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  sellerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  sellerContent: {
    flex: 1,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sellerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  pointsHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  pointsTotal: {
    fontSize: 48,
    fontWeight: '900',
    marginTop: 12,
  },
  pointsLabel: {
    fontSize: 15,
    marginTop: 8,
  },
  rewardsList: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 13,
  },
  rewardCost: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
  },
  walletTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  settingsItemSelected: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  infoSection: {
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscriptionIntro: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  subscriptionPlans: {
    gap: 20,
    marginBottom: 24,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardPopular: {
    borderColor: '#F59E0B',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    marginBottom: 20,
  },
  planFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planFeatureText: {
    fontSize: 14,
    flex: 1,
  },
  selectPlanButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectPlanGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPlanText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Sous-menu styles
  subMenuContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subMenuIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subMenuContent: {
    flex: 1,
    gap: 4,
  },
  subMenuLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subMenuDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
});
