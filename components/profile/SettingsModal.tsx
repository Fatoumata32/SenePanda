import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  X,
  Crown,
  Users,
  Moon,
  Sun,
  Settings,
  Shield,
  FileText,
  Trash2,
  LogOut,
  ChevronRight,
  Lock,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

const DesignTokens = {
  spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { sm: 12, md: 16, lg: 20, xl: 24, full: 9999 },
  typography: {
    h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
    h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  },
  colors: {
    cardWhite: '#FFFFFF',
    background: '#FAFAFA',
    text: { primary: '#1F2937', secondary: '#6B7280', muted: '#9CA3AF' },
  },
};

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenSubscription: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenDeleteAccount: () => void;
  onSignOut: () => void;
  isPremium: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  pinEnabled: boolean;
  onTogglePin: () => void;
  themeColors: {
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    background: string;
  };
}

export default function SettingsModal({
  visible,
  onClose,
  onOpenSubscription,
  onOpenPrivacy,
  onOpenTerms,
  onOpenDeleteAccount,
  onSignOut,
  isPremium,
  themeMode,
  setThemeMode,
  pinEnabled,
  onTogglePin,
  themeColors,
}: SettingsModalProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.settingsModalContent, { backgroundColor: themeColors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Paramètres</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Premium & Parrainage */}
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Premium & Récompenses</Text>

              <TouchableOpacity
                style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                onPress={() => {
                  onClose();
                  onOpenSubscription();
                }}>
                <Crown size={20} color="#F59E0B" />
                <Text style={[styles.settingsText, { color: themeColors.text }]}>
                  {isPremium ? 'Gérer mon abonnement' : 'Passer à Premium'}
                </Text>
                <ChevronRight size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                onPress={() => {
                  onClose();
                  router.push('/referral');
                }}>
                <Users size={20} color="#8B5CF6" />
                <Text style={[styles.settingsText, { color: themeColors.text }]}>Parrainage</Text>
                <ChevronRight size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Apparence</Text>

              <TouchableOpacity
                style={[
                  styles.settingsItem,
                  { backgroundColor: themeColors.background },
                  themeMode === 'light' && styles.settingsItemSelected
                ]}
                onPress={() => setThemeMode('light')}>
                <Sun size={20} color={themeMode === 'light' ? '#D97706' : themeColors.textSecondary} />
                <Text style={[
                  styles.settingsText,
                  { color: themeColors.text },
                  themeMode === 'light' && styles.settingsTextSelected
                ]}>Mode clair</Text>
                {themeMode === 'light' && (
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.settingsItem,
                  { backgroundColor: themeColors.background },
                  themeMode === 'dark' && styles.settingsItemSelected
                ]}
                onPress={() => setThemeMode('dark')}>
                <Moon size={20} color={themeMode === 'dark' ? '#D97706' : themeColors.textSecondary} />
                <Text style={[
                  styles.settingsText,
                  { color: themeColors.text },
                  themeMode === 'dark' && styles.settingsTextSelected
                ]}>Mode sombre</Text>
                {themeMode === 'dark' && (
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.settingsItem,
                  { backgroundColor: themeColors.background },
                  themeMode === 'system' && styles.settingsItemSelected
                ]}
                onPress={() => setThemeMode('system')}>
                <Settings size={20} color={themeMode === 'system' ? '#D97706' : themeColors.textSecondary} />
                <Text style={[
                  styles.settingsText,
                  { color: themeColors.text },
                  themeMode === 'system' && styles.settingsTextSelected
                ]}>Automatique (système)</Text>
                {themeMode === 'system' && (
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Sécurité */}
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Sécurité</Text>

              {/* Sécurité & Connexion */}
              <TouchableOpacity
                style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                onPress={() => {
                  onClose();
                  router.push('/settings/security');
                }}>
                <Shield size={20} color={Colors.primaryOrange} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingsText, { color: themeColors.text }]}>
                    Sécurité & Connexion
                  </Text>
                  <Text style={[styles.settingsSubtext, { color: themeColors.textSecondary }]}>
                    Auto-login, biométrie, code PIN
                  </Text>
                </View>
                <ChevronRight size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.settingsItem,
                  { backgroundColor: themeColors.background },
                  pinEnabled && styles.settingsItemSelected
                ]}
                onPress={onTogglePin}>
                <Lock size={20} color={pinEnabled ? '#D97706' : themeColors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.settingsText,
                    { color: themeColors.text },
                    pinEnabled && styles.settingsTextSelected
                  ]}>Code PIN à la connexion</Text>
                  <Text style={[styles.settingsSubtext, { color: themeColors.textSecondary }]}>
                    {pinEnabled ? 'Activé - Protégez votre compte' : 'Désactivé - Aucune protection supplémentaire'}
                  </Text>
                </View>
                {pinEnabled && (
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Confidentialité & Légal</Text>

              <TouchableOpacity
                style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                onPress={() => {
                  onClose();
                  onOpenPrivacy();
                }}>
                <Shield size={20} color="#8B5CF6" />
                <Text style={[styles.settingsText, { color: themeColors.text }]}>Confidentialité</Text>
                <ChevronRight size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                onPress={() => {
                  onClose();
                  onOpenTerms();
                }}>
                <FileText size={20} color="#3B82F6" />
                <Text style={[styles.settingsText, { color: themeColors.text }]}>Conditions d'utilisation</Text>
                <ChevronRight size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: themeColors.textSecondary }]}>Compte</Text>

              <TouchableOpacity
                style={[styles.settingsItem, { backgroundColor: themeColors.background }]}
                onPress={() => {
                  onClose();
                  onOpenDeleteAccount();
                }}>
                <Trash2 size={20} color="#EF4444" />
                <Text style={[styles.settingsText, { color: '#EF4444' }]}>Supprimer mon compte</Text>
                <ChevronRight size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.settingsLogout}
              onPress={() => {
                onClose();
                onSignOut();
              }}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.settingsLogoutText}>Déconnexion</Text>
            </TouchableOpacity>
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
  settingsModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xl,
    maxHeight: '80%',
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
  settingsSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: DesignTokens.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: DesignTokens.spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.radius.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  settingsText: {
    flex: 1,
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text.primary,
    fontWeight: '600',
  },
  settingsSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: DesignTokens.colors.text.secondary,
    marginTop: 4,
  },
  settingsItemSelected: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  settingsTextSelected: {
    color: '#D97706',
    fontWeight: '700',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  settingsLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.sm,
    padding: DesignTokens.spacing.lg,
    backgroundColor: '#FEE2E2',
    borderRadius: DesignTokens.radius.md,
    marginTop: DesignTokens.spacing.xl,
  },
  settingsLogoutText: {
    ...DesignTokens.typography.h3,
    color: '#EF4444',
  },
});
