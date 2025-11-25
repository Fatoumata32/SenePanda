import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import {
  validateUsername,
  validatePhoneNumber,
  validateAddress,
} from '@/lib/validation';
import * as Speech from 'expo-speech';
import { Colors } from '@/constants/Colors';

const DesignTokens = {
  spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { sm: 12, md: 16, lg: 20, xl: 24, full: 9999 },
  typography: {
    h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
    h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  },
  colors: {
    cardWhite: '#FFFFFF',
    background: '#FAFAFA',
    text: { primary: '#1F2937', secondary: '#6B7280', muted: '#9CA3AF' },
    pastel: { purple: { icon: '#9333EA' } },
  },
};

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  initialData: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
  };
  isDark: boolean;
  themeColors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

export default function EditProfileModal({
  visible,
  onClose,
  onSuccess,
  userId,
  initialData,
  isDark,
  themeColors,
}: EditProfileModalProps) {
  const [editFirstName, setEditFirstName] = useState(initialData.firstName);
  const [editLastName, setEditLastName] = useState(initialData.lastName);
  const [editPhone, setEditPhone] = useState(initialData.phone);
  const [editCountry, setEditCountry] = useState(initialData.country);
  const [editCity, setEditCity] = useState(initialData.city);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setEditFirstName(initialData.firstName);
      setEditLastName(initialData.lastName);
      setEditPhone(initialData.phone);
      setEditCountry(initialData.country);
      setEditCity(initialData.city);
    }
  }, [visible, initialData]);

  const saveEdit = async () => {
    try {
      setSaving(true);

      const firstNameValidation = validateUsername(editFirstName);
      if (!firstNameValidation.isValid) {
        Alert.alert('Erreur', firstNameValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      const lastNameValidation = validateUsername(editLastName);
      if (!lastNameValidation.isValid) {
        Alert.alert('Erreur', lastNameValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      const phoneValidation = validatePhoneNumber(editPhone);
      if (!phoneValidation.isValid) {
        Alert.alert('Erreur', phoneValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      const countryValidation = validateAddress(editCountry);
      if (!countryValidation.isValid) {
        Alert.alert('Erreur', countryValidation.errors.join(', '));
        setSaving(false);
        return;
      }

      const updates = {
        id: userId,
        first_name: editFirstName,
        last_name: editLastName,
        full_name: `${editFirstName} ${editLastName}`,
        phone: editPhone,
        country: editCountry,
        city: editCity || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      onClose();
      onSuccess();
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      Speech.speak('Profil mis à jour avec succès', { language: 'fr-FR' });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.editModalContent, { backgroundColor: themeColors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Modifier le profil</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Prénom *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="Jean"
                placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Nom *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Dupont"
                placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Téléphone *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+221 77 123 45 67"
                keyboardType="phone-pad"
                placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Pays *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={editCountry}
                onChangeText={setEditCountry}
                placeholder="Sénégal"
                placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Ville</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="Dakar"
                placeholderTextColor={isDark ? '#6B7280' : DesignTokens.colors.text.muted}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButtonCancel, { backgroundColor: themeColors.background }]}
              onPress={onClose}>
              <Text style={[styles.modalButtonTextCancel, { color: themeColors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonSave}
              onPress={saveEdit}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color={DesignTokens.colors.cardWhite} />
              ) : (
                <Text style={styles.modalButtonTextSave}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    paddingBottom: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...DesignTokens.typography.h2,
    color: DesignTokens.colors.text.primary,
  },
  inputGroup: {
    marginBottom: DesignTokens.spacing.sm,
  },
  label: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing.xs,
  },
  input: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.xl,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.radius.sm,
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  modalButtonSave: {
    flex: 1,
    backgroundColor: DesignTokens.colors.pastel.purple.icon,
    borderRadius: DesignTokens.radius.sm,
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.secondary,
  },
  modalButtonTextSave: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.cardWhite,
  },
});
