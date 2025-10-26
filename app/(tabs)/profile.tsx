import { useState, useEffect, useRef } from 'react';
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
  Animated,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signInWithUsernameOrEmail, isUsernameAvailable } from '@/lib/auth-helpers';
import { Profile } from '@/types/database';
import {
  User,
  LogIn,
  LogOut,
  ShoppingBag,
  Store,
  Package,
  Settings,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Check,
  X,
  Clipboard,
  Eye,
  Heart,
  Award,
  TrendingUp,
  Crown,
  MessageCircle,
  Users,
  Volume2,
  Gift,
  RefreshCw,
  Camera,
  Link,
  CreditCard,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Star,
} from 'lucide-react-native';
import PandaLogo from '@/components/PandaLogo';
import ProfileCard from '@/components/ProfileCard';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ClipboardLib from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth states
  const [isLogin, setIsLogin] = useState(true);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Social media for sellers
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Edit modal - états pour tous les champs
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editFacebookUrl, setEditFacebookUrl] = useState('');
  const [editInstagramUrl, setEditInstagramUrl] = useState('');
  const [editTwitterUrl, setEditTwitterUrl] = useState('');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');

  // Modals
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'annual'>('annual');

  // Dynamic data
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    checkUser();
    loadUserRole();
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

  const loadUserRole = async () => {
    const role = await AsyncStorage.getItem('user_preferred_role');
    setUserRole(role as 'buyer' | 'seller' | null);
  };

  // Recharger le profil quand l'écran redevient actif
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchProfile(user.id);
      }
    }, 3000); // Recharge toutes les 3 secondes

    return () => clearInterval(interval);
  }, [user]);

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
      console.log('Profile data:', data);
      console.log('is_seller value:', data?.is_seller, 'type:', typeof data?.is_seller);
      setProfile(data);
      if (data) {
        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setAvatarUri(data.avatar_url || null);
        setIsPremium(data.is_premium || false);
      }

      // Charger le nombre de messages non lus
      await fetchUnreadMessages(userId);

      // Animation d'entrée après chargement du profil
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUnreadMessages = async (userId: string) => {
    try {
      // Utiliser les compteurs dans la table conversations
      // Récupérer toutes les conversations où l'utilisateur est buyer ou seller
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id, buyer_unread_count, seller_unread_count')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (error) {
        // Si la table n'existe pas, mettre 0 silencieusement
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setUnreadMessages(0);
          return;
        }
        setUnreadMessages(0);
        return;
      }

      // Calculer le total des messages non lus
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
      // Silencieusement mettre à 0 si erreur
      setUnreadMessages(0);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos');
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

        // Sauvegarder l'URL de l'avatar dans la base de données
        if (user) {
          await supabase
            .from('profiles')
            .update({ avatar_url: uri })
            .eq('id', user.id);

          Speech.speak('Photo de profil mise à jour', { language: 'fr-FR' });
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAuth = async () => {
    try {
      setSaving(true);
      if (isLogin) {
        const { data, error } = await signInWithUsernameOrEmail(usernameOrEmail, password);
        if (error) throw error;
        if (!data?.session) throw new Error('Échec de la connexion');

        // Charger le profil de l'utilisateur pour obtenir le rôle
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('id', data.user.id)
          .single();

        // Sauvegarder le rôle dans AsyncStorage
        if (profileData) {
          const role = profileData.is_seller ? 'seller' : 'buyer';
          await AsyncStorage.setItem('user_preferred_role', role);
        }
      } else {
        const available = await isUsernameAvailable(username);
        if (!available) {
          Alert.alert('Erreur', 'Ce nom d\'utilisateur est déjà pris');
          Speech.speak('Ce nom d\'utilisateur est déjà pris', { language: 'fr-FR' });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: undefined }
        });

        if (error) throw error;

        if (data.user) {
          // Vérifier que tous les champs obligatoires sont remplis
          if (!firstName || !lastName || !phoneNumber || !country) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (*)');
            return;
          }

          // Récupérer le rôle choisi lors de l'onboarding
          const preferredRole = await AsyncStorage.getItem('user_preferred_role');
          const isSeller = preferredRole === 'seller';

          // Créer le nom complet
          const fullNameCombined = `${firstName} ${lastName}`;

          // Créer le profil avec toutes les informations
          const profileData: any = {
            id: data.user.id,
            username,
            full_name: fullNameCombined,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber,
            country,
            city: city || null,
            is_seller: isSeller,
          };

          // Ajouter les réseaux sociaux si c'est un vendeur
          if (isSeller) {
            profileData.facebook_url = facebookUrl || null;
            profileData.instagram_url = instagramUrl || null;
            profileData.twitter_url = twitterUrl || null;
            profileData.whatsapp_number = whatsappNumber || null;
            profileData.website_url = websiteUrl || null;
          }

          await supabase.from('profiles').insert(profileData);

          // Enregistrer le parrainage si code fourni en utilisant la fonction SQL
          let welcomePoints = 0;
          if (referralCode.trim()) {
            const { data: referralResult, error: referralError } = await supabase.rpc(
              'register_referral',
              {
                p_referred_user_id: data.user.id,
                p_referral_code: referralCode.trim().toUpperCase(),
              }
            );

            if (referralError) {
              console.error('Erreur parrainage:', referralError);
            } else if (referralResult?.success) {
              welcomePoints = referralResult.welcome_points || 50;
            } else if (referralResult?.error) {
              // Notification si le code est invalide, mais on continue l'inscription
              Alert.alert('Code de parrainage', referralResult.error);
              Speech.speak(referralResult.error, { language: 'fr-FR' });
            }
          }

          if (data.session) {
            if (welcomePoints > 0) {
              const message = `Bienvenue! Vous avez reçu ${welcomePoints} Panda Coins de bienvenue!`;
              Alert.alert('Succès', message);
              Speech.speak(message, { language: 'fr-FR', rate: 0.9 });
            } else {
              Alert.alert('Succès', 'Votre compte a été créé!');
              Speech.speak('Votre compte a été créé!', { language: 'fr-FR' });
            }
          } else {
            Alert.alert('Vérifiez votre email', 'Un email de confirmation a été envoyé.');
            Speech.speak('Un email de confirmation a été envoyé', { language: 'fr-FR' });
            setIsLogin(true);
          }
        }
      }

      setUsernameOrEmail('');
      setEmail('');
      setUsername('');
      setPassword('');
      setFullName('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setCountry('');
      setCity('');
      setReferralCode('');
      setFacebookUrl('');
      setInstagramUrl('');
      setTwitterUrl('');
      setWhatsappNumber('');
      setWebsiteUrl('');
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
    // Charger les valeurs actuelles dans le formulaire d'édition
    setEditFirstName(profile?.first_name || '');
    setEditLastName(profile?.last_name || '');
    setEditPhone(profile?.phone || '');
    setEditCountry(profile?.country || '');
    setEditCity(profile?.city || '');
    setEditFacebookUrl(profile?.facebook_url || '');
    setEditInstagramUrl(profile?.instagram_url || '');
    setEditTwitterUrl(profile?.twitter_url || '');
    setEditWhatsappNumber(profile?.whatsapp_number || '');
    setEditWebsiteUrl(profile?.website_url || '');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Vérifier que les champs obligatoires sont remplis
      if (!editFirstName || !editLastName || !editPhone || !editCountry) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (Prénom, Nom, Téléphone, Pays)');
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

      // Ajouter les réseaux sociaux si c'est un vendeur
      if (profile?.is_seller) {
        updates.facebook_url = editFacebookUrl || null;
        updates.instagram_url = editInstagramUrl || null;
        updates.twitter_url = editTwitterUrl || null;
        updates.whatsapp_number = editWhatsappNumber || null;
        updates.website_url = editWebsiteUrl || null;
      }

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      setEditModalVisible(false);
      await fetchProfile(user.id);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      Speech.speak('Profil mis à jour avec succès', { language: 'fr-FR' });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
      Speech.speak('Erreur lors de la mise à jour', { language: 'fr-FR' });
    } finally {
      setSaving(false);
    }
  };

  const copyReferralCode = async () => {
    if (profile?.referral_code) {
      await ClipboardLib.setStringAsync(profile.referral_code);
      Speech.speak('Code copié', { language: 'fr-FR', rate: 0.9 });
      Alert.alert('✓ Copié!', 'Code de parrainage copié dans le presse-papier');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  // AUTH SCREEN (Login only - Register has its own page)
  if (!user) {
    // Si l'utilisateur n'est pas en mode login, rediriger vers la page d'inscription
    if (!isLogin) {
      router.replace('/register');
      return null;
    }

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
            {/* Login Form */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ou nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={usernameOrEmail}
                onChangeText={setUsernameOrEmail}
                placeholder="jean@example.com"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}>
              <TouchableOpacity
                onPress={handleAuth}
                disabled={saving}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 }}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <LogIn size={20} color="#FFFFFF" />
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

  // PROFILE SCREEN (Logged in)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.profileContainer}>
        {/* Header */}
        <LinearGradient
          colors={['#FFFFFF', '#FFF8F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Mon Profil</Text>
              <Text style={styles.headerSubtitle}>Gérez vos informations</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
              <LogOut size={18} color="#FF8C42" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Premium Badge - Affiché seulement si l'utilisateur est premium */}
        {isPremium && (
          <View style={styles.premiumBadgeContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBadge}>
              <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.premiumBadgeText}>Membre Premium</Text>
              <View style={styles.premiumShine} />
            </LinearGradient>
          </View>
        )}

        {/* User Info Card */}
        <Animated.View style={[styles.userCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF9F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userCardGradient}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}>
                <TouchableOpacity style={styles.avatar} onPress={handlePickImage}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <User size={60} color="#FF8C42" />
                    </View>
                  )}
                </TouchableOpacity>
              </LinearGradient>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cameraButton}>
                <TouchableOpacity onPress={handlePickImage}>
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile?.full_name || 'Utilisateur'}</Text>
              <Text style={styles.userUsername}>@{profile?.username || 'utilisateur'}</Text>
              <View style={styles.userDetailsContainer}>
                <View style={styles.phoneRow}>
                  <View style={styles.iconCircle}>
                    <Phone size={12} color="#FF8C42" />
                  </View>
                  <Text style={styles.userPhone}>{profile?.phone || 'Ajouter un numéro'}</Text>
                </View>
                <View style={styles.locationRow}>
                  <View style={styles.iconCircle}>
                    <MapPin size={12} color="#FF8C42" />
                  </View>
                  <Text style={styles.userLocation}>{profile?.city || profile?.country || 'Non renseigné'}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Three Square Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => setSubscriptionModalVisible(true)}>
            <LinearGradient
              colors={['#F3E8FF', '#E9D5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.squareButtonGradient}>
              <View style={[styles.squareButtonIcon, { backgroundColor: '#9333EA' }]}>
                <Crown size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.squareButtonText}>Abonnement</Text>
              <Text style={styles.squareButtonSubtext}>Premium</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => setReferralModalVisible(true)}>
            <LinearGradient
              colors={['#DBEAFE', '#BFDBFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.squareButtonGradient}>
              <View style={[styles.squareButtonIcon, { backgroundColor: '#3B82F6' }]}>
                <Users size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.squareButtonText}>Parrainage</Text>
              <Text style={styles.squareButtonSubtext}>{profile?.total_referrals || 0} amis</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => setRewardsModalVisible(true)}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.squareButtonGradient}>
              <View style={[styles.squareButtonIcon, { backgroundColor: '#EF4444' }]}>
                <Gift size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.squareButtonText}>Récompenses</Text>
              <Text style={styles.squareButtonSubtext}>{profile?.panda_coins || 0} coins</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Messages and Sell Now */}
        <View style={styles.mainButtonsRow}>
          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => router.push('/(tabs)/messages')}>
            <MessageCircle size={20} color="#6B7280" />
            <Text style={styles.messagesButtonText}>Messages</Text>
            {unreadMessages > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>

          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sellNowButton}>
            <TouchableOpacity
              onPress={() => {
                if (profile?.is_seller) {
                  router.push('/seller/products');
                } else {
                  router.push('/seller/setup');
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 }}>
              <ShoppingBag size={20} color="#FFFFFF" />
              <Text style={styles.sellNowButtonText}>Vendre</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Settings Buttons */}
        <View style={styles.settingsButtonsRow}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setLanguageModalVisible(true)}>
            <Globe size={20} color="#6B7280" />
            <Text style={styles.settingsButtonText}>Langue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/help-support')}>
            <MessageCircle size={20} color="#6B7280" />
            <Text style={styles.settingsButtonText}>Aide et Support</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Button */}
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.editProfileButton}>
          <TouchableOpacity
            onPress={openEditModal}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 }}>
            <Edit3 size={18} color="#FFFFFF" />
            <Text style={styles.editProfileButtonText}>Modifier le Profil</Text>
          </TouchableOpacity>
        </LinearGradient>
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
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
              {/* Informations personnelles */}
              <Text style={styles.modalSectionTitle}>Informations personnelles</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Prénom *</Text>
                  <TextInput
                    style={styles.input}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="Jean"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Nom *</Text>
                  <TextInput
                    style={styles.input}
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Dupont"
                    placeholderTextColor="#9CA3AF"
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
                  placeholderTextColor="#9CA3AF"
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
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Ville</Text>
                  <TextInput
                    style={styles.input}
                    value={editCity}
                    onChangeText={setEditCity}
                    placeholder="Dakar"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Réseaux sociaux pour vendeurs */}
              {profile?.is_seller && (
                <>
                  <Text style={styles.modalSectionTitle}>Réseaux sociaux</Text>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Facebook size={16} color="#1877F2" />
                      <Text style={styles.label}>Facebook</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editFacebookUrl}
                      onChangeText={setEditFacebookUrl}
                      placeholder="https://facebook.com/votre-page"
                      autoCapitalize="none"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Instagram size={16} color="#E4405F" />
                      <Text style={styles.label}>Instagram</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editInstagramUrl}
                      onChangeText={setEditInstagramUrl}
                      placeholder="https://instagram.com/votre-profil"
                      autoCapitalize="none"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Twitter size={16} color="#1DA1F2" />
                      <Text style={styles.label}>Twitter</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editTwitterUrl}
                      onChangeText={setEditTwitterUrl}
                      placeholder="https://twitter.com/votre-profil"
                      autoCapitalize="none"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Phone size={16} color="#25D366" />
                      <Text style={styles.label}>WhatsApp</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editWhatsappNumber}
                      onChangeText={setEditWhatsappNumber}
                      placeholder="+221 77 123 45 67"
                      keyboardType="phone-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Globe size={16} color="#6B7280" />
                      <Text style={styles.label}>Site Web</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editWebsiteUrl}
                      onChangeText={setEditWebsiteUrl}
                      placeholder="https://votre-site.com"
                      autoCapitalize="none"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
              </TouchableOpacity>

              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.modalButton, styles.modalButtonSave]}>
                <TouchableOpacity
                  onPress={saveEdit}
                  disabled={saving}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonTextSave}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>

      {/* Referral Code Modal */}
      <Modal
        visible={referralModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReferralModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.referralModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Code de Parrainage</Text>
              <TouchableOpacity onPress={() => setReferralModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.referralModalScrollContent}>
              <View style={styles.referralModalBody}>
                <View style={styles.referralIconLarge}>
                  <Gift size={36} color="#10B981" />
                </View>

                <Text style={styles.referralModalTitle}>Mon Code</Text>

                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCodeText}>{profile?.referral_code || 'XXXXXXXX'}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={copyReferralCode}>
                    <Clipboard size={18} color="#10B981" />
                  </TouchableOpacity>
                </View>

                <View style={styles.referralStatsContainer}>
                  <View style={styles.referralStatCard}>
                    <Users size={18} color="#3B82F6" />
                    <Text style={styles.referralStatNumber}>{profile?.total_referrals || 0}</Text>
                    <Text style={styles.referralStatLabel}>Parrainés</Text>
                  </View>

                  <View style={styles.referralStatCard}>
                    <TrendingUp size={18} color="#10B981" />
                    <Text style={styles.referralStatNumber}>{profile?.referral_points || 0}</Text>
                    <Text style={styles.referralStatLabel}>Points</Text>
                  </View>
                </View>

                <View style={styles.referralInfoBox}>
                  <Text style={styles.referralInfoText}>
                    Partagez votre code avec vos amis et gagnez 50 Panda Coins par inscription !
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    Speech.speak('Partager le code de parrainage', { language: 'fr-FR' });
                    Alert.alert('Partager', 'Fonctionnalité de partage bientôt disponible!');
                  }}>
                  <Text style={styles.shareButtonText}>Partager</Text>
                </TouchableOpacity>
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
          <View style={styles.referralModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Abonnement Premium</Text>
              <TouchableOpacity onPress={() => setSubscriptionModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.referralModalScrollContent}>
              <View style={styles.referralModalBody}>
                <View style={styles.referralIconLarge}>
                  <Crown size={36} color="#9333EA" />
                </View>

                <Text style={styles.referralModalTitle}>Devenez Premium</Text>

                <View style={styles.subscriptionPlansContainer}>
                  <TouchableOpacity
                    style={[
                      styles.subscriptionPlan,
                      selectedPlan === 'monthly' && styles.selectedPlan
                    ]}
                    onPress={() => setSelectedPlan('monthly')}>
                    <Text style={[styles.planName, selectedPlan === 'monthly' && styles.selectedPlanText]}>Basic</Text>
                    <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.selectedPlanText]}>2 000 FCFA/mois</Text>
                    <View style={styles.planFeatures}>
                      <Text style={[styles.planFeature, selectedPlan === 'monthly' && styles.selectedPlanDescText]}>✓ Badge Premium</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'monthly' && styles.selectedPlanDescText]}>✓ Support standard</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'monthly' && styles.selectedPlanDescText]}>✓ Moins de publicités</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.subscriptionPlan,
                      selectedPlan === 'quarterly' && styles.selectedPlan,
                      styles.popularPlan
                    ]}
                    onPress={() => setSelectedPlan('quarterly')}>
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAIRE</Text>
                    </View>
                    <Text style={[styles.planName, selectedPlan === 'quarterly' && styles.selectedPlanText]}>Standard</Text>
                    <Text style={[styles.planPrice, selectedPlan === 'quarterly' && styles.selectedPlanText]}>5 000 FCFA/mois</Text>
                    <View style={styles.planFeatures}>
                      <Text style={[styles.planFeature, selectedPlan === 'quarterly' && styles.selectedPlanDescText]}>✓ Tout du Basic</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'quarterly' && styles.selectedPlanDescText]}>✓ Support prioritaire</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'quarterly' && styles.selectedPlanDescText]}>✓ Pas de publicités</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'quarterly' && styles.selectedPlanDescText]}>✓ Statistiques avancées</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.subscriptionPlan,
                      selectedPlan === 'annual' && styles.selectedPlan
                    ]}
                    onPress={() => setSelectedPlan('annual')}>
                    <Text style={[styles.planName, selectedPlan === 'annual' && styles.selectedPlanText]}>Premium Gold</Text>
                    <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.selectedPlanText]}>10 000 FCFA/mois</Text>
                    <View style={styles.planFeatures}>
                      <Text style={[styles.planFeature, selectedPlan === 'annual' && styles.selectedPlanDescText]}>✓ Tout du Standard</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'annual' && styles.selectedPlanDescText]}>✓ Support VIP 24/7</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'annual' && styles.selectedPlanDescText]}>✓ Badge Gold exclusif</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'annual' && styles.selectedPlanDescText]}>✓ Mise en avant produits</Text>
                      <Text style={[styles.planFeature, selectedPlan === 'annual' && styles.selectedPlanDescText]}>✓ Accès anticipé nouveautés</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumDetailsButton}>
                  <TouchableOpacity
                    onPress={() => {
                      setSubscriptionModalVisible(false);
                      router.push('/seller/subscription-plans');
                    }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={styles.shareButtonText}>Voir les détails</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rewards Modal */}
      <Modal
        visible={rewardsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRewardsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.referralModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mes Récompenses</Text>
              <TouchableOpacity onPress={() => setRewardsModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.referralModalScrollContent}>
              <View style={styles.referralModalBody}>
                <View style={styles.referralIconLarge}>
                  <Gift size={36} color="#EF4444" />
                </View>

                <Text style={styles.referralModalTitle}>Panda Coins</Text>

                <View style={styles.coinsBalanceCard}>
                  <Text style={styles.coinsAmount}>{profile?.panda_coins || 0}</Text>
                  <Text style={styles.coinsLabel}>Points disponibles</Text>
                </View>

                <View style={styles.referralInfoBox}>
                  <Text style={styles.referralInfoText}>
                    Gagnez des Panda Coins en:{'\n\n'}
                    • Parrainant des amis (50 coins){'\n'}
                    • Achetant des produits (5% du montant){'\n'}
                    • Complétant des défis quotidiens
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    setRewardsModalVisible(false);
                    router.push('/my-benefits');
                  }}>
                  <Text style={styles.shareButtonText}>Utiliser mes coins</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.referralModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir la langue</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.languageOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'fr' && styles.languageOptionSelected,
                ]}
                onPress={() => {
                  setSelectedLanguage('fr');
                  Speech.speak('Langue changée en français', { language: 'fr-FR' });
                  setTimeout(() => setLanguageModalVisible(false), 500);
                }}>
                <Text style={styles.languageFlag}>🇫🇷</Text>
                <Text style={styles.languageName}>Français</Text>
                {selectedLanguage === 'fr' && <Check size={20} color="#10B981" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'en' && styles.languageOptionSelected,
                ]}
                onPress={() => {
                  setSelectedLanguage('en');
                  Speech.speak('Language changed to English', { language: 'en-US' });
                  setTimeout(() => setLanguageModalVisible(false), 500);
                }}>
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text style={styles.languageName}>English</Text>
                {selectedLanguage === 'en' && <Check size={20} color="#10B981" />}
              </TouchableOpacity>
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
    backgroundColor: '#FFF8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  premiumBadgeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  premiumShine: {
    position: 'absolute',
    width: 40,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
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
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  audioButton: {
    padding: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    marginLeft: 'auto',
  },
  referralInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  referralInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#10B981',
    textAlign: 'center',
  },
  checkMark: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 4,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  bonusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  linkTextBold: {
    color: '#F59E0B',
    fontWeight: '700',
  },

  // Profile Screen
  profileContainer: {
    padding: 0,
    paddingBottom: 32,
  },
  userCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  userCardGradient: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
    bottom: -20,
    left: -20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 64,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  userUsername: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 16,
  },
  userDetailsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPhone: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  userLocation: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  personalInfoSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  socialLinksSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  socialLinksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  socialLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialLinkText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  visitShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  visitShopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#D1FAE5',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  referralCodeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 5,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },

  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  squareButton: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  squareButtonGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
  },
  squareButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  squareButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  squareButtonSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  mainButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  messagesButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  messagesButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  sellNowButton: {
    flex: 1.3,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
  },
  sellNowButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mainButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EC4899',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  settingsButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  editProfileButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 48,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  editProfileButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.3,
  },
  modalScrollView: {
    maxHeight: 450,
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 20,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
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
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonSave: {
    overflow: 'hidden',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Referral Modal
  referralModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  referralModalScrollContent: {
    paddingBottom: 28,
  },
  referralModalBody: {
    alignItems: 'center',
  },
  referralIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  referralModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  referralStatsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  referralStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  referralStatNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.3,
  },
  referralStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  referralInfoBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  referralInfoText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  shareButton: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumDetailsButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Subscription Modal
  subscriptionPlansContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  subscriptionPlan: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  selectedPlan: {
    backgroundColor: '#9333EA',
    borderColor: '#9333EA',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  selectedPlanText: {
    color: '#FFFFFF',
  },
  selectedPlanDescText: {
    color: '#E9D5FF',
  },
  popularPlan: {
    borderColor: '#9333EA',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#9333EA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#9333EA',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  planDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  planFeatures: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  planFeature: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'left',
  },

  // Rewards Modal
  coinsBalanceCard: {
    backgroundColor: '#FFF4E6',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFE4CC',
    width: '100%',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  coinsAmount: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FF8C42',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  coinsLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '700',
  },

  // Language Modal
  languageOptionsContainer: {
    padding: 28,
    gap: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  languageOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  languageFlag: {
    fontSize: 36,
  },
  languageName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
});
