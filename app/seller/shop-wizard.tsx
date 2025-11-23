import { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  User,
  Globe,
  Mail,
  Clock,
  Star,
  ShoppingBag,
  Check
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ShopWizardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);

  // Form data
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Sénégal');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  // Vérifier si le vendeur a déjà une boutique
  useEffect(() => {
    checkExistingShop();
  }, []);

  const checkExistingShop = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(tabs)/profile');
        return;
      }

      // Vérifier si une boutique existe
      const { data: shop } = await supabase
        .from('shops')
        .select('id, name')
        .eq('seller_id', user.id)
        .maybeSingle();

      if (shop) {
        Alert.alert(
          'Boutique existante',
          `Vous avez déjà une boutique "${shop.name}". Vous allez être redirigé vers l'ajout de produit.`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/seller/add-product' as any),
            },
          ]
        );
        return;
      }

      // Vérifier aussi dans le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_name, email')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.shop_name) {
        Alert.alert(
          'Boutique existante',
          `Vous avez déjà une boutique "${profile.shop_name}". Vous allez être redirigé vers l'ajout de produit.`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/seller/add-product' as any),
            },
          ]
        );
        return;
      }

      // Pré-remplir l'email si disponible
      if (profile?.email) {
        setEmail(profile.email);
      }
    } catch (error) {
      console.error('Error checking existing shop:', error);
    } finally {
      setCheckingShop(false);
    }
  };

  const handleCreateShop = async () => {
    if (!shopName.trim()) {
      Alert.alert('Erreur', 'Le nom de la boutique est requis');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Erreur', 'Le numéro de téléphone est requis');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Mettre à jour le profil
      const { error } = await supabase
        .from('profiles')
        .update({
          is_seller: true,
          shop_name: shopName.trim(),
          shop_description: shopDescription.trim() || null,
          phone: phone.trim(),
          country: country.trim() || 'Sénégal',
          city: city.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Rediriger vers l'écran de succès
      router.replace(`/seller/shop-success?shopId=${user.id}`);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Composant Aperçu en temps réel
  const LivePreview = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <Store size={20} color="#F59E0B" />
        <Text style={styles.previewTitle}>Aperçu en temps réel</Text>
      </View>

      <View style={styles.previewCard}>
        {/* Banner Gradient */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewBanner}
        >
          <View style={styles.bannerPattern}>
            <Store size={40} color="rgba(255,255,255,0.2)" />
          </View>
        </LinearGradient>

        {/* Shop Logo */}
        <View style={styles.previewLogoWrapper}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.previewLogo}
          >
            <Text style={styles.previewLogoText}>
              {shopName ? shopName.charAt(0).toUpperCase() : 'B'}
            </Text>
          </LinearGradient>
          {shopName && (
            <View style={styles.verifiedBadge}>
              <Check size={10} color="#FFF" />
            </View>
          )}
        </View>

        {/* Shop Info */}
        <View style={styles.previewInfo}>
          <Text style={styles.previewShopName}>
            {shopName.trim() || 'Nom de votre boutique'}
          </Text>

          {shopDescription ? (
            <Text style={styles.previewDescription} numberOfLines={3}>
              {shopDescription}
            </Text>
          ) : (
            <Text style={styles.previewDescriptionPlaceholder}>
              Description de votre boutique...
            </Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.statText}>Nouveau</Text>
            </View>
            <View style={styles.statItem}>
              <ShoppingBag size={14} color="#6B7280" />
              <Text style={styles.statText}>0 produits</Text>
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.previewContactSection}>
            {phone && (
              <View style={styles.previewContactItem}>
                <View style={styles.contactIconWrapper}>
                  <Phone size={14} color="#10B981" />
                </View>
                <Text style={styles.previewContactText}>{phone}</Text>
              </View>
            )}

            {(city || country) && (
              <View style={styles.previewContactItem}>
                <View style={styles.contactIconWrapper}>
                  <MapPin size={14} color="#3B82F6" />
                </View>
                <Text style={styles.previewContactText}>
                  {city ? `${city}, ${country}` : country}
                </Text>
              </View>
            )}

            {email && (
              <View style={styles.previewContactItem}>
                <View style={styles.contactIconWrapper}>
                  <Mail size={14} color="#8B5CF6" />
                </View>
                <Text style={styles.previewContactText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            )}

            {openingHours && (
              <View style={styles.previewContactItem}>
                <View style={styles.contactIconWrapper}>
                  <Clock size={14} color="#F59E0B" />
                </View>
                <Text style={styles.previewContactText}>{openingHours}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons Preview */}
        <View style={styles.previewActions}>
          <View style={styles.previewActionButton}>
            <Phone size={16} color="#FFF" />
            <Text style={styles.previewActionText}>Appeler</Text>
          </View>
          <View style={[styles.previewActionButton, styles.previewActionSecondary]}>
            <Mail size={16} color="#F59E0B" />
            <Text style={[styles.previewActionText, styles.previewActionTextSecondary]}>Message</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Afficher un écran de chargement pendant la vérification
  if (checkingShop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Vérification de votre boutique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Store size={28} color="#F59E0B" />
          <Text style={styles.headerTitle}>Créer ma boutique</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Split View */}
        <View style={styles.splitContainer}>
          {/* Form Side */}
          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            <Text style={styles.formTitle}>Informations de la boutique</Text>
            <Text style={styles.formSubtitle}>
              Remplissez les informations et voyez l'aperçu en temps réel
            </Text>

            {/* Shop Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <User size={16} color="#F59E0B" />
                <Text style={styles.label}>Nom de la boutique *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={shopName}
                onChangeText={setShopName}
                placeholder="Ex: Boutique Artisanat Dakar"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <FileText size={16} color="#F59E0B" />
                <Text style={styles.label}>Description</Text>
              </View>
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

            {/* Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Phone size={16} color="#F59E0B" />
                <Text style={styles.label}>Téléphone *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+221 77 123 45 67"
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Country & City Row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Globe size={16} color="#F59E0B" />
                  <Text style={styles.label}>Pays</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Sénégal"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <MapPin size={16} color="#F59E0B" />
                  <Text style={styles.label}>Ville</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Dakar"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Mail size={16} color="#F59E0B" />
                <Text style={styles.label}>Email (optionnel)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="contact@maboutique.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Opening Hours */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Clock size={16} color="#F59E0B" />
                <Text style={styles.label}>Horaires (optionnel)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={openingHours}
                onChangeText={setOpeningHours}
                placeholder="Lun-Sam: 8h-18h"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          {/* Preview Side */}
          <View style={styles.previewSide}>
            <LivePreview />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButton, (!shopName || !phone) && styles.createButtonDisabled]}
          onPress={handleCreateShop}
          disabled={loading || !shopName || !phone}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.createButtonText}>Créer ma boutique</Text>
              <ArrowRight size={20} color="#FFFFFF" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  previewSide: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  previewBanner: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerPattern: {
    opacity: 0.5,
  },
  previewLogoWrapper: {
    marginTop: -35,
    alignSelf: 'center',
    position: 'relative',
  },
  previewLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewLogoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  previewInfo: {
    padding: 16,
    paddingTop: 12,
  },
  previewShopName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  previewDescriptionPlaceholder: {
    fontSize: 13,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  previewContactSection: {
    gap: 10,
  },
  previewContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContactText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  previewActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    borderRadius: 10,
  },
  previewActionSecondary: {
    backgroundColor: '#FEF3C7',
  },
  previewActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewActionTextSecondary: {
    color: '#F59E0B',
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
  cancelButton: {
    flex: 0.35,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  createButton: {
    flex: 0.65,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
