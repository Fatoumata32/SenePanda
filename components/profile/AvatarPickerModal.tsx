import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import * as Speech from 'expo-speech';
import { uploadProfileAvatar } from '@/lib/image-upload';

const DesignTokens = {
  spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { sm: 12, md: 16, lg: 20, xl: 24, full: 9999 },
  typography: {
    h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
    h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  },
  colors: {
    cardWhite: '#FFFFFF',
    text: { primary: '#1F2937', secondary: '#6B7280' },
    pastel: {
      pink: { bg: '#FCE7F3', icon: '#DB2777' },
      blue: { bg: '#DBEAFE', icon: '#2563EB' },
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
};

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (uri: string) => void;
  userId: string;
  themeColors: {
    card: string;
    text: string;
    textSecondary: string;
  };
}

export default function AvatarPickerModal({
  visible,
  onClose,
  onSuccess,
  userId,
  themeColors,
}: AvatarPickerModalProps) {
  const [modalAnim] = React.useState(new Animated.Value(0));
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const handlePickImage = async (fromCamera: boolean = false) => {
    try {
      setUploading(true);

      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission requise', "Veuillez autoriser l'accès");
        setUploading(false);
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        // Upload l'image vers Supabase Storage
        const uploadResult = await uploadProfileAvatar(uri, userId);

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || "Erreur lors de l'upload de l'image");
        }

        // Mettre à jour le profil avec l'URL publique
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: uploadResult.url })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }

        Speech.speak('Photo de profil mise à jour', { language: 'fr-FR' });
        onSuccess(uploadResult.url);
        onClose();
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Erreur', error.message || "Impossible de mettre à jour la photo de profil");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.avatarModalContent,
            {
              backgroundColor: themeColors.card,
              transform: [{
                scale: modalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }],
              opacity: modalAnim,
            }
          ]}>
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>Changer la photo</Text>

          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text style={[styles.uploadingText, { color: themeColors.textSecondary }]}>Upload en cours...</Text>
            </View>
          ) : (
            <>
              <View style={styles.avatarOptions}>
                <TouchableOpacity
                  style={styles.avatarOption}
                  onPress={() => handlePickImage(true)}>
                  <View style={[styles.avatarOptionIcon, { backgroundColor: DesignTokens.colors.pastel.pink.bg }]}>
                    <Camera size={28} color={DesignTokens.colors.pastel.pink.icon} />
                  </View>
                  <Text style={[styles.avatarOptionText, { color: themeColors.text }]}>Prendre une photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.avatarOption}
                  onPress={() => handlePickImage(false)}>
                  <View style={[styles.avatarOptionIcon, { backgroundColor: DesignTokens.colors.pastel.blue.bg }]}>
                    <ImageIcon size={28} color={DesignTokens.colors.pastel.blue.icon} />
                  </View>
                  <Text style={[styles.avatarOptionText, { color: themeColors.text }]}>Galerie</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={onClose}>
                <Text style={[styles.modalCancelText, { color: themeColors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
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
  avatarModalContent: {
    backgroundColor: DesignTokens.colors.cardWhite,
    borderTopLeftRadius: DesignTokens.radius.xl,
    borderTopRightRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing.xxl,
    alignItems: 'center',
  },
  modalTitle: {
    ...DesignTokens.typography.h2,
    color: DesignTokens.colors.text.primary,
  },
  avatarOptions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xl,
    marginVertical: DesignTokens.spacing.xl,
  },
  avatarOption: {
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  avatarOptionIcon: {
    width: 80,
    height: 80,
    borderRadius: DesignTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignTokens.shadows.sm,
  },
  avatarOptionText: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.primary,
  },
  modalCancelButton: {
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.xxl,
  },
  modalCancelText: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text.secondary,
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.xxl * 2,
    gap: DesignTokens.spacing.md,
  },
  uploadingText: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.text.secondary,
  },
});
