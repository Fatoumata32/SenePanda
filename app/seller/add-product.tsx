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
  Image} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { ArrowLeft, Camera, X, Plus, Package, Video, Play } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pickImageFromGallery, takePhoto as capturePhoto, uploadProductImages } from '@/lib/image-upload';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    loadCategories();
    loadUserPlan();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const loadUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserPlan(profile.subscription_plan || 'free');
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
    }
  };

  const pickImages = async () => {
    if (imageUris.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 images');
      return;
    }

    try {
      const uri = await pickImageFromGallery([1, 1]);
      if (uri) {
        setImageUris([...imageUris, uri]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const takePhoto = async () => {
    if (imageUris.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 images');
      return;
    }

    try {
      const uri = await capturePhoto([1, 1]);
      if (uri) {
        setImageUris([...imageUris, uri]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const removeImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
  };

  const addImageFromUrlInput = () => {
    if (!imageUrlInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL d\'image');
      return;
    }

    if (imageUris.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 images');
      return;
    }

    // Vérifier que c'est une URL valide
    if (!imageUrlInput.startsWith('http://') && !imageUrlInput.startsWith('https://')) {
      Alert.alert('Erreur', 'L\'URL doit commencer par http:// ou https://');
      return;
    }

    setImageUris([...imageUris, imageUrlInput.trim()]);
    setImageUrlInput(''); // Vider le champ
  };

  const addImageFromUrl = () => {
    Alert.prompt(
      'Lien de l\'image',
      'Collez le lien URL de votre image',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter',
          onPress: (url: any) => {
            if (url && url.trim()) {
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                Alert.alert('Erreur', 'L\'URL doit commencer par http:// ou https://');
                return;
              }
              if (imageUris.length >= 5) {
                Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 images');
                return;
              }
              setImageUris([...imageUris, url.trim()]);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const pickVideo = async () => {
    // Vérifier le plan
    if (userPlan !== 'pro' && userPlan !== 'premium') {
      Alert.alert(
        'Fonctionnalité Premium',
        'Les vidéos sont disponibles uniquement pour les plans Pro et Premium. Passez à un plan supérieur pour débloquer cette fonctionnalité.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Voir les plans', onPress: () => router.push('/seller/subscription-plans') }
        ]
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 30, // Limite à 30 secondes
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const addVideoFromUrlInput = () => {
    if (!videoUrlInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL de vidéo');
      return;
    }

    // Vérifier le plan
    if (userPlan !== 'pro' && userPlan !== 'premium') {
      Alert.alert(
        'Fonctionnalité Premium',
        'Les vidéos sont disponibles uniquement pour les plans Pro et Premium.'
      );
      return;
    }

    if (!videoUrlInput.startsWith('http://') && !videoUrlInput.startsWith('https://')) {
      Alert.alert('Erreur', 'L\'URL doit commencer par http:// ou https://');
      return;
    }

    setVideoUri(videoUrlInput.trim());
    setVideoUrlInput('');
  };

  const removeVideo = () => {
    setVideoUri(null);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        { text: 'Galerie', onPress: pickImages },
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Lien URL', onPress: addImageFromUrl },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleAddProduct = async () => {
    if (!title.trim() || !price || !stock) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (imageUris.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins une photo du produit');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Erreur', 'Le stock doit être un nombre positif');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Séparer les URLs existantes des fichiers locaux
      const localFiles = imageUris.filter(uri => !uri.startsWith('http://') && !uri.startsWith('https://'));
      const existingUrls = imageUris.filter(uri => uri.startsWith('http://') || uri.startsWith('https://'));

      // Upload des fichiers locaux
      let uploadedUrls: string[] = [];
      if (localFiles.length > 0) {
        const uploadResults = await uploadProductImages(localFiles);

        // Vérifier les erreurs
        const failedUploads = uploadResults.filter(r => !r.success);
        if (failedUploads.length > 0) {
          throw new Error(`Échec de l'upload de ${failedUploads.length} image(s)`);
        }

        uploadedUrls = uploadResults.map(r => r.url!);
      }

      // Combiner toutes les URLs dans l'ordre original
      const allImageUrls: string[] = [];
      for (const uri of imageUris) {
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          allImageUrls.push(uri);
        } else {
          const uploadedUrl = uploadedUrls.shift();
          if (uploadedUrl) {
            allImageUrls.push(uploadedUrl);
          }
        }
      }

      const { data: newProduct, error } = await supabase.from('products').insert({
        seller_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        currency: 'FCFA',
        stock: stockNum,
        category_id: selectedCategory,
        image_url: allImageUrls[0], // Primary image
        images: allImageUrls, // All images array
        video_url: videoUri, // Video URL
        is_active: true,
      }).select().single();

      if (error) throw error;

      // Rediriger vers la page de succès avec l'ID du produit créé
      router.replace(`/seller/product-success?productId=${newProduct.id}`);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Ajouter un produit</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos du produit *</Text>
          <Text style={styles.sectionSubtitle}>Ajoutez jusqu'à 5 photos (la première sera la photo principale)</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.productImage} />
                {index === 0 && (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </LinearGradient>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}>
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {imageUris.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}>
                <Camera size={32} color="#D97706" />
                <Text style={styles.addImageText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Ou ajouter par URL */}
          {imageUris.length < 5 && (
            <View style={styles.urlInputSection}>
              <Text style={styles.urlInputLabel}>Ou ajouter par lien URL :</Text>
              <View style={styles.urlInputRow}>
                <TextInput
                  style={styles.urlInput}
                  value={imageUrlInput}
                  onChangeText={setImageUrlInput}
                  placeholder="https://exemple.com/image.jpg"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.urlAddButton}
                  onPress={addImageFromUrlInput}>
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Video Section */}
        <View style={styles.section}>
          <View style={styles.videoHeader}>
            <Text style={styles.sectionTitle}>Vidéo du produit</Text>
            {(userPlan === 'pro' || userPlan === 'premium') && (
              <LinearGradient
                colors={['#8B5CF6', '#6B21A8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PRO/PREMIUM</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            {(userPlan === 'pro' || userPlan === 'premium')
              ? 'Ajoutez une vidéo de 30 secondes maximum pour mieux présenter votre produit'
              : 'Passez à Pro ou Premium pour ajouter des vidéos'}
          </Text>

          {videoUri ? (
            <View style={styles.videoPreviewContainer}>
              <ExpoVideo
                source={{ uri: videoUri }}
                style={styles.videoPreview}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={removeVideo}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.addVideoButton,
                  (userPlan !== 'pro' && userPlan !== 'premium') && styles.addVideoButtonDisabled
                ]}
                onPress={pickVideo}>
                <Video size={32} color={(userPlan === 'pro' || userPlan === 'premium') ? '#8B5CF6' : '#9CA3AF'} />
                <Text style={[
                  styles.addVideoText,
                  (userPlan !== 'pro' && userPlan !== 'premium') && styles.addVideoTextDisabled
                ]}>
                  {(userPlan === 'pro' || userPlan === 'premium')
                    ? 'Ajouter une vidéo'
                    : 'Vidéo (Pro/Premium uniquement)'}
                </Text>
                {(userPlan === 'pro' || userPlan === 'premium') && (
                  <Text style={styles.videoHint}>Max 30 secondes</Text>
                )}
              </TouchableOpacity>

              {/* Ou ajouter par URL */}
              {(userPlan === 'pro' || userPlan === 'premium') && (
                <View style={styles.urlInputSection}>
                  <Text style={styles.urlInputLabel}>Ou ajouter par lien URL :</Text>
                  <View style={styles.urlInputRow}>
                    <TextInput
                      style={styles.urlInput}
                      value={videoUrlInput}
                      onChangeText={setVideoUrlInput}
                      placeholder="https://exemple.com/video.mp4"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={[styles.urlAddButton, { backgroundColor: '#8B5CF6' }]}
                      onPress={addVideoFromUrlInput}>
                      <Plus size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titre du produit *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Masque traditionnel Sénégalais"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre produit en détail..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Prix (FCFA) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="25000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                placeholder="10"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextSelected,
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleAddProduct}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Package size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Publier le produit</Text>
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
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  imagesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#D97706',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 8,
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
    backgroundColor: '#F9FAFB',
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
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
  row: {
    flexDirection: 'row',
  },
  categoriesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextSelected: {
    color: '#D97706',
  },
  primaryButton: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoPreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVideoButton: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVideoButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  addVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 8,
  },
  addVideoTextDisabled: {
    color: '#9CA3AF',
  },
  videoHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
