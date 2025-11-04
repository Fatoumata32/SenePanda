import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signInWithUsernameOrEmail } from '@/lib/auth-helpers';
import { Profile } from '@/types/database';
import {
  LogIn,
  LogOut,
  ShoppingBag,
  Settings,
  Edit3,
  X,
  Gift,
  Crown,
  MessageCircle,
  Users,
  Globe,
  Star,
  TrendingUp,
  Award,
  Heart,
} from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';
import ProfileHeader3D from '@/components/ProfileHeader3D';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import StatsCard from '@/components/StatsCard';
import QuickActions from '@/components/QuickActions';
import AnimatedCounter from '@/components/AnimatedCounter';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Gradients } from '@/constants/Colors';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCity, setEditCity] = useState('');

  // Dynamic data
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
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
        setAvatarUri(data.avatar_url || null);
        setIsPremium(data.is_premium || false);
      }

      // Charger le nombre de messages non lus
      await fetchUnreadMessages(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUnreadMessages = async (userId: string) => {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id, buyer_unread_count, seller_unread_count')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (error) {
        setUnreadMessages(0);
        return;
      }

      let totalUnread = 0;
      conversations?.forEach((conv) => {
        if (conv.buyer_id === userId) {
          totalUnread += conv.buyer_unread_count || 0;
        } else if (conv.seller_id === userId) {
          totalUnread += conv.seller_unread_count || 0;
        }
      });

      setUnreadMessages(totalUnread);
    } catch (error: any) {
      setUnreadMessages(0);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à vos photos');
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

  const handleAuth = async () => {
    try {
      setSaving(true);
      const { data, error } = await signInWithUsernameOrEmail(usernameOrEmail, password);
      if (error) throw error;
      if (!data?.session) throw new Error('Échec de la connexion');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', data.user.id)
        .single();

      if (profileData) {
        const role = profileData.is_seller ? 'seller' : 'buyer';
        await AsyncStorage.setItem('user_preferred_role', role);
      }

      setUsernameOrEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
      Speech.speak(error.message, { language: 'fr-FR' });
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

  const openEditModal = () => {
    setEditFirstName(profile?.first_name || '');
    setEditLastName(profile?.last_name || '');
    setEditPhone(profile?.phone || '');
    setEditCountry(profile?.country || '');
    setEditCity(profile?.city || '');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!user) return;

    try {
      setSaving(true);

      if (!editFirstName || !editLastName || !editPhone || !editCountry) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        setSaving(false);
        return;
      }

      const updates: any = {
        id: user.id,
        first_name: editFirstName,
        last_name: editLastName,
        full_name: `${editFirstName} ${editLastName}`,
        phone: editPhone,
        country: editCountry,
        city: editCity || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      setEditModalVisible(false);
      await fetchProfile(user.id);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      Speech.speak('Profil mis à jour avec succès', { language: 'fr-FR' });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
      </View>
    );
  }

  // AUTH SCREEN (Login)
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <View style={styles.authHeader}>
            <PandaLogo size="large" showText={true} />
            <Text style={styles.authTitle}>Bienvenue!</Text>
            <Text style={styles.authSubtitle}>
              Connectez-vous pour continuer
            </Text>
          </View>

          <View style={styles.authForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ou nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={usernameOrEmail}
                onChangeText={setUsernameOrEmail}
                placeholder="jean@example.com"
                autoCapitalize="none"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <LinearGradient
              colors={Gradients.goldOrange.colors}
              start={Gradients.goldOrange.start}
              end={Gradients.goldOrange.end}
              style={styles.primaryButton}>
              <TouchableOpacity
                onPress={handleAuth}
                disabled={saving}
                style={styles.primaryButtonInner}>
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <LogIn size={20} color={Colors.white} />
                    <Text style={styles.primaryButtonText}>Se connecter</Text>
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/register')}>
              <Text style={styles.linkText}>
                Pas de compte ? <Text style={styles.linkTextBold}>S'inscrire</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PROFILE SCREEN (Logged in) - MODERN VERSION
  const quickActions = [
    {
      icon: MessageCircle,
      label: 'Messages',
      gradient: ['#3B82F6', '#2563EB', '#1D4ED8'] as const,
      badge: unreadMessages,
      onPress: () => router.push('/(tabs)/messages'),
    },
    {
      icon: ShoppingBag,
      label: 'Vendre',
      gradient: Gradients.goldOrange.colors,
      onPress: () => {
        if (profile?.is_seller) {
          router.push('/seller/products');
        } else {
          router.push('/seller/setup');
        }
      },
    },
    {
      icon: Settings,
      label: 'Paramètres',
      gradient: ['#6B7280', '#4B5563', '#374151'] as const,
      onPress: () => router.push('/help-support'),
    },
    {
      icon: Edit3,
      label: 'Modifier',
      gradient: ['#10B981', '#059669', '#047857'] as const,
      onPress: openEditModal,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.profileContainer}
        showsVerticalScrollIndicator={false}>

        {/* Header 3D avec effet impressionnant */}
        <ProfileHeader3D
          fullName={profile?.full_name || 'Utilisateur'}
          username={profile?.username || 'utilisateur'}
          avatarUri={avatarUri}
          isPremium={isPremium}
          onAvatarPress={handlePickImage}
        />

        {/* Quick Actions avec animations */}
        <View style={styles.quickActionsContainer}>
          <QuickActions actions={quickActions} />
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => Alert.alert('Parrainage', `Vous avez ${profile?.total_referrals || 0} parrainages`)}>
            <StatsCard
              icon={Users}
              label="Parrainages"
              value={profile?.total_referrals || 0}
              color="#3B82F6"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push('/my-benefits')}>
            <StatsCard
              icon={Gift}
              label="Panda Coins"
              value={profile?.panda_coins || 0}
              color="#EF4444"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            icon={TrendingUp}
            label="Points Référence"
            value={profile?.referral_points || 0}
            color="#10B981"
          />
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push('/seller/subscription-plans')}>
            <StatsCard
              icon={Award}
              label="Niveau"
              value={isPremium ? 100 : 50}
              color="#9333EA"
            />
          </TouchableOpacity>
        </View>

        {/* Informations personnelles avec glassmorphism */}
        <GlassmorphicCard style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Globe size={20} color={Colors.primaryOrange} />
            <Text style={styles.cardTitle}>Informations personnelles</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{profile?.phone || 'Non renseigné'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pays</Text>
            <Text style={styles.infoValue}>{profile?.country || 'Non renseigné'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ville</Text>
            <Text style={styles.infoValue}>{profile?.city || 'Non renseigné'}</Text>
          </View>
        </GlassmorphicCard>

        {/* Code de parrainage avec effet glassmorphique */}
        {profile?.referral_code && (
          <GlassmorphicCard style={styles.referralCard}>
            <View style={styles.cardHeader}>
              <Gift size={20} color={Colors.primaryOrange} />
              <Text style={styles.cardTitle}>Mon code de parrainage</Text>
            </View>
            <View style={styles.referralCodeContainer}>
              <Text style={styles.referralCode}>{profile.referral_code}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={async () => {
                  await require('expo-clipboard').setStringAsync(profile.referral_code);
                  Speech.speak('Code copié', { language: 'fr-FR' });
                  Alert.alert('✓ Copié!', 'Code de parrainage copié');
                }}>
                <Text style={styles.copyButtonText}>Copier</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.referralDescription}>
              Partagez ce code avec vos amis et gagnez 50 Panda Coins par inscription !
            </Text>
          </GlassmorphicCard>
        )}

        {/* Premium Banner si pas premium */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => router.push('/seller/subscription-plans')}>
            <LinearGradient
              colors={['#9333EA', '#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBannerGradient}>
              <Crown size={32} color={Colors.white} />
              <View style={styles.premiumBannerContent}>
                <Text style={styles.premiumBannerTitle}>Passez à Premium</Text>
                <Text style={styles.premiumBannerText}>
                  Débloquez toutes les fonctionnalités exclusives
                </Text>
              </View>
              <Text style={styles.premiumBannerArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal - Simplifié */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Prénom *</Text>
                  <TextInput
                    style={styles.input}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="Jean"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Nom *</Text>
                  <TextInput
                    style={styles.input}
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Dupont"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Téléphone *</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+221 77 123 45 67"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Pays *</Text>
                  <TextInput
                    style={styles.input}
                    value={editCountry}
                    onChangeText={setEditCountry}
                    placeholder="Sénégal"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Ville</Text>
                  <TextInput
                    style={styles.input}
                    value={editCity}
                    onChangeText={setEditCity}
                    placeholder="Dakar"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
              </TouchableOpacity>

              <LinearGradient
                colors={Gradients.goldOrange.colors}
                start={Gradients.goldOrange.start}
                end={Gradients.goldOrange.end}
                style={[styles.modalButton, styles.modalButtonSave]}>
                <TouchableOpacity
                  onPress={saveEdit}
                  disabled={saving}
                  style={styles.modalButtonInner}>
                  {saving ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.modalButtonTextSave}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.backgroundLight,
  },

  // Auth Screen
  authContainer: {
    padding: 24,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  authForm: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  primaryButton: {
    borderRadius: 12,
    marginTop: 8,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  linkTextBold: {
    color: Colors.primaryOrange,
    fontWeight: '700',
  },

  // Profile Screen
  profileContainer: {
    paddingBottom: 32,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  referralCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 3,
  },
  copyButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  referralDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  premiumBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  premiumBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  premiumBannerContent: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  premiumBannerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  premiumBannerArrow: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: '700',
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalScrollView: {
    maxHeight: 450,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalButtonSave: {
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingVertical: 16,
    textAlign: 'center',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
});
