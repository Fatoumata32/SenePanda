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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { ArrowLeft, Camera, Store, Save, Plus, Eye } from 'lucide-react-native';
import { pickImageFromGallery, uploadShopLogo, uploadShopBanner } from '@/lib/image-upload';

export default function ShopSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setShopName(data.shop_name || '');
      setShopDescription(data.shop_description || '');
      setPhone(data.phone || '');
      setCountry(data.country || '');
      setLogoUri(data.shop_logo_url);
      setBannerUri(data.shop_banner_url);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showImageOptions = (type: 'logo' | 'banner') => {
    Alert.alert(
      `Changer ${type === 'logo' ? 'le logo' : 'la bannière'}`,
      'Choisissez une option',
      [
        {
          text: 'Galerie',
          onPress: () => pickImage(type),
        },
        {
          text: 'Lien URL',
          onPress: () => addFromUrl(type),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (type: 'logo' | 'banner') => {
    try {
      const aspect: [number, number] = type === 'logo' ? [1, 1] : [16, 9];
      const uri = await pickImageFromGallery(aspect);
      if (uri) {
        if (type === 'logo') {
          setLogoUri(uri);
        } else {
          setBannerUri(uri);
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const addFromUrl = (type: 'logo' | 'banner') => {
    Alert.prompt(
      `${type === 'logo' ? 'Logo' : 'Bannière'} par URL`,
      'Collez le lien de votre image',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Ajouter',
          onPress: (url: any) => {
            if (url && url.trim()) {
              if (type === 'logo') {
                setLogoUri(url.trim());
              } else {
                setBannerUri(url.trim());
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const addLogoFromUrlInput = () => {
    if (!logoUrlInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL d\'image');
      return;
    }
    if (!logoUrlInput.startsWith('http://') && !logoUrlInput.startsWith('https://')) {
      Alert.alert('Erreur', 'L\'URL doit commencer par http:// ou https://');
      return;
    }
    setLogoUri(logoUrlInput.trim());
    setLogoUrlInput('');
  };

  const addBannerFromUrlInput = () => {
    if (!bannerUrlInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL d\'image');
      return;
    }
    if (!bannerUrlInput.startsWith('http://') && !bannerUrlInput.startsWith('https://')) {
      Alert.alert('Erreur', 'L\'URL doit commencer par http:// ou https://');
      return;
    }
    setBannerUri(bannerUrlInput.trim());
    setBannerUrlInput('');
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Erreur', 'Le nom de la boutique est requis');
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Upload new images if changed, or keep URLs as-is
      let logoUrl = logoUri;
      let bannerUrl = bannerUri;

      // Only upload if it's a local file (not an HTTP/HTTPS URL)
      if (logoUri && !logoUri.startsWith('http://') && !logoUri.startsWith('https://')) {
        const result = await uploadShopLogo(logoUri);
        if (result.success) {
          logoUrl = result.url || null;
        } else {
          throw new Error(result.error || 'Erreur lors de l\'upload du logo');
        }
      }

      if (bannerUri && !bannerUri.startsWith('http://') && !bannerUri.startsWith('https://')) {
        const result = await uploadShopBanner(bannerUri);
        if (result.success) {
          bannerUrl = result.url || null;
        } else {
          throw new Error(result.error || 'Erreur lors de l\'upload de la bannière');
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          shop_name: shopName.trim(),
          shop_description: shopDescription.trim() || null,
          shop_logo_url: logoUrl,
          shop_banner_url: bannerUrl,
          phone: phone || null,
          country: country || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Succès', 'Boutique mise à jour avec succès');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/profile');
          }
        }} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres de la boutique</Text>
        <TouchableOpacity
          onPress={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) router.push(`/shop/${user.id}`);
          }}
          style={styles.previewButton}>
          <Eye size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bannière</Text>
          <TouchableOpacity
            style={styles.bannerContainer}
            onPress={() => showImageOptions('banner')}>
            {bannerUri ? (
              <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Camera size={32} color="#9CA3AF" />
                <Text style={styles.placeholderText}>Ajouter une bannière</Text>
              </View>
            )}
            <View style={styles.editOverlay}>
              <Camera size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* URL Input for Banner */}
          <View style={styles.urlInputSection}>
            <Text style={styles.urlInputLabel}>Ou ajouter par lien URL :</Text>
            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                value={bannerUrlInput}
                onChangeText={setBannerUrlInput}
                placeholder="https://exemple.com/banniere.jpg"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.urlAddButton}
                onPress={addBannerFromUrlInput}>
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logo</Text>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => showImageOptions('logo')}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Store size={40} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.logoEditButton}>
              <Camera size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* URL Input for Logo */}
          <View style={styles.urlInputSection}>
            <Text style={styles.urlInputLabel}>Ou ajouter par lien URL :</Text>
            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                value={logoUrlInput}
                onChangeText={setLogoUrlInput}
                placeholder="https://exemple.com/logo.jpg"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.urlAddButton}
                onPress={addLogoFromUrlInput}>
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Shop Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la boutique *</Text>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Nom de votre boutique"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={shopDescription}
              onChangeText={setShopDescription}
              placeholder="Décrivez votre boutique..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

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

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  previewButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#D97706',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  logoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D97706',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
  saveButton: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  urlInputSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  urlInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlAddButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
