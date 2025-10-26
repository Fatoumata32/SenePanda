import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Store, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SHOP_LOGOS, SHOP_BANNERS, ShopLogo, ShopBanner, getBannerStyle } from '@/lib/shop-designs';

type WizardStep = 1 | 2 | 3;

export default function ShopWizardScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Sénégal');
  const [selectedLogo, setSelectedLogo] = useState<ShopLogo>(SHOP_LOGOS[0]);
  const [selectedBanner, setSelectedBanner] = useState<ShopBanner>(SHOP_BANNERS[0]);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [customBannerUrl, setCustomBannerUrl] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep === 1 && !shopName.trim()) {
      Alert.alert('Erreur', 'Le nom de la boutique est requis');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleFinish = async () => {
    if (!shopName.trim()) {
      Alert.alert('Erreur', 'Le nom de la boutique est requis');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('profiles')
        .update({
          is_seller: true,
          shop_name: shopName.trim(),
          shop_description: shopDescription.trim() || null,
          shop_logo_url: customLogoUrl || selectedLogo.id, // URL personnalisée ou ID
          shop_banner_url: customBannerUrl || selectedBanner.id, // URL personnalisée ou ID
          phone: phone || null,
          country: country || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Rediriger vers l'écran de succès avec les options de navigation
      router.replace(`/seller/shop-success?shopId=${user.id}`);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Live Preview Component
  const renderPreview = () => {
    const bannerStyle = getBannerStyle(selectedBanner);

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Store size={20} color="#F59E0B" />
          <Text style={styles.previewTitle}>Aperçu en temps réel</Text>
        </View>

        <View style={styles.previewCard}>
          {/* Banner */}
          {customBannerUrl ? (
            <Image
              source={{ uri: customBannerUrl }}
              style={styles.previewBannerContainer}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.previewBannerContainer, { backgroundColor: bannerStyle.background }]}>
              <Text style={styles.previewBannerText}>Bannière</Text>
            </View>
          )}

          {/* Logo */}
          <View style={styles.previewLogoContainer}>
            {customLogoUrl ? (
              <Image
                source={{ uri: customLogoUrl }}
                style={[styles.previewLogo, { backgroundColor: '#FFFFFF' }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.previewLogo, { backgroundColor: selectedLogo.bgColor }]}>
                <Text style={styles.previewLogoIcon}>{selectedLogo.icon}</Text>
              </View>
            )}
          </View>

          {/* Shop Info */}
          <View style={styles.previewInfo}>
            <Text style={styles.previewShopName}>
              {shopName.trim() || 'Nom de la boutique'}
            </Text>
            <Text style={styles.previewDescription} numberOfLines={3}>
              {shopDescription.trim() || 'Description de votre boutique...'}
            </Text>

            {(phone || country) && (
              <View style={styles.previewContact}>
                {phone && (
                  <Text style={styles.previewContactText}>📞 {phone}</Text>
                )}
                {country && (
                  <Text style={styles.previewContactText}>🌍 {country}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Form Steps
  const renderStep1 = () => (
    <View style={styles.formContent}>
      <Text style={styles.stepTitle}>Informations de base</Text>
      <Text style={styles.stepDescription}>
        Commencez par nommer votre boutique et la décrire
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom de la boutique *</Text>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
          placeholder="Ex: Boutique Artisanat Dakar"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={shopDescription}
          onChangeText={setShopDescription}
          placeholder="Décrivez votre boutique et ce que vous vendez..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const handleCustomLogo = () => {
    Alert.prompt(
      'Logo personnalisé',
      'Collez le lien URL de votre logo',
      [
        {
          text: 'Annuler',
          onPress: () => setCustomLogoUrl(null),
          style: 'cancel',
        },
        {
          text: 'Ajouter',
          onPress: (url: any) => {
            if (url && url.trim()) {
              setCustomLogoUrl(url.trim());
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleCustomBanner = () => {
    Alert.prompt(
      'Bannière personnalisée',
      'Collez le lien URL de votre bannière',
      [
        {
          text: 'Annuler',
          onPress: () => setCustomBannerUrl(null),
          style: 'cancel',
        },
        {
          text: 'Ajouter',
          onPress: (url: any) => {
            if (url && url.trim()) {
              setCustomBannerUrl(url.trim());
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderStep2 = () => (
    <View style={styles.formContent}>
      <Text style={styles.stepTitle}>Design de la boutique</Text>
      <Text style={styles.stepDescription}>
        Choisissez un logo et une bannière pour votre boutique
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Logo</Text>
          <TouchableOpacity onPress={handleCustomLogo}>
            <Text style={styles.customLink}>+ URL personnalisée</Text>
          </TouchableOpacity>
        </View>
        {customLogoUrl && (
          <TouchableOpacity
            style={styles.customPreview}
            onPress={() => setCustomLogoUrl(null)}>
            <Text style={styles.customPreviewText}>URL: {customLogoUrl.substring(0, 30)}...</Text>
            <Text style={styles.customRemoveText}>✕ Supprimer</Text>
          </TouchableOpacity>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.logosScroll}>
          {SHOP_LOGOS.map(logo => (
            <TouchableOpacity
              key={logo.id}
              style={[
                styles.logoOption,
                { backgroundColor: logo.bgColor },
                selectedLogo.id === logo.id && !customLogoUrl && styles.logoOptionSelected,
              ]}
              onPress={() => {
                setCustomLogoUrl(null);
                setSelectedLogo(logo);
              }}>
              <Text style={styles.logoOptionIcon}>{logo.icon}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Bannière</Text>
          <TouchableOpacity onPress={handleCustomBanner}>
            <Text style={styles.customLink}>+ URL personnalisée</Text>
          </TouchableOpacity>
        </View>
        {customBannerUrl && (
          <TouchableOpacity
            style={styles.customPreview}
            onPress={() => setCustomBannerUrl(null)}>
            <Text style={styles.customPreviewText}>URL: {customBannerUrl.substring(0, 30)}...</Text>
            <Text style={styles.customRemoveText}>✕ Supprimer</Text>
          </TouchableOpacity>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bannersScroll}>
          {SHOP_BANNERS.map(banner => {
            const bannerStyle = getBannerStyle(banner);
            return (
              <TouchableOpacity
                key={banner.id}
                style={[
                  styles.bannerOption,
                  { backgroundColor: bannerStyle.background },
                  selectedBanner.id === banner.id && !customBannerUrl && styles.bannerOptionSelected,
                ]}
                onPress={() => {
                  setCustomBannerUrl(null);
                  setSelectedBanner(banner);
                }}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formContent}>
      <Text style={styles.stepTitle}>Informations de contact</Text>
      <Text style={styles.stepDescription}>
        Aidez vos clients à vous contacter facilement
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+221 XX XXX XX XX"
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pays</Text>
        <TextInput
          style={styles.input}
          value={country}
          onChangeText={setCountry}
          placeholder="Sénégal"
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Store size={28} color="#F59E0B" />
          <Text style={styles.headerTitle}>Créer ma boutique</Text>
        </View>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>
            Étape {currentStep}/3
          </Text>
        </View>
      </View>

      {/* Split View */}
      <View style={styles.content}>
        {/* Form Side */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>

        {/* Preview Side */}
        <View style={styles.previewSide}>
          {renderPreview()}
        </View>
      </View>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePrevious}
            disabled={loading}>
            <ArrowLeft size={20} color="#374151" />
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { flex: currentStep === 1 ? 1 : 0.48 }]}
          onPress={currentStep === 3 ? handleFinish : handleNext}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                {currentStep === 3 ? 'Créer ma boutique' : 'Suivant'}
              </Text>
              {currentStep < 3 && <ArrowRight size={20} color="#FFFFFF" />}
            </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  stepIndicator: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  formContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  logosScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  logoOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  logoOptionSelected: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoOptionIcon: {
    fontSize: 32,
  },
  bannersScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  bannerOption: {
    width: 120,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  bannerOptionSelected: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  customPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  customPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  customRemoveText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  previewSide: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  previewBannerContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  previewLogoContainer: {
    marginTop: -40,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLogoIcon: {
    fontSize: 36,
  },
  previewInfo: {
    padding: 20,
    paddingTop: 16,
  },
  previewShopName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  previewContact: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previewContactText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
});
