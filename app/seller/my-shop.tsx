import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Edit3,
  Camera,
  Phone,
  MapPin,
  Package,
  Save,
  Heart,
  Plus,
  ShoppingBag,
  Eye,
  EyeOff,
  Sparkles,
  Palette,
  RotateCw,
  Shuffle,
  Video,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Gradients } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Product } from '@/types/database';
import { useProfileSubscriptionSync } from '@/hooks/useProfileSubscriptionSync';
import { useFocusEffect } from '@react-navigation/native';
import { isAgoraAvailable } from '@/lib/agoraConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Palette de couleurs complète pour le slider
const COLOR_PALETTE = [
  // Rouges
  { hue: 0, name: 'Rouge', colors: ['#FF6B6B', '#EF4444', '#DC2626', '#991B1B'] },
  // Oranges
  { hue: 30, name: 'Orange', colors: ['#FF8C42', '#F97316', '#EA580C', '#C2410C'] },
  // Jaunes/Ambre
  { hue: 45, name: 'Or', colors: ['#FFD93D', '#FBBF24', '#F59E0B', '#D97706'] },
  // Verts clairs
  { hue: 90, name: 'Vert Lime', colors: ['#84CC16', '#65A30D', '#4D7C0F', '#3F6212'] },
  // Verts
  { hue: 120, name: 'Vert', colors: ['#34D399', '#10B981', '#059669', '#047857'] },
  // Teals
  { hue: 165, name: 'Turquoise', colors: ['#2DD4BF', '#14B8A6', '#0D9488', '#0F766E'] },
  // Cyans
  { hue: 180, name: 'Cyan', colors: ['#22D3EE', '#06B6D4', '#0891B2', '#0E7490'] },
  // Bleus
  { hue: 210, name: 'Bleu', colors: ['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'] },
  // Indigos
  { hue: 240, name: 'Indigo', colors: ['#818CF8', '#6366F1', '#4F46E5', '#4338CA'] },
  // Violets
  { hue: 270, name: 'Violet', colors: ['#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9'] },
  // Roses/Magenta
  { hue: 300, name: 'Magenta', colors: ['#E879F9', '#D946EF', '#C026D3', '#A21CAF'] },
  // Roses
  { hue: 330, name: 'Rose', colors: ['#F472B6', '#EC4899', '#DB2777', '#BE185D'] },
];

// Gradients prédéfinis populaires
const PRESET_GRADIENTS = [
  { name: 'Sunset', colors: ['#FF6B6B', '#FFD93D'] as const, angle: 135 },
  { name: 'Ocean', colors: ['#2DD4BF', '#3B82F6'] as const, angle: 135 },
  { name: 'Forest', colors: ['#34D399', '#059669'] as const, angle: 180 },
  { name: 'Purple Dream', colors: ['#A78BFA', '#EC4899'] as const, angle: 135 },
  { name: 'Fire', colors: ['#FF8C42', '#DC2626'] as const, angle: 90 },
  { name: 'Ice', colors: ['#60A5FA', '#22D3EE'] as const, angle: 180 },
];

interface ShopData {
  id: string;
  shop_name: string;
  shop_description: string;
  logo_url: string | null;
  phone: string | null;
  location: string | null;
  theme_color: string;
}

