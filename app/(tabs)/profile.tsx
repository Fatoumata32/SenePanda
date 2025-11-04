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
  Phone,
  MapPin,
  Mail,
  Copy,
  ChevronRight,
} from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ClipboardLib from 'expo-clipboard';
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

  const copyReferralCode = async () => {
    if (profile?.referral_code) {
      await ClipboardLib.setStringAsync(profile.referral_code);
      Speech.speak('Code copié', { language: 'fr-FR' });
      Alert.alert('✓ Copié!', 'Code de parrainage copié');
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

  // PROFILE SCREEN (Logged in) - SIMPLE & BEAUTIFUL VERSION
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.profileContainer}
        showsVerticalScrollIndicator={false}>

        {/* Simple Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{profile?.full_name || 'Utilisateur'}</Text>
              <Text style={styles.headerUsername}>@{profile?.username || 'username'}</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
              <LogOut size={20} color={Colors.primaryOrange} />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(profile?.full_name || profile?.username || '?')[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={14} color={Colors.primaryGold} fill={Colors.primaryGold} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Gift size={24} color={Colors.primaryOrange} />
            <Text style={styles.statValue}>{profile?.panda_coins || 0}</Text>
            <Text style={styles.statLabel}>Panda Coins</Text>
          </View>
          <View style={styles.statBox}>
            <Users size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{profile?.total_referrals || 0}</Text>
            <Text style={styles.statLabel}>Parrainages</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/messages')}>
            <MessageCircle size={20} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Messages</Text>
            {unreadMessages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessages}</Text>
              </View>
            )}
            <ChevronRight size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (profile?.is_seller) {
                router.push('/seller/products');
              } else {
                router.push('/seller/setup');
              }
            }}>
            <ShoppingBag size={20} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Vendre</Text>
            <ChevronRight size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/help-support')}>
            <Settings size={20} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Paramètres</Text>
            <ChevronRight size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={openEditModal}>
            <Edit3 size={20} color={Colors.textSecondary} />
            <Text style={styles.actionText}>Modifier le profil</Text>
            <ChevronRight size={18} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Phone size={18} color={Colors.textMuted} />
              <Text style={styles.infoText}>{profile?.phone || 'Non renseigné'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={18} color={Colors.textMuted} />
              <Text style={styles.infoText}>
                {profile?.city || profile?.country || 'Non renseigné'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Mail size={18} color={Colors.textMuted} />
              <Text style={styles.infoText}>{user?.email || 'Non renseigné'}</Text>
            </View>
          </View>
        </View>

        {/* Referral Code */}
        {profile?.referral_code && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Code de parrainage</Text>
            <TouchableOpacity
              style={styles.referralContainer}
              onPress={copyReferralCode}>
              <Text style={styles.referralCode}>{profile.referral_code}</Text>
              <View style={styles.copyButton}>
                <Copy size={18} color={Colors.primaryOrange} />
              </View>
            </TouchableOpacity>
            <Text style={styles.referralHint}>
              Partagez ce code et gagnez 50 Panda Coins par inscription
            </Text>
          </View>
        )}

        {/* Premium Upgrade */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => router.push('/seller/subscription-plans')}>
            <LinearGradient
              colors={['#9333EA', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}>
              <Crown size={28} color={Colors.white} />
              <View style={styles.premiumContent}>
                <Text style={styles.premiumTitle}>Passez à Premium</Text>
                <Text style={styles.premiumText}>
                  Débloquez toutes les fonctionnalités
                </Text>
              </View>
              <ChevronRight size={24} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
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
    borderWidth: 1,
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

  // Profile Screen - SIMPLE VERSION
  profileContainer: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerUsername: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primaryGold,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryGold,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Actions
  actionsContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },

  // Section
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },

  // Referral
  referralContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryOrange,
    letterSpacing: 3,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Premium Card
  premiumCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  premiumText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Modal
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
