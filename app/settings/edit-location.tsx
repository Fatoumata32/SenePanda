import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LocationPicker } from '../../components/LocationPicker';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';

export default function EditLocationScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        router.back();
        return;
      }

      setUserId(user.id);

      // Charger la localisation actuelle
      const { data: profile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', user.id)
        .single();

      if (profile?.location) {
        setCurrentLocation(profile.location);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleLocationSelected = (
    coords: { latitude: number; longitude: number },
    address: string
  ) => {
    setSelectedCoords(coords);
    setSelectedAddress(address);
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre localisation');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          location: selectedAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert(
        'Succès',
        'Votre localisation a été mise à jour',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder la localisation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ma Localisation</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Localisation actuelle */}
        {currentLocation && (
          <View style={styles.currentLocationContainer}>
            <Text style={styles.sectionTitle}>Localisation actuelle</Text>
            <View style={styles.currentLocationCard}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.currentLocationText}>{currentLocation}</Text>
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            Votre localisation permet aux vendeurs de connaître votre ville et de mieux vous servir.
            Elle sera également utilisée pour vous montrer les produits disponibles près de chez vous.
          </Text>
        </View>

        {/* LocationPicker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.sectionTitle}>Mettre à jour ma position</Text>
          <LocationPicker
            onLocationSelected={handleLocationSelected}
            showAddress={true}
            buttonText="📍 Utiliser ma position actuelle"
          />
        </View>

        {/* Avantages */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.sectionTitle}>Avantages de la localisation</Text>

          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              Voir les produits disponibles près de chez vous
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              Frais de livraison calculés précisément
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              Recommandations personnalisées selon votre zone
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.benefitText}>
              Trouver des vendeurs locaux facilement
            </Text>
          </View>
        </View>

        {/* Confidentialité */}
        <View style={styles.privacyCard}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <Text style={styles.privacyText}>
            🔒 Votre position exacte n'est jamais partagée. Seule votre ville/quartier est visible.
          </Text>
        </View>
      </ScrollView>

      {/* Bouton de sauvegarde */}
      {selectedAddress && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color={Colors.white} />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  currentLocationContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  currentLocationText: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.lightBlue,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  pickerContainer: {
    marginBottom: 24,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark,
  },
  privacyCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.lightGreen,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
