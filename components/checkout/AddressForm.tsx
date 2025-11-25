import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Home, Building2, Phone, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  postalCode?: string;
  isDefault?: boolean;
  type?: 'home' | 'work';
}

interface AddressFormProps {
  initialAddress?: Partial<Address>;
  onSubmit: (address: Address) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

function AddressFormComponent({
  initialAddress = {},
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
}: AddressFormProps) {
  const [fullName, setFullName] = useState(initialAddress.fullName || '');
  const [phone, setPhone] = useState(initialAddress.phone || '');
  const [address, setAddress] = useState(initialAddress.address || '');
  const [city, setCity] = useState(initialAddress.city || 'Dakar');
  const [region, setRegion] = useState(initialAddress.region || 'Dakar');
  const [postalCode, setPostalCode] = useState(initialAddress.postalCode || '');
  const [addressType, setAddressType] = useState<'home' | 'work'>(initialAddress.type || 'home');
  const [isDefault, setIsDefault] = useState(initialAddress.isDefault || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Le nom est requis';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^(\+221)?[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }
    if (!address.trim()) {
      newErrors.address = "L'adresse est requise";
    }
    if (!city.trim()) {
      newErrors.city = 'La ville est requise';
    }
    if (!region.trim()) {
      newErrors.region = 'La région est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        region: region.trim(),
        postalCode: postalCode.trim(),
        type: addressType,
        isDefault,
      });
    }
  };

  const regions = [
    'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
    'Fatick', 'Tambacounda', 'Kolda', 'Matam', 'Louga',
    'Diourbel', 'Kaffrine', 'Kédougou', 'Sédhiou',
  ];

  return (
    <View style={styles.container}>
      {/* Address Type */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, addressType === 'home' && styles.typeButtonActive]}
          onPress={() => setAddressType('home')}
        >
          <Home size={18} color={addressType === 'home' ? Colors.primaryOrange : Colors.textSecondary} />
          <Text style={[styles.typeText, addressType === 'home' && styles.typeTextActive]}>
            Domicile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, addressType === 'work' && styles.typeButtonActive]}
          onPress={() => setAddressType('work')}
        >
          <Building2 size={18} color={addressType === 'work' ? Colors.primaryOrange : Colors.textSecondary} />
          <Text style={[styles.typeText, addressType === 'work' && styles.typeTextActive]}>
            Travail
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom complet *</Text>
        <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
          <User size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Amadou Diallo"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      {/* Phone */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Téléphone *</Text>
        <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
          <Phone size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="77 123 45 67"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Adresse *</Text>
        <View style={[styles.inputContainer, errors.address && styles.inputError]}>
          <MapPin size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Rue, Quartier, Immeuble..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>

      {/* City & Region */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Ville *</Text>
          <TextInput
            style={[styles.simpleInput, errors.city && styles.inputError]}
            value={city}
            onChangeText={setCity}
            placeholder="Dakar"
            placeholderTextColor={Colors.textMuted}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Région *</Text>
          <TextInput
            style={[styles.simpleInput, errors.region && styles.inputError]}
            value={region}
            onChangeText={setRegion}
            placeholder="Dakar"
            placeholderTextColor={Colors.textMuted}
          />
          {errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
        </View>
      </View>

      {/* Default Address Toggle */}
      <TouchableOpacity
        style={styles.defaultToggle}
        onPress={() => setIsDefault(!isDefault)}
      >
        <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
          {isDefault && <View style={styles.checkboxInner} />}
        </View>
        <Text style={styles.defaultText}>Définir comme adresse par défaut</Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitButton, !onCancel && styles.submitButtonFull]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.lightGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: `${Colors.primaryOrange}10`,
    borderColor: Colors.primaryOrange,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeTextActive: {
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  simpleInput: {
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: Colors.primaryOrange,
    backgroundColor: Colors.primaryOrange,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  defaultText: {
    fontSize: 14,
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
  },
  submitButtonFull: {
    flex: 1,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

export const AddressForm = memo(AddressFormComponent);
export default AddressForm;
