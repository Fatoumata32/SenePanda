import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { X, AlertTriangle, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

const DesignTokens = {
  spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { sm: 12, md: 16, lg: 20, xl: 24, full: 9999 },
  typography: {
    h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  },
  colors: {
    cardWhite: '#FFFFFF',
    text: { primary: '#1F2937', secondary: '#6B7280' },
  },
};

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  themeColors: {
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    background: string;
  };
}

export default function DeleteAccountModal({
  visible,
  onClose,
  themeColors,
}: DeleteAccountModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleClose = () => {
    setDeleteConfirmation('');
    onClose();
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Confirmation finale',
      'Êtes-vous absolument sûr de vouloir supprimer votre compte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Delete user data
                await supabase.from('messages').delete().eq('sender_id', user.id);
                await supabase.from('favorites').delete().eq('user_id', user.id);
                await supabase.from('reviews').delete().eq('user_id', user.id);
                await supabase.from('products').delete().eq('seller_id', user.id);
                await supabase.from('shops').delete().eq('owner_id', user.id);
                await supabase.from('profiles').delete().eq('id', user.id);

                await AsyncStorage.clear();
                await supabase.auth.signOut();

                handleClose();
                Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue.');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.fullModalContent, { backgroundColor: themeColors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Supprimer le compte</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.deleteWarningCard}>
              <AlertTriangle size={40} color="#EF4444" />
              <Text style={styles.deleteWarningTitle}>Attention</Text>
              <Text style={styles.deleteWarningText}>
                Cette action est irréversible. Toutes vos données seront supprimées.
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Ce qui sera supprimé :</Text>
            <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
              • Votre profil et informations personnelles{'\n'}
              • Tous vos messages et conversations{'\n'}
              • Votre historique de commandes{'\n'}
              • Vos favoris et avis{'\n'}
              • Votre boutique et produits (si vendeur){'\n'}
              • Vos points de fidélité
            </Text>

            <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 20 }]}>Confirmation</Text>
            <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
              Tapez <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>SUPPRIMER</Text> pour confirmer :
            </Text>

            <TextInput
              style={[styles.deleteConfirmInput, {
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: deleteConfirmation === 'SUPPRIMER' ? '#EF4444' : themeColors.border
              }]}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="Tapez SUPPRIMER"
              placeholderTextColor={themeColors.textSecondary}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[
                styles.deleteAccountButton,
                deleteConfirmation !== 'SUPPRIMER' && styles.deleteAccountButtonDisabled
              ]}
              disabled={deleteConfirmation !== 'SUPPRIMER'}
              onPress={handleDeleteAccount}>
              <Trash2 size={20} color="#FFFFFF" />
              <Text style={styles.deleteAccountButtonText}>Supprimer définitivement</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
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
  fullModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
    paddingBottom: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...DesignTokens.typography.h2,
    color: DesignTokens.colors.text.primary,
  },
  modalScrollContent: {
    padding: DesignTokens.spacing.xl,
  },
  deleteWarningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteWarningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  deleteWarningText: {
    fontSize: 14,
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.sm,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: DesignTokens.spacing.sm,
  },
  deleteConfirmInput: {
    borderWidth: 2,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.lg,
  },
  deleteAccountButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    gap: DesignTokens.spacing.sm,
  },
  deleteAccountButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
