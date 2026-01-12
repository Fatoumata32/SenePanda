import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Animated,
  Dimensions,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  Store,
  Camera,
  Palette,
  Globe,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Save,
  Check,
  ChevronRight,
  ChevronLeft,
  Facebook,
  Instagram,
  Twitter,
  Phone,
  Sparkles,
  Moon,
  Sun,
  Upload,
  MessageCircle,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import { ConfettiAnimation } from '@/components/ConfettiAnimation';
import { Toast } from '@/components/Toast';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

// Palettes de couleurs prédéfinies
const COLOR_THEMES = {
  minimalist: {
    name: 'Minimalist',
    primary: '#1F2937',
    secondary: '#6B7280',
    accent: '#F3F4F6',
  },
  luxury: {
    name: 'Luxury',
    primary: '#92400E',
    secondary: '#D97706',
    accent: '#FEF3C7',
  },
  modern: {
    name: 'Modern',
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#DBEAFE',
  },
  vibrant: {
    name: 'Vibrant',
    primary: '#BE123C',
    secondary: '#F43F5E',
    accent: '#FFE4E6',
  },
};

export default function ShopWizardV2() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopSlogan, setShopSlogan] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);

  // Social media
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');

  // UI State
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof COLOR_THEMES>('modern');
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [checkingShop, setCheckingShop] = useState(true);

  // Undo/Redo state
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Translations
  const t = {
    fr: {
      title: 'Créer Ma Boutique',
      step: 'Étape',
      of: 'sur',
      shopName: 'Nom de la boutique',
      shopDescription: 'Description',
      shopSlogan: 'Slogan',
      uploadLogo: 'Logo de la boutique',
      uploadBanner: 'Bannière',
      socialMedia: 'Réseaux sociaux',
      theme: 'Thème',
      preview: 'Aperçu',
      save: 'Enregistrer',
      next: 'Suivant',
      previous: 'Précédent',
      finish: 'Terminer',
      darkMode: 'Mode sombre',
      language: 'Langue',
      success: 'Boutique créée avec succès !',
      savingProgress: 'Sauvegarde automatique...',
    },
    en: {
      title: 'Create My Shop',
      step: 'Step',
      of: 'of',
      shopName: 'Shop Name',
      shopDescription: 'Description',
      shopSlogan: 'Slogan',
      uploadLogo: 'Shop Logo',
      uploadBanner: 'Banner',
      socialMedia: 'Social Media',
      theme: 'Theme',
      preview: 'Preview',
      save: 'Save',
      next: 'Next',
      previous: 'Previous',
      finish: 'Finish',
      darkMode: 'Dark Mode',
      language: 'Language',
      success: 'Shop created successfully!',
      savingProgress: 'Auto-saving...',
    },
  };

  const trans = t[language];

  useEffect(() => {
    const init = async () => {
      await checkUser();
      await loadProgress();
    };

    init();

    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animer la barre de progression
    Animated.timing(progressAnim, {
      toValue: (currentStep / totalSteps) * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Autosave toutes les 3 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      saveProgress();
    }, 3000);

    return () => clearInterval(timer);
  }, [shopName, shopDescription, shopSlogan, facebook, instagram, twitter, whatsapp, website]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const saveProgress = async () => {
    try {
      const progress = {
        shopName,
        shopDescription,
        shopSlogan,
        logoUri,
        bannerUri,
        facebook,
        instagram,
        twitter,
        whatsapp,
        website,
        selectedTheme,
        currentStep,
      };
      await AsyncStorage.setItem('shop_wizard_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem('shop_wizard_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        setShopName(progress.shopName || '');
        setShopDescription(progress.shopDescription || '');
        setShopSlogan(progress.shopSlogan || '');
        setLogoUri(progress.logoUri || null);
        setBannerUri(progress.bannerUri || null);
        setFacebook(progress.facebook || '');
        setInstagram(progress.instagram || '');
        setTwitter(progress.twitter || '');
        setWhatsapp(progress.whatsapp || '');
        setWebsite(progress.website || '');
        setSelectedTheme(progress.selectedTheme || 'modern');
        setCurrentStep(progress.currentStep || 1);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveToHistory = () => {
    const state = { shopName, shopDescription, shopSlogan, facebook, instagram, twitter, whatsapp, website };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setShopName(prevState.shopName);
      setShopDescription(prevState.shopDescription);
      setShopSlogan(prevState.shopSlogan);
      setFacebook(prevState.facebook);
      setInstagram(prevState.instagram);
      setTwitter(prevState.twitter);
      setWhatsapp(prevState.whatsapp);
      setWebsite(prevState.website);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setShopName(nextState.shopName);
      setShopDescription(nextState.shopDescription);
      setShopSlogan(nextState.shopSlogan);
      setFacebook(nextState.facebook);
      setInstagram(nextState.instagram);
      setTwitter(nextState.twitter);
      setWhatsapp(nextState.whatsapp);
      setWebsite(nextState.website);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const pickImage = async (type: 'logo' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (type === 'logo') {
          setLogoUri(uri);
        } else {
          setBannerUri(uri);
        }
        saveToHistory();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast(language === 'fr' ? 'Erreur lors de la sélection de l\'image' : 'Error selecting image', 'error');
    }
  };

  const openWhatsApp = () => {
    if (whatsapp) {
      const url = `https://wa.me/${whatsapp.replace(/\D/g, '')}`;
      Linking.openURL(url);
    }
  };

  const generateSloganWithAI = () => {
    // Simulation d'AI
    const slogans = [
      'Votre satisfaction, notre priorité',
      'Excellence et qualité garanties',
      'Le meilleur pour vous',
      'Faites-vous plaisir',
      'La qualité à votre portée',
    ];
    const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];
    setShopSlogan(randomSlogan);
    showToast(language === 'fr' ? 'Slogan généré !' : 'Slogan generated!', 'success');
    saveToHistory();
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    Speech.speak(message, { language: language === 'fr' ? 'fr-FR' : 'en-US' });
  };

  const handleFinish = async () => {
    if (!shopName.trim()) {
      showToast(language === 'fr' ? 'Le nom de la boutique est requis' : 'Shop name is required', 'error');
      return;
    }

    setSaving(true);

    try {
      // Mise à jour du profil avec is_seller = true
      const { data, error } = await supabase
        .from('profiles')
        .update({
          shop_name: shopName,
          shop_description: shopDescription,
          shop_logo_url: logoUri,
          shop_banner_url: bannerUri,
          facebook_url: facebook,
          instagram_url: instagram,
          twitter_url: twitter,
          whatsapp_number: whatsapp,
          website_url: website,
          is_seller: true,
        })
        .eq('id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Vérifier que la mise à jour a bien été faite
      if (!data?.is_seller) {
        throw new Error('Erreur lors de l\'activation du statut vendeur');
      }

      // Animation de succès
      setShowConfetti(true);
      showToast(trans.success, 'success');

      // Nettoyer le cache
      await AsyncStorage.removeItem('shop_wizard_progress');

      // Rediriger vers le choix de l'abonnement après 2 secondes
      setTimeout(() => {
        router.replace('/seller/choose-subscription');
      }, 2000);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const theme = COLOR_THEMES[selectedTheme];
  const bgColor = darkMode ? '#1F2937' : '#F9FAFB';
  const cardBg = darkMode ? '#374151' : '#FFFFFF';
  const textColor = darkMode ? '#F3F4F6' : '#111827';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ConfettiAnimation show={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile');
              }
            }}
            style={styles.backButton}>
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{trans.title}</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Language Toggle */}
          <TouchableOpacity
            onPress={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            style={styles.iconButton}>
            <Globe size={20} color={theme.primary} />
            <Text style={[styles.langText, { color: textColor }]}>{language.toUpperCase()}</Text>
          </TouchableOpacity>

          {/* Dark Mode Toggle */}
          <TouchableOpacity
            onPress={() => setDarkMode(!darkMode)}
            style={styles.iconButton}>
            {darkMode ? <Sun size={20} color="#F59E0B" /> : <Moon size={20} color="#6B7280" />}
          </TouchableOpacity>

          {/* Preview Toggle */}
          <TouchableOpacity
            onPress={() => setPreviewMode(!previewMode)}
            style={[styles.iconButton, previewMode && styles.iconButtonActive]}>
            {previewMode ? <EyeOff size={20} color={theme.primary} /> : <Eye size={20} color={theme.primary} />}
          </TouchableOpacity>

          {/* Undo/Redo */}
          <TouchableOpacity
            onPress={undo}
            disabled={historyIndex <= 0}
            style={[styles.iconButton, historyIndex <= 0 && styles.iconButtonDisabled]}>
            <Undo size={20} color={historyIndex <= 0 ? '#9CA3AF' : theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={redo}
            disabled={historyIndex >= history.length - 1}
            style={[styles.iconButton, historyIndex >= history.length - 1 && styles.iconButtonDisabled]}>
            <Redo size={20} color={historyIndex >= history.length - 1 ? '#9CA3AF' : theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: textColor }]}>
          {trans.step} {currentStep} {trans.of} {totalSteps}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.cardTitle, { color: textColor }]}>
                {trans.shopName}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: bgColor, color: textColor }]}
                value={shopName}
                onChangeText={(text) => {
                  setShopName(text);
                  saveToHistory();
                }}
                placeholder={trans.shopName}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.cardTitle, { color: textColor, marginTop: 20 }]}>
                {trans.shopDescription}
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: bgColor, color: textColor }]}
                value={shopDescription}
                onChangeText={(text) => {
                  setShopDescription(text);
                  saveToHistory();
                }}
                placeholder={trans.shopDescription}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />

              <View style={styles.row}>
                <Text style={[styles.cardTitle, { color: textColor, flex: 1 }]}>
                  {trans.shopSlogan}
                </Text>
                <TouchableOpacity onPress={generateSloganWithAI} style={styles.aiButton}>
                  <Sparkles size={16} color="#F59E0B" />
                  <Text style={styles.aiButtonText}>AI</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: bgColor, color: textColor }]}
                value={shopSlogan}
                onChangeText={(text) => {
                  setShopSlogan(text);
                  saveToHistory();
                }}
                placeholder={trans.shopSlogan}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{trans.uploadLogo}</Text>
              <TouchableOpacity
                onPress={() => pickImage('logo')}
                style={[styles.uploadBox, { backgroundColor: bgColor }]}>
                {logoUri ? (
                  <Text style={{ color: '#10B981' }}>✓ Logo ajouté</Text>
                ) : (
                  <>
                    <Upload size={32} color="#9CA3AF" />
                    <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Cliquez pour ajouter</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.cardTitle, { color: textColor, marginTop: 20 }]}>
                {trans.uploadBanner}
              </Text>
              <TouchableOpacity
                onPress={() => pickImage('banner')}
                style={[styles.uploadBox, { backgroundColor: bgColor, height: 120 }]}>
                {bannerUri ? (
                  <Text style={{ color: '#10B981' }}>✓ Bannière ajoutée</Text>
                ) : (
                  <>
                    <Upload size={32} color="#9CA3AF" />
                    <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Format 16:9</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Social Media */}
          {currentStep === 3 && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{trans.socialMedia}</Text>

              <View style={styles.socialInput}>
                <Facebook size={20} color="#1877F2" />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 12, backgroundColor: bgColor, color: textColor }]}
                  value={facebook}
                  onChangeText={setFacebook}
                  placeholder="Facebook URL"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.socialInput}>
                <Instagram size={20} color="#E4405F" />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 12, backgroundColor: bgColor, color: textColor }]}
                  value={instagram}
                  onChangeText={setInstagram}
                  placeholder="Instagram URL"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.socialInput}>
                <Phone size={20} color="#25D366" />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 12, backgroundColor: bgColor, color: textColor }]}
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  placeholder="WhatsApp Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {/* Step 4: Theme */}
          {currentStep === 4 && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{trans.theme}</Text>
              <View style={styles.themesGrid}>
                {Object.entries(COLOR_THEMES).map(([key, themeData]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setSelectedTheme(key as keyof typeof COLOR_THEMES)}
                    style={[
                      styles.themeCard,
                      selectedTheme === key && styles.themeCardSelected,
                    ]}>
                    <View style={[styles.themePreview, { backgroundColor: themeData.primary }]} />
                    <Text style={[styles.themeName, { color: textColor }]}>{themeData.name}</Text>
                    {selectedTheme === key && (
                      <View style={styles.themeCheck}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating WhatsApp Button */}
      {whatsapp && (
        <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
          <MessageCircle size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Footer Navigation */}
      <View style={[styles.footer, { backgroundColor: cardBg }]}>
        {currentStep > 1 && (
          <TouchableOpacity
            onPress={() => setCurrentStep(currentStep - 1)}
            style={[styles.navButton, styles.navButtonSecondary]}>
            <ChevronLeft size={20} color={theme.primary} />
            <Text style={[styles.navButtonText, { color: theme.primary }]}>{trans.previous}</Text>
          </TouchableOpacity>
        )}

        {currentStep < totalSteps ? (
          <TouchableOpacity
            onPress={() => setCurrentStep(currentStep + 1)}
            style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: theme.primary }]}>
            <Text style={styles.navButtonTextPrimary}>{trans.next}</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleFinish}
            disabled={saving}
            style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: theme.primary }]}>
            {saving ? (
              <Text style={styles.navButtonTextPrimary}>...</Text>
            ) : (
              <>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.navButtonTextPrimary}>{trans.finish}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  iconButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  uploadBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: (width - 80) / 2,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
  },
  themeCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  navButtonSecondary: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  navButtonPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
