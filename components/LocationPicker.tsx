import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation';
import { Colors } from '../constants/Colors';

interface LocationPickerProps {
  onLocationSelected?: (coords: {
    latitude: number;
    longitude: number;
  }, address: string) => void;
  showAddress?: boolean;
  buttonText?: string;
  style?: any;
}

/**
 * Composant LocationPicker
 *
 * Permet à l'utilisateur de sélectionner sa position actuelle en un clic
 *
 * @example
 * <LocationPicker
 *   onLocationSelected={(coords, address) => {
 *     console.log('Position:', coords);
 *     console.log('Adresse:', address);
 *   }}
 *   showAddress={true}
 * />
 */
export function LocationPicker({
  onLocationSelected,
  showAddress = true,
  buttonText = 'Utiliser ma position actuelle',
  style,
}: LocationPickerProps) {
  const {
    coords,
    address,
    city,
    isLoading,
    error,
    requestLocation,
    hasPermission,
  } = useLocation();

  const handlePress = async () => {
    await requestLocation();

    if (coords && onLocationSelected) {
      onLocationSelected(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        address || ''
      );
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Bouton de localisation */}
      <TouchableOpacity
        style={[
          styles.button,
          isLoading && styles.buttonLoading,
          coords && styles.buttonSuccess,
        ]}
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Ionicons
            name={coords ? 'checkmark-circle' : 'location'}
            size={20}
            color={Colors.white}
          />
        )}
        <Text style={styles.buttonText}>
          {isLoading
            ? 'Localisation en cours...'
            : coords
            ? 'Position obtenue'
            : buttonText}
        </Text>
      </TouchableOpacity>

      {/* Affichage de l'adresse */}
      {showAddress && coords && address && (
        <View style={styles.addressContainer}>
          <Ionicons
            name="location-outline"
            size={16}
            color={Colors.gray}
            style={styles.addressIcon}
          />
          <View style={styles.addressTextContainer}>
            {city && (
              <Text style={styles.cityText}>{city}</Text>
            )}
            <Text style={styles.addressText}>{address}</Text>
            {coords.accuracy && (
              <Text style={styles.accuracyText}>
                Précision: ±{Math.round(coords.accuracy)}m
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Affichage des erreurs */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Message d'aide si pas de permission */}
      {!hasPermission && !isLoading && !error && (
        <Text style={styles.helpText}>
          📍 Autorisez l'accès à votre position pour trouver les produits près de chez vous
        </Text>
      )}
    </View>
  );
}

/**
 * Composant LocationDisplay
 *
 * Affiche simplement la localisation actuelle (lecture seule)
 */
export function LocationDisplay() {
  const { coords, address, city, isLoading } = useLocation(true); // auto-request

  if (isLoading) {
    return (
      <View style={styles.displayContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Localisation...</Text>
      </View>
    );
  }

  if (!coords) {
    return (
      <View style={styles.displayContainer}>
        <Ionicons name="location-outline" size={16} color={Colors.gray} />
        <Text style={styles.noLocationText}>Position non disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.displayContainer}>
      <Ionicons name="location" size={16} color={Colors.primary} />
      <View style={styles.displayTextContainer}>
        {city && <Text style={styles.displayCityText}>{city}</Text>}
        {address && <Text style={styles.displayAddressText}>{address}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonLoading: {
    backgroundColor: Colors.gray,
  },
  buttonSuccess: {
    backgroundColor: Colors.success,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
  },
  accuracyText: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 6,
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
  },
  helpText: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // LocationDisplay styles
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.gray,
  },
  noLocationText: {
    fontSize: 14,
    color: Colors.gray,
  },
  displayTextContainer: {
    flex: 1,
  },
  displayCityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  displayAddressText: {
    fontSize: 12,
    color: Colors.gray,
  },
});
