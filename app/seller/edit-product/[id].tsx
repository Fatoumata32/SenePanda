import { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { Category, Product } from '@/types/database';
import { ArrowLeft, Camera, X, Plus, Package, Save, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pickImageFromGallery, takePhoto as capturePhoto, uploadProductImage } from '@/lib/image-upload';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // États pour la réduction par pourcentage
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  // Animation pour le prix
  const priceAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadCategories();
    loadProduct();
  }, [id]);

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

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading product:', error);
        throw error;
      }

      if (!data) {
        console.warn('Product not found with id:', id);
        Alert.alert('Erreur', 'Produit introuvable');
        router.back();
        return;
      }

      setTitle(data.title);
      setDescription(data.description || '');
      setPrice(data.price.toString());
      setStock(data.stock.toString());
      setSelectedCategory(data.category_id);
      setImageUris(data.images || [data.image_url]);

      // Charger les données de réduction si elles existent
      if (data.has_discount && data.original_price && data.discount_percent) {
        setOriginalPrice(data.original_price.toString());
        setDiscountPercent(data.discount_percent.toString());
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
      router.back();
    } finally {
      setLoading(false);
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

  const addImageFromUrlInput = () => {
    if (!imageUrlInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL d\'image');
      return;
    }

    if (imageUris.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter maximum 5 images');
      return;
    }

    if (!imageUrlInput.startsWith('http://') && !imageUrlInput.startsWith('https://')) {
      Alert.alert('Erreur', 'L\'URL doit commencer par http:// ou https://');
      return;
    }

    setImageUris([...imageUris, imageUrlInput.trim()]);
    setImageUrlInput('');
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

  // Animer le changement de prix
  const animatePriceChange = () => {
    Animated.sequence([
      Animated.timing(priceAnimation, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(priceAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Calculer le prix avec réduction
  const applyDiscount = (percent: string) => {
    const percentNum = parseFloat(percent);
    const originalPriceNum = parseFloat(originalPrice || price);

    if (isNaN(percentNum) || isNaN(originalPriceNum)) {
      return;
    }

    if (percentNum < 0 || percentNum > 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Le pourcentage doit être entre 0 et 100');
      return;
    }

    // Haptic feedback pour succès
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const discountAmount = (originalPriceNum * percentNum) / 100;
    const newPrice = originalPriceNum - discountAmount;
    setPrice(Math.round(newPrice).toString());
    setDiscountPercent(percent);

    // Animer le changement
    animatePriceChange();

    // Mémoriser le prix original si ce n'est pas déjà fait
    if (!originalPrice) {
      setOriginalPrice(price);
    }
  };

  // Appliquer une réduction rapide
  const applyQuickDiscount = (percent: number) => {
    // Utiliser le prix actuel comme prix original si pas encore défini
    if (!originalPrice) {
      setOriginalPrice(price);
    }
    applyDiscount(percent.toString());
  };

  // Réinitialiser le prix au prix original
  const resetPrice = () => {
    if (originalPrice) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPrice(originalPrice);
      setDiscountPercent('');
      setOriginalPrice('');
      animatePriceChange();
    }
  };

  const uploadImage = async (uri: string) => {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    const result = await uploadProductImage(uri);
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'upload de l\'image');
    }
    return result.url;
  };

  const handleUpdateProduct = async () => {
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
      setSaving(true);

      const uploadPromises = imageUris.map(uri => uploadImage(uri));
      const imageUrls = await Promise.all(uploadPromises);

      // Préparer les données de mise à jour
      const updateData: any = {
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        stock: stockNum,
        category_id: selectedCategory,
        image_url: imageUrls[0],
        images: imageUrls,
        updated_at: new Date().toISOString(),
      };

      // Ajouter les champs de réduction si applicable
      if (discountPercent && originalPrice) {
        updateData.original_price = parseFloat(originalPrice);
        updateData.discount_percent = parseInt(discountPercent);
        updateData.has_discount = true;
      } else {
        updateData.original_price = null;
        updateData.discount_percent = 0;
        updateData.has_discount = false;
      }

      const { error } = await supabase.from('products').update(updateData).eq('id', id);

      if (error) throw error;

      // Message personnalisé avec info de réduction
      const successMessage = discountPercent && originalPrice
        ? `Produit modifié avec succès!\n\nRéduction de ${discountPercent}% appliquée\nNouveau prix: ${parseFloat(price).toLocaleString()} FCFA`
        : 'Produit modifié avec succès!';

      Alert.alert('Succès!', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Synchronisation automatique : retour avec refresh
            router.back();
          },
        },
      ]);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le produit</Text>
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
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
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
              <View style={styles.labelRow}>
                <Text style={styles.label}>Prix (FCFA) *</Text>
                {discountPercent && originalPrice && (
                  <View style={styles.discountBadge}>
                    <Tag size={12} color="#FFFFFF" />
                    <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
                  </View>
                )}
              </View>
              <Animated.View style={{ transform: [{ scale: priceAnimation }] }}>
                <TextInput
                  style={[
                    styles.input,
                    discountPercent && originalPrice && styles.inputWithDiscount
                  ]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="25000"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </Animated.View>
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

          {/* Section Réduction par pourcentage */}
          <View style={styles.discountSection}>
            <View style={styles.discountHeader}>
              <Text style={styles.discountTitle}>💰 Appliquer une réduction</Text>
              {discountPercent && originalPrice && (
                <TouchableOpacity onPress={resetPrice} style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Réinitialiser</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Boutons de réduction rapide */}
            <View style={styles.quickDiscountRow}>
              <TouchableOpacity
                style={[styles.quickDiscountBtn, discountPercent === '10' && styles.quickDiscountBtnActive]}
                onPress={() => applyQuickDiscount(10)}
              >
                <Text style={[styles.quickDiscountText, discountPercent === '10' && styles.quickDiscountTextActive]}>
                  -10%
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDiscountBtn, discountPercent === '20' && styles.quickDiscountBtnActive]}
                onPress={() => applyQuickDiscount(20)}
              >
                <Text style={[styles.quickDiscountText, discountPercent === '20' && styles.quickDiscountTextActive]}>
                  -20%
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDiscountBtn, discountPercent === '30' && styles.quickDiscountBtnActive]}
                onPress={() => applyQuickDiscount(30)}
              >
                <Text style={[styles.quickDiscountText, discountPercent === '30' && styles.quickDiscountTextActive]}>
                  -30%
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDiscountBtn, discountPercent === '50' && styles.quickDiscountBtnActive]}
                onPress={() => applyQuickDiscount(50)}
              >
                <Text style={[styles.quickDiscountText, discountPercent === '50' && styles.quickDiscountTextActive]}>
                  -50%
                </Text>
              </TouchableOpacity>
            </View>

            {/* Champ de réduction personnalisée */}
            <View style={styles.customDiscountRow}>
              <View style={styles.customDiscountInput}>
                <TextInput
                  style={styles.input}
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  placeholder="Réduction personnalisée"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity
                style={styles.applyDiscountBtn}
                onPress={() => applyDiscount(discountPercent)}
              >
                <Text style={styles.applyDiscountText}>Appliquer %</Text>
              </TouchableOpacity>
            </View>

            {/* Aperçu de la réduction */}
            {discountPercent && originalPrice && (
              <View style={styles.discountPreview}>
                <Text style={styles.discountPreviewLabel}>Prix original:</Text>
                <Text style={styles.originalPriceText}>{parseFloat(originalPrice).toLocaleString()} FCFA</Text>
                <Text style={styles.discountAmountText}>-{discountPercent}% = -{Math.round((parseFloat(originalPrice) * parseFloat(discountPercent)) / 100).toLocaleString()} FCFA</Text>
                <Text style={styles.newPriceLabel}>Nouveau prix:</Text>
                <Text style={styles.newPriceText}>{parseFloat(price).toLocaleString()} FCFA</Text>
              </View>
            )}
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
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleUpdateProduct}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Enregistrer les modifications</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  inputWithDiscount: {
    borderColor: '#16A34A',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
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
  // Styles pour la section de réduction
  discountSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  quickDiscountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickDiscountBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D97706',
    alignItems: 'center',
  },
  quickDiscountBtnActive: {
    backgroundColor: '#D97706',
  },
  quickDiscountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  quickDiscountTextActive: {
    color: '#FFFFFF',
  },
  customDiscountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customDiscountInput: {
    flex: 1,
  },
  applyDiscountBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#D97706',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyDiscountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  discountPreview: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  discountPreviewLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  originalPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  discountAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  newPriceLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  newPriceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A34A',
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
});
