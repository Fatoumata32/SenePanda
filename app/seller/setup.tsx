import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Store,
  TrendingUp,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Gift,
  Globe,
  Clock,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function SellerSetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Marquer l'utilisateur comme vendeur
        await supabase
          .from('profiles')
          .update({ is_seller: true })
          .eq('id', user.id);
      }
      // Rediriger vers le wizard de création de boutique
      router.push('/seller/shop-wizard');
    } catch (error) {
      console.error('Error:', error);
      router.push('/seller/shop-wizard');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: <Store size={24} color="#F59E0B" />,
      title: 'Créez votre boutique',
      description: 'Une vitrine professionnelle pour vos produits',
    },
    {
      icon: <TrendingUp size={24} color="#10B981" />,
      title: 'Augmentez vos ventes',
      description: 'Accédez à des milliers de clients potentiels',
    },
    {
      icon: <Users size={24} color="#3B82F6" />,
      title: 'Gérez vos clients',
      description: 'Suivez vos commandes et communiquez facilement',
    },
    {
      icon: <Shield size={24} color="#8B5CF6" />,
      title: 'Paiements sécurisés',
      description: 'Transactions protégées et fiables',
    },
    {
      icon: <Globe size={24} color="#EC4899" />,
      title: 'Visibilité nationale',
      description: 'Vendez partout au Sénégal et au-delà',
    },
    {
      icon: <Clock size={24} color="#F97316" />,
      title: 'Support 24/7',
      description: 'Une équipe dédiée pour vous accompagner',
    },
  ];

  const features = [
    'Publication illimitée de produits',
    'Statistiques de ventes détaillées',
    'Gestion des stocks simplifiée',
    'Notifications en temps réel',
    'Système de fidélité clients',
    'Outils marketing intégrés',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerIcon}>
            <Store size={40} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Devenez Vendeur</Text>
          <Text style={styles.headerSubtitle}>
            Rejoignez la communauté Senepanda et développez votre activité
          </Text>
        </LinearGradient>

        {/* Benefits Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pourquoi vendre sur Senepanda ?</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>{benefit.icon}</View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features List */}
        <View style={styles.section}>
          <View style={styles.featuresCard}>
            <View style={styles.featuresHeader}>
              <Gift size={24} color="#F59E0B" />
              <Text style={styles.featuresTitle}>Ce qui est inclus</Text>
            </View>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <CheckCircle size={18} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5000+</Text>
            <Text style={styles.statLabel}>Vendeurs actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Produits vendus</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Satisfaction</Text>
          </View>
        </View>

        {/* Promo Badge */}
        <View style={styles.promoBadge}>
          <Zap size={20} color="#F59E0B" />
          <Text style={styles.promoText}>
            Inscription gratuite • Commencez à vendre aujourd'hui
          </Text>
        </View>

      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/profile');
            }
          }}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Plus tard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Créer ma boutique</Text>
              <ArrowRight size={20} color="#FFF" />
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  featuresCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  promoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  secondaryButton: {
    flex: 0.35,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  primaryButton: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