export default function MyShopScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Synchronisation de l'abonnement en temps réel
  const {
    subscription: profileSubscription,
    refresh: refreshProfileSubscription
  } = useProfileSubscriptionSync(user?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // États d'édition (prévisualisation en temps réel)
  const [editedShopName, setEditedShopName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [editedLogoUrl, setEditedLogoUrl] = useState<string | null>(null);

  // États pour le sélecteur de couleurs avancé
  const [primaryColor, setPrimaryColor] = useState('#EF4444');
  const [secondaryColor, setSecondaryColor] = useState('#DC2626');
  const [gradientAngle, setGradientAngle] = useState(135);

  // Modal de bienvenue
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));

  // Recharger quand l'utilisateur revient sur la page
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Page My Shop active - Rechargement...');
      if (user) {
        loadShopData();
        refreshProfileSubscription();
      }
    }, [user])
  );

  // Charger les données
  useEffect(() => {
    if (user) {
      loadShopData();
    }
  }, [user]);

  // Activer le mode édition et modal pour les nouveaux vendeurs
  useEffect(() => {
    if (shopData && !shopData.shop_name) {
      setEditMode(true);
      // Afficher la modal après un court délai
      setTimeout(() => {
        setShowWelcomeModal(true);
        Animated.spring(modalAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }, 500);
    }
  }, [shopData]);

  const loadShopData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const shop: ShopData = {
        id: profile.id,
        shop_name: profile.shop_name || '',
        shop_description: profile.shop_description || '',
        logo_url: profile.logo_url || null,
        phone: profile.phone || '',
        location: profile.location || '',
        theme_color: profile.theme_color || '#EF4444',
      };

      setShopData(shop);
      setEditedShopName(shop.shop_name);
      setEditedDescription(shop.shop_description);
      setEditedPhone(shop.phone || '');
      setEditedLocation(shop.location || '');
      setSelectedColor(shop.theme_color);
      setEditedLogoUrl(shop.logo_url);

      await loadProducts(user.id);
    } catch (error: any) {
      console.error('Error loading shop:', error);
      Alert.alert('Erreur', 'Impossible de charger la boutique');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, views_count')
        .eq('seller_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const pickLogoImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder aux photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadLogoImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadLogoImage = async (uri: string) => {
    if (!user) return;

    try {
      setUploadingLogo(true);

      const filename = `logo-${user.id}-${Date.now()}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(`logos/${filename}`, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(`logos/${filename}`);

      setEditedLogoUrl(publicUrl);
      Alert.alert('Succès', 'Logo mis à jour');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveChanges = async () => {
    if (!user || !shopData) return;

    if (!editedShopName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour votre boutique');
      return;
    }

    try {
      setSaving(true);

      let { error } = await supabase
        .from('profiles')
        .update({
          shop_name: editedShopName.trim(),
          shop_description: editedDescription.trim(),
          phone: editedPhone.trim(),
          location: editedLocation.trim(),
          theme_color: selectedColor,
          logo_url: editedLogoUrl,
        })
        .eq('id', user.id);

      if (error?.code === 'PGRST204' && error?.message?.includes('theme_color')) {
        const result = await supabase
          .from('profiles')
          .update({
            shop_name: editedShopName.trim(),
            shop_description: editedDescription.trim(),
            phone: editedPhone.trim(),
            location: editedLocation.trim(),
            logo_url: editedLogoUrl,
          })
          .eq('id', user.id);
        error = result.error;
      }

      if (error) throw error;

      setShopData({
        ...shopData,
        shop_name: editedShopName.trim(),
        shop_description: editedDescription.trim(),
        phone: editedPhone.trim(),
        location: editedLocation.trim(),
        theme_color: selectedColor,
        logo_url: editedLogoUrl,
      });

      setEditMode(false);

      if (!shopData.shop_name) {
        Alert.alert(
          'Bienvenue !',
          'Votre boutique a été créée avec succès !',
          [
            { text: 'Ajouter un produit', onPress: () => router.push('/seller/add-product') },
            { text: 'Voir ma boutique', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Succès', 'Boutique mise à jour');
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (shopData) {
      setEditedShopName(shopData.shop_name);
      setEditedDescription(shopData.shop_description);
      setEditedPhone(shopData.phone || '');
      setEditedLocation(shopData.location || '');
      setSelectedColor(shopData.theme_color);
      setEditedLogoUrl(shopData.logo_url);
    }
    setEditMode(false);
  };

  // Valeurs affichées (prévisualisation temps réel)
  const displayName = editedShopName || 'Ma Boutique';
  const displayPhone = editedPhone || '+221 XX XXX XX XX';
  const displayLocation = editedLocation || 'Sénégal';
  const displayColor = selectedColor;
  const displayLogo = editedLogoUrl;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
        <Text style={styles.loadingText}>Chargement de votre boutique...</Text>
      </View>
    );
  }

  // Utiliser le gradient personnalisé
  const customGradient = {
    gradient: [primaryColor, secondaryColor] as const,
    lightGradient: [primaryColor + '20', secondaryColor + '20'] as const,
    angle: gradientAngle
  };

  // Rendu de la prévisualisation
  const renderPreview = () => (
    <View style={styles.previewContainer}>
      {/* Header avec gradient personnalisé */}
      <LinearGradient
        colors={customGradient.gradient}
        start={{ x: 0, y: 0 }}
        end={{
          x: Math.cos((gradientAngle * Math.PI) / 180),
          y: Math.sin((gradientAngle * Math.PI) / 180)
        }}
        style={styles.previewHeader}
      >
        <View style={styles.previewHeaderContent} />
      </LinearGradient>

      {/* Logo et nom */}
      <View style={styles.previewShopInfo}>
        <View style={[styles.previewLogoCircle, { borderColor: displayColor }]}>
          {displayLogo ? (
            <Image source={{ uri: displayLogo }} style={styles.previewLogoImage} />
          ) : (
            <ShoppingBag size={30} color={displayColor} />
          )}
        </View>
        <Text style={styles.previewShopName} numberOfLines={1}>{displayName}</Text>
      </View>

      {/* Cartes info */}
      <View style={styles.previewCard}>
        <View style={[styles.previewCardIcon, { backgroundColor: displayColor + '20' }]}>
          <Phone size={16} color={displayColor} />
        </View>
        <View style={styles.previewCardContent}>
          <Text style={styles.previewCardLabel}>Téléphone</Text>
          <Text style={styles.previewCardValue} numberOfLines={1}>{displayPhone}</Text>
        </View>
      </View>

      <View style={styles.previewCard}>
        <View style={[styles.previewCardIcon, { backgroundColor: displayColor + '20' }]}>
          <MapPin size={16} color={displayColor} />
        </View>
        <View style={styles.previewCardContent}>
          <Text style={styles.previewCardLabel}>Localisation</Text>
          <Text style={styles.previewCardValue} numberOfLines={1}>{displayLocation}</Text>
        </View>
      </View>

      {/* Produits preview */}
      <View style={styles.previewProductsSection}>
        <View style={styles.previewProductsHeader}>
          <Package size={14} color={displayColor} />
          <Text style={styles.previewProductsTitle}>Produits ({products.length})</Text>
        </View>
        <View style={styles.previewProductsGrid}>
          {products.slice(0, 2).map((product) => (
            <View key={product.id} style={styles.previewProductCard}>
              {product.images?.[0] ? (
                <Image source={{ uri: product.images[0] }} style={styles.previewProductImage} />
              ) : (
                <View style={[styles.previewProductImage, styles.previewNoImage]}>
                  <Package size={20} color={Colors.textMuted} />
                </View>
              )}
              <Text style={styles.previewProductPrice}>{product.price.toLocaleString()} F</Text>
            </View>
          ))}
          {products.length === 0 && (
            <View style={styles.previewEmptyProducts}>
              <Package size={24} color={Colors.textMuted} />
              <Text style={styles.previewEmptyText}>Aucun produit</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Fonction pour fermer la modal
  const closeWelcomeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowWelcomeModal(false));
  };

  return (
    <View style={styles.container}>
      {/* Modal de Bienvenue */}
      <Modal
        visible={showWelcomeModal}
        transparent
        animationType="fade"
        onRequestClose={closeWelcomeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            {/* Header avec gradient personnalisé */}
            <LinearGradient
              colors={customGradient.gradient}
              start={{ x: 0, y: 0 }}
              end={{
                x: Math.cos((gradientAngle * Math.PI) / 180),
                y: Math.sin((gradientAngle * Math.PI) / 180)
              }}
              style={styles.modalHeader}
            >
              <View style={styles.modalIconCircle}>
                <ShoppingBag size={40} color={Colors.white} />
              </View>
            </LinearGradient>

            {/* Contenu */}
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>
                Bienvenue sur SenePanda ! 🎉
              </Text>
              <Text style={styles.modalSubtitle}>
                Créez votre boutique en ligne
              </Text>

              <View style={styles.modalSteps}>
                <View style={styles.modalStep}>
                  <View style={[styles.modalStepIcon, { backgroundColor: primaryColor + '20' }]}>
                    <Text style={styles.modalStepNumber}>1</Text>
                  </View>
                  <View style={styles.modalStepContent}>
                    <Text style={styles.modalStepTitle}>Personnalisez</Text>
                    <Text style={styles.modalStepText}>Nom, logo et thème de votre boutique</Text>
                  </View>
                </View>

                <View style={styles.modalStep}>
                  <View style={[styles.modalStepIcon, { backgroundColor: primaryColor + '20' }]}>
                    <Text style={styles.modalStepNumber}>2</Text>
                  </View>
                  <View style={styles.modalStepContent}>
                    <Text style={styles.modalStepTitle}>Ajoutez vos infos</Text>
                    <Text style={styles.modalStepText}>Téléphone et localisation</Text>
                  </View>
                </View>

                <View style={styles.modalStep}>
                  <View style={[styles.modalStepIcon, { backgroundColor: primaryColor + '20' }]}>
                    <Text style={styles.modalStepNumber}>3</Text>
                  </View>
                  <View style={styles.modalStepContent}>
                    <Text style={styles.modalStepTitle}>Commencez à vendre</Text>
                    <Text style={styles.modalStepText}>Ajoutez vos produits et développez votre business</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={closeWelcomeModal}
              >
                <LinearGradient
                  colors={customGradient.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{
                    x: Math.cos((gradientAngle * Math.PI) / 180),
                    y: Math.sin((gradientAngle * Math.PI) / 180)
                  }}
                  style={styles.modalButton}
                >
                  <Sparkles size={20} color={Colors.white} />
                  <Text style={styles.modalButtonText}>Créer ma boutique</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSkipButton}
                onPress={closeWelcomeModal}
              >
                <Text style={styles.modalSkipText}>Commencer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              if (editMode && !shopData?.shop_name) {
                Alert.alert(
                  'Quitter ?',
                  'Votre boutique n\'est pas configurée.',
                  [
                    { text: 'Rester', style: 'cancel' },
                    { text: 'Quitter', onPress: () => router.replace('/(tabs)/home'), style: 'destructive' },
                  ]
                );
              } else if (editMode) {
                cancelEdit();
              } else {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/profile');
                }
              }
            }}
          >
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {editMode ? 'Éditer ma boutique' : 'Ma Boutique'}
          </Text>

          <View style={styles.headerActions}>
            {/* Bouton Live - visible uniquement en mode normal ET si Agora disponible */}
            {!editMode && isAgoraAvailable && (
              <TouchableOpacity
                style={styles.liveButton}
                onPress={() => router.push('/seller/start-live' as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.liveButtonGradient}
                >
                  <Video size={18} color={Colors.white} />
                  <Text style={styles.liveButtonText}>LIVE</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Message si Agora non disponible */}
            {!editMode && !isAgoraAvailable && __DEV__ && (
              <TouchableOpacity
                style={styles.liveButtonDisabled}
                onPress={() => Alert.alert(
                  'Live Shopping',
                  'Le streaming live nécessite un build natif.\n\nCommande: eas build --profile development',
                  [{ text: 'OK' }]
                )}
                activeOpacity={0.8}
              >
                <Video size={18} color={Colors.textMuted} />
                <Text style={styles.liveButtonTextDisabled}>LIVE (Build EAS)</Text>
              </TouchableOpacity>
            )}

            {editMode && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <EyeOff size={20} color={Colors.textMuted} />
                ) : (
                  <Eye size={20} color={Colors.primaryOrange} />
                )}
              </TouchableOpacity>
            )}
            {editMode ? (
              <TouchableOpacity
                onPress={saveChanges}
                disabled={saving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={customGradient.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{
                    x: Math.cos((gradientAngle * Math.PI) / 180),
                    y: Math.sin((gradientAngle * Math.PI) / 180)
                  }}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Save size={20} color={Colors.white} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setEditMode(true)}
              >
                <Edit3 size={20} color={Colors.primaryOrange} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Contenu principal */}
      {editMode ? (
        <View style={styles.editModeContainer}>
          {/* Panneau d'édition à gauche */}
          <ScrollView
            style={[styles.editPanel, !showPreview && styles.editPanelFull]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Personnalisation</Text>

            {/* Logo */}
            <TouchableOpacity
              style={styles.logoEditSection}
              onPress={pickLogoImage}
              disabled={uploadingLogo}
            >
              <View style={[styles.logoEditCircle, { borderColor: displayColor }]}>
                {uploadingLogo ? (
                  <ActivityIndicator size="large" color={displayColor} />
                ) : displayLogo ? (
                  <Image source={{ uri: displayLogo }} style={styles.logoEditImage} />
                ) : (
                  <Camera size={32} color={displayColor} />
                )}
              </View>
              <Text style={styles.logoEditText}>Changer le logo</Text>
            </TouchableOpacity>

            {/* Nom de la boutique */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom de la boutique *</Text>
              <TextInput
                style={styles.input}
                value={editedShopName}
                onChangeText={setEditedShopName}
                placeholder="Ex: Boutique Bi"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Téléphone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={editedPhone}
                onChangeText={setEditedPhone}
                placeholder="+221 77 XXX XX XX"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Localisation */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Localisation</Text>
              <TextInput
                style={styles.input}
                value={editedLocation}
                onChangeText={setEditedLocation}
                placeholder="Ex: Dakar, Sénégal"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Sélecteur de Gradient Personnalisé */}
            <View style={styles.inputGroup}>
              <View style={styles.themeHeader}>
                <Palette size={20} color={primaryColor} />
                <Text style={styles.inputLabel}>Style de la boutique</Text>
              </View>
              <Text style={styles.themeSubtitle}>Créez votre gradient personnalisé</Text>

              {/* Prévisualisation du Gradient */}
              <LinearGradient
                colors={[primaryColor, secondaryColor]}
                start={{ x: 0, y: 0 }}
                end={{
                  x: Math.cos((gradientAngle * Math.PI) / 180),
                  y: Math.sin((gradientAngle * Math.PI) / 180)
                }}
                style={styles.gradientPreview}
              >
                <View style={styles.gradientPreviewContent}>
                  <Text style={styles.gradientPreviewText}>Aperçu</Text>
                  <ShoppingBag size={32} color={Colors.white} />
                </View>
              </LinearGradient>

              {/* Couleur Primaire */}
              <View style={styles.colorControl}>
                <View style={styles.colorControlHeader}>
                  <Text style={styles.colorControlLabel}>Couleur 1</Text>
                  <View style={[styles.colorSwatch, { backgroundColor: primaryColor }]} />
                </View>
                <View style={styles.colorPaletteRow}>
                  {COLOR_PALETTE.map((palette, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setPrimaryColor(palette.colors[1])}
                      style={styles.colorPaletteItem}
                    >
                      <LinearGradient
                        colors={[palette.colors[0], palette.colors[2]]}
                        style={[
                          styles.colorPaletteDot,
                          primaryColor === palette.colors[1] && styles.colorPaletteDotSelected
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.colorShadeRow}>
                  {COLOR_PALETTE.find(p => p.colors.includes(primaryColor))?.colors.map((shade, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setPrimaryColor(shade)}
                      style={[
                        styles.colorShade,
                        { backgroundColor: shade },
                        primaryColor === shade && styles.colorShadeSelected
                      ]}
                    />
                  )) || COLOR_PALETTE[0].colors.map((shade, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setPrimaryColor(shade)}
                      style={[
                        styles.colorShade,
                        { backgroundColor: shade }
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Couleur Secondaire */}
              <View style={styles.colorControl}>
                <View style={styles.colorControlHeader}>
                  <Text style={styles.colorControlLabel}>Couleur 2</Text>
                  <View style={[styles.colorSwatch, { backgroundColor: secondaryColor }]} />
                </View>
                <View style={styles.colorPaletteRow}>
                  {COLOR_PALETTE.map((palette, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSecondaryColor(palette.colors[2])}
                      style={styles.colorPaletteItem}
                    >
                      <LinearGradient
                        colors={[palette.colors[0], palette.colors[3]]}
                        style={[
                          styles.colorPaletteDot,
                          secondaryColor === palette.colors[2] && styles.colorPaletteDotSelected
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.colorShadeRow}>
                  {COLOR_PALETTE.find(p => p.colors.includes(secondaryColor))?.colors.map((shade, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSecondaryColor(shade)}
                      style={[
                        styles.colorShade,
                        { backgroundColor: shade },
                        secondaryColor === shade && styles.colorShadeSelected
                      ]}
                    />
                  )) || COLOR_PALETTE[0].colors.map((shade, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSecondaryColor(shade)}
                      style={[
                        styles.colorShade,
                        { backgroundColor: shade }
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Angle du Gradient */}
              <View style={styles.colorControl}>
                <View style={styles.colorControlHeader}>
                  <RotateCw size={16} color={Colors.textSecondary} />
                  <Text style={styles.colorControlLabel}>Angle: {gradientAngle}°</Text>
                </View>
                <Slider
                  style={styles.angleSlider}
                  minimumValue={0}
                  maximumValue={360}
                  value={gradientAngle}
                  onValueChange={setGradientAngle}
                  minimumTrackTintColor={primaryColor}
                  maximumTrackTintColor={Colors.borderLight}
                  thumbTintColor={primaryColor}
                />
              </View>

              {/* Gradients Prédéfinis */}
              <View style={styles.presetGradientsSection}>
                <View style={styles.presetGradientsHeader}>
                  <Shuffle size={16} color={Colors.textSecondary} />
                  <Text style={styles.colorControlLabel}>Suggestions</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetGradientsList}
                >
                  {PRESET_GRADIENTS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setPrimaryColor(preset.colors[0]);
                        setSecondaryColor(preset.colors[1]);
                        setGradientAngle(preset.angle);
                      }}
                      style={styles.presetGradientItem}
                    >
                      <LinearGradient
                        colors={preset.colors}
                        start={{ x: 0, y: 0 }}
                        end={{
                          x: Math.cos((preset.angle * Math.PI) / 180),
                          y: Math.sin((preset.angle * Math.PI) / 180)
                        }}
                        style={styles.presetGradientBox}
                      />
                      <Text style={styles.presetGradientName}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Prévisualisation à droite */}
          {showPreview && (
            <View style={styles.previewPanel}>
              <View style={styles.previewLabelContainer}>
                <Eye size={14} color={Colors.textMuted} />
                <Text style={styles.previewLabel}>Prévisualisation</Text>
              </View>
              <View style={styles.previewPhone}>
                {renderPreview()}
              </View>
            </View>
          )}
        </View>
      ) : (
        // Mode visualisation normal
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header avec gradient personnalisé */}
          <LinearGradient
            colors={customGradient.gradient}
            start={{ x: 0, y: 0 }}
            end={{
              x: Math.cos((gradientAngle * Math.PI) / 180),
              y: Math.sin((gradientAngle * Math.PI) / 180)
            }}
            style={styles.viewHeader}
          />

          {/* Logo et Nom */}
          <View style={styles.viewShopInfo}>
            <View style={[styles.viewLogoCircle, { borderColor: displayColor }]}>
              {displayLogo ? (
                <Image source={{ uri: displayLogo }} style={styles.viewLogoImage} />
              ) : (
                <ShoppingBag size={50} color={displayColor} />
              )}
            </View>
            <Text style={styles.viewShopName}>{shopData?.shop_name || 'Ma Boutique'}</Text>
            {shopData?.shop_description && (
              <Text style={styles.viewShopDescription}>{shopData.shop_description}</Text>
            )}
          </View>


          {/* Carte Téléphone */}
          <View style={styles.viewCard}>
            <View style={[styles.viewCardIcon, { backgroundColor: displayColor + '15' }]}>
              <Phone size={24} color={displayColor} />
            </View>
            <View style={styles.viewCardContent}>
              <Text style={styles.viewCardLabel}>Téléphone</Text>
              <Text style={styles.viewCardValue}>{shopData?.phone || 'Non renseigné'}</Text>
            </View>
          </View>

          {/* Carte Localisation */}
          <View style={styles.viewCard}>
            <View style={[styles.viewCardIcon, { backgroundColor: displayColor + '15' }]}>
              <MapPin size={24} color={displayColor} />
            </View>
            <View style={styles.viewCardContent}>
              <Text style={styles.viewCardLabel}>Localisation</Text>
              <Text style={styles.viewCardValue}>{shopData?.location || 'Non renseignée'}</Text>
            </View>
          </View>

          {/* Live Shopping - Premium Only - EN STANDBY
          {profileSubscription?.subscription_plan === 'premium' && (
            <TouchableOpacity
              style={styles.liveShoppingBanner}
              onPress={() => router.push('/seller/start-live')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8C42', '#FFD93D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liveShoppingGradient}
              >
                <View style={styles.liveNewBadge}>
                  <Zap size={12} color="#FFD93D" fill="#FFD93D" />
                  <Text style={styles.liveNewText}>NOUVEAU</Text>
                </View>

                <View style={styles.liveShoppingContent}>
                  <View style={styles.liveShoppingLeft}>
                    <View style={styles.liveShoppingIcon}>
                      <Video size={28} color={Colors.white} strokeWidth={2.5} />
                      <View style={styles.livePulse} />
                    </View>
                    <View style={styles.liveShoppingText}>
                      <Text style={styles.liveShoppingTitle}>Live Shopping</Text>
                      <Text style={styles.liveShoppingSubtitle}>
                        Vendez en direct et boostez vos ventes ! 🔥
                      </Text>
                      <View style={styles.liveShoppingStats}>
                        <View style={styles.liveStatItem}>
                          <Text style={styles.liveStatValue}>+300%</Text>
                          <Text style={styles.liveStatLabel}>Ventes</Text>
                        </View>
                        <View style={styles.liveStatDivider} />
                        <View style={styles.liveStatItem}>
                          <Text style={styles.liveStatValue}>HD</Text>
                          <Text style={styles.liveStatLabel}>Qualité</Text>
                        </View>
                        <View style={styles.liveStatDivider} />
                        <View style={styles.liveStatItem}>
                          <Text style={styles.liveStatValue}>Gratuit</Text>
                          <Text style={styles.liveStatLabel}>166h/mois</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.liveShoppingArrow}>
                    <ChevronRight size={24} color={Colors.white} strokeWidth={3} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          */}

          {/* Section Produits */}
          <View style={styles.viewProductsSection}>
            <View style={styles.viewProductsHeader}>
              <View style={styles.viewProductsTitleRow}>
                <Package size={20} color={displayColor} />
                <Text style={styles.viewProductsTitle}>Produits ({products.length})</Text>
              </View>
              <TouchableOpacity
                style={[styles.addProductButton, { backgroundColor: displayColor }]}
                onPress={() => router.push('/seller/add-product')}
              >
                <Plus size={18} color={Colors.white} />
                <Text style={styles.addProductText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {products.length > 0 ? (
              <View style={styles.viewProductsGrid}>
                {products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.viewProductCard}
                    onPress={() => router.push(`/product/${product.id}`)}
                  >
                    <View style={styles.viewProductImageContainer}>
                      {product.images?.[0] ? (
                        <Image source={{ uri: product.images[0] }} style={styles.viewProductImage} />
                      ) : (
                        <View style={[styles.viewProductImage, styles.viewNoImage]}>
                          <Package size={40} color={Colors.textMuted} />
                        </View>
                      )}
                      <TouchableOpacity style={styles.favoriteButton}>
                        <Heart size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.viewProductInfo}>
                      <Text style={styles.viewProductTitle} numberOfLines={1}>{product.title}</Text>
                      <Text style={styles.viewProductPrice}>{product.price.toLocaleString()} FCFA</Text>
                      <View style={styles.viewProductMeta}>
                        <View style={styles.viewProductMetaItem}>
                          <Eye size={14} color={Colors.primaryOrange} />
                          <Text style={[styles.viewProductMetaText, { color: Colors.primaryOrange, fontWeight: '600' }]}>
                            {(product as any).views_count || 0} vues
                          </Text>
                        </View>
                        <Text style={styles.viewProductStock}>
                          {product.stock > 0 ? '• En stock' : '• Rupture'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.viewEmptyProducts}>
                <Package size={60} color={Colors.textMuted} />
                <Text style={styles.viewEmptyText}>Aucun produit</Text>
                <Text style={styles.viewEmptySubtext}>Ajoutez vos premiers produits</Text>
                <TouchableOpacity
                  style={[styles.viewEmptyButton, { backgroundColor: displayColor }]}
                  onPress={() => router.push('/seller/add-product')}
                >
                  <Plus size={20} color={Colors.white} />
                  <Text style={styles.viewEmptyButtonText}>Ajouter un produit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  safeArea: {
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  liveButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  liveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  liveButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  liveButtonDisabled: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  liveButtonTextDisabled: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // Mode édition
  editModeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  editPanel: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
  },
  editPanelFull: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  logoEditSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoEditCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  logoEditImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  logoEditText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  themeSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  // Nouveau sélecteur de gradient
  gradientPreview: {
    height: 120,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  gradientPreviewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gradientPreviewText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  colorControl: {
    marginBottom: Spacing.xl,
  },
  colorControlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  colorControlLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.small,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  colorPaletteItem: {
    marginBottom: Spacing.xs,
  },
  colorPaletteDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  colorPaletteDotSelected: {
    borderWidth: 3,
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.1 }],
    ...Shadows.medium,
  },
  colorShadeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  colorShade: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  colorShadeSelected: {
    borderWidth: 3,
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.05 }],
    ...Shadows.small,
  },
  angleSlider: {
    width: '100%',
    height: 40,
  },
  presetGradientsSection: {
    marginTop: Spacing.md,
  },
  presetGradientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetGradientsList: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  presetGradientItem: {
    alignItems: 'center',
  },
  presetGradientBox: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
    ...Shadows.small,
  },
  presetGradientName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Panneau de prévisualisation
  previewPanel: {
    width: SCREEN_WIDTH * 0.45,
    backgroundColor: '#F3F4F6',
    padding: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
  },
  previewLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  previewLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  previewPhone: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    height: 80,
  },
  previewHeaderContent: {},
  previewShopInfo: {
    alignItems: 'center',
    marginTop: -30,
  },
  previewLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  previewLogoImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  previewShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  previewCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  previewCardContent: {
    flex: 1,
  },
  previewCardLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  previewCardValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewProductsSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  previewProductsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  previewProductsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  previewProductsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewProductCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.small,
  },
  previewProductImage: {
    width: '100%',
    aspectRatio: 1,
  },
  previewNoImage: {
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewProductPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryOrange,
    padding: 4,
  },
  previewEmptyProducts: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  previewEmptyText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Mode visualisation
  viewHeader: {
    height: 120,
  },
  viewShopInfo: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: Spacing.lg,
  },
  viewLogoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },
  viewLogoImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  viewShopName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  viewShopDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
  viewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  viewCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  viewCardContent: {
    flex: 1,
  },
  viewCardLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  viewCardValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  // Live Shopping Banner
  liveShoppingBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
    elevation: 8,
  },
  liveShoppingGradient: {
    padding: Spacing.lg,
    position: 'relative',
  },
  liveNewBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  liveNewText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD93D',
    letterSpacing: 0.5,
  },
  liveShoppingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  liveShoppingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  liveShoppingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  livePulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.7,
  },
  liveShoppingText: {
    flex: 1,
  },
  liveShoppingTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  liveShoppingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    opacity: 0.95,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  liveShoppingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  liveStatItem: {
    alignItems: 'center',
  },
  liveStatValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.white,
  },
  liveStatLabel: {
    fontSize: 9,
    color: Colors.white,
    opacity: 0.85,
    marginTop: 2,
  },
  liveStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  liveShoppingArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  viewProductsSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  viewProductsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewProductsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  viewProductsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addProductText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  viewProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  viewProductCard: {
    width: '50%',
    padding: Spacing.xs,
  },
  viewProductImageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.small,
  },
  viewProductImage: {
    width: '100%',
    height: '100%',
  },
  viewNoImage: {
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  viewProductInfo: {
    padding: Spacing.sm,
  },
  viewProductTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  viewProductPrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },
  viewProductStock: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  viewProductMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  viewProductMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProductMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  viewEmptyProducts: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  viewEmptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  viewEmptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  viewEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  viewEmptyButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },

  // Modal de bienvenue
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.large,
  },
  modalHeader: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalBody: {
    padding: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalSteps: {
    marginBottom: Spacing.xl,
  },
  modalStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  modalStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  modalStepNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalStepContent: {
    flex: 1,
    paddingTop: 4,
  },
  modalStepTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  modalStepText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.large,
  },
  modalButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  modalSkipButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  modalSkipText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
