import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface VendorProduct {
  id: string;
  price: number;
  weight: string;
  isActive: boolean;
  icon: string;
}

export default function VendorProfileScreen() {
  const router = useRouter();
  const [vendorName, setVendorName] = useState('Amadou Sow');
  const [location, setLocation] = useState('Dakar, Sénégal');
  const [products, setProducts] = useState<VendorProduct[]>([
    { id: '1', price: 2000, weight: '1,5 kg', isActive: true, icon: '🐔' },
    { id: '2', price: 3500, weight: '2 kg', isActive: false, icon: '🐔' },
    { id: '3', price: 4000, weight: '2,5 kg', isActive: true, icon: '🐔' },
  ]);

  const toggleProduct = (id: string) => {
    setProducts(products.map(product =>
      product.id === id ? { ...product, isActive: !product.isActive } : product
    ));
  };

  const handleEditProduct = (product: VendorProduct) => {
    Alert.alert(
      'Modifier le produit',
      `Modifier ${product.weight} - ${product.price} CFA`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Modifier',
          onPress: () => {
            // Navigation vers la page d'édition
            console.log('Edit product:', product.id);
          },
        },
      ]
    );
  };

  const handleDeleteProduct = (product: VendorProduct) => {
    Alert.alert(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer ${product.weight} - ${product.price} CFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setProducts(products.filter(p => p.id !== product.id));
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    Alert.alert(
      'Ajouter un poulet',
      'Cette fonctionnalité sera disponible prochainement',
      [{ text: 'OK' }]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Modifier le profil',
      'Modifier votre nom et localisation',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.dark} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert('Menu', 'Options du profil')}
          activeOpacity={0.7}
        >
          <MoreVertical size={24} color={Colors.dark} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <View style={styles.profileInfo}>
            <Text style={styles.vendorName}>{vendorName}</Text>
            <Text style={styles.vendorLocation}>{location}</Text>
          </View>
          <ChevronRight size={24} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes produits</Text>

          <View style={styles.productsList}>
            {products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                {/* Product Icon */}
                <View style={styles.productIcon}>
                  <Text style={styles.productIconText}>{product.icon}</Text>
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                  <Text style={styles.productPrice}>{product.price} CFA</Text>
                  <Text style={styles.productWeight}>{product.weight}</Text>
                </View>

                {/* Actions */}
                <View style={styles.productActions}>
                  {/* Edit Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditProduct(product)}
                    activeOpacity={0.7}
                  >
                    <Edit2 size={20} color={Colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteProduct(product)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={20} color={Colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>

                  {/* Toggle Switch */}
                  <Switch
                    value={product.isActive}
                    onValueChange={() => toggleProduct(product.id)}
                    trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                    thumbColor={Colors.white}
                    ios_backgroundColor="#D1D5DB"
                    style={styles.switch}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProduct}
          activeOpacity={0.9}
        >
          <View style={styles.addButtonContent}>
            <Plus size={24} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Ajouter un poulet</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  profileInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  vendorLocation: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },

  // Section
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  // Products List
  productsList: {
    gap: Spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIconText: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productPrice: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.dark,
    marginBottom: 2,
  },
  productWeight: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },

  // Add Button
  addButton: {
    backgroundColor: '#10B981',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  addButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  addButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
});
