import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type RoleSelectionScreenProps = {
  onRoleSelected: (role: 'buyer' | 'seller') => Promise<void>;
};

export default function RoleSelectionScreen({ onRoleSelected }: RoleSelectionScreenProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);

  const handleRoleSelection = async (role: 'buyer' | 'seller') => {
    setSelectedRole(role);
    setLoading(true);
    try {
      await onRoleSelected(role);
    } catch (error) {
      console.error('Error selecting role:', error);
      setLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <LinearGradient colors={Gradients.hero.colors} style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenue sur PandaMarket</Text>
          <Text style={styles.subtitle}>
            Comment souhaitez-vous utiliser l'application ?
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          {/* Buyer Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelection('buyer')}
            disabled={loading}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#FF6B35', '#FF8C42']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              {loading && selectedRole === 'buyer' ? (
                <ActivityIndicator size="large" color={Colors.white} />
              ) : (
                <>
                  <View style={styles.iconContainer}>
                    <Ionicons name="cart" size={60} color={Colors.white} />
                  </View>
                  <Text style={styles.roleTitle}>Je veux acheter</Text>
                  <Text style={styles.roleDescription}>
                    Découvrir des produits et faire du shopping
                  </Text>
                  <View style={styles.featuresContainer}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                      <Text style={styles.featureText}>Parcourir les produits</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                      <Text style={styles.featureText}>Suivre mes commandes</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                      <Text style={styles.featureText}>Gagner des points</Text>
                    </View>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Seller Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelection('seller')}
            disabled={loading}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              {loading && selectedRole === 'seller' ? (
                <ActivityIndicator size="large" color={Colors.white} />
              ) : (
                <>
                  <View style={styles.iconContainer}>
                    <Ionicons name="storefront" size={60} color={Colors.white} />
                  </View>
                  <Text style={styles.roleTitle}>Je veux vendre</Text>
                  <Text style={styles.roleDescription}>
                    Créer ma boutique et vendre mes produits
                  </Text>
                  <View style={styles.featuresContainer}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                      <Text style={styles.featureText}>Gérer ma boutique</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                      <Text style={styles.featureText}>Publier des produits</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                      <Text style={styles.featureText}>Suivre mes ventes</Text>
                    </View>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.footerText}>
            Vous pourrez changer ce choix plus tard dans les paramètres
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  rolesContainer: {
    flex: 1,
    gap: 20,
  },
  roleCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  roleGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresContainer: {
    width: '100%',
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.95,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
    flex: 1,
  },
});
