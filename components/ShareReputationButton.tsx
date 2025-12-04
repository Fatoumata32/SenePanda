import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { ReputationData } from './SellerReputationBadge';
import { useShareReputation } from '@/hooks/useShareReputation';

interface ShareReputationButtonProps {
  reputation: ReputationData;
  shopName?: string;
  viewRef?: any; // Référence vers le composant badge pour capture d'écran
  variant?: 'icon' | 'button' | 'full';
  size?: 'small' | 'medium' | 'large';
}

const ShareReputationButton: React.FC<ShareReputationButtonProps> = ({
  reputation,
  shopName,
  viewRef,
  variant = 'icon',
  size = 'medium',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { shareText, shareImage, shareToSocial, copyToClipboard, isSharing } =
    useShareReputation();

  const handleQuickShare = async () => {
    await shareText(reputation, shopName);
  };

  const handleShareWithImage = async () => {
    setModalVisible(false);
    if (viewRef && viewRef.current) {
      await shareImage(viewRef, reputation, shopName);
    } else {
      await shareText(reputation, shopName);
    }
  };

  const handleSocialShare = async (
    platform: 'facebook' | 'twitter' | 'whatsapp' | 'instagram'
  ) => {
    setModalVisible(false);
    await shareToSocial(platform, reputation, shopName);
  };

  const handleCopy = async () => {
    setModalVisible(false);
    await copyToClipboard(reputation, shopName);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { iconSize: 18, buttonPadding: 8, fontSize: 12 };
      case 'large':
        return { iconSize: 28, buttonPadding: 16, fontSize: 16 };
      default:
        return { iconSize: 22, buttonPadding: 12, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'icon') {
    return (
      <>
        <TouchableOpacity
          style={[styles.iconButton, { padding: sizeStyles.buttonPadding }]}
          onPress={() => setModalVisible(true)}
          disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator size="small" color={Colors.primaryOrange} />
          ) : (
            <Ionicons
              name="share-social"
              size={sizeStyles.iconSize}
              color={Colors.primaryOrange}
            />
          )}
        </TouchableOpacity>
        <ShareModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onShareText={handleQuickShare}
          onShareImage={handleShareWithImage}
          onShareSocial={handleSocialShare}
          onCopy={handleCopy}
          hasImage={!!viewRef}
          isSharing={isSharing}
        />
      </>
    );
  }

  if (variant === 'button') {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.button,
            { paddingVertical: sizeStyles.buttonPadding, paddingHorizontal: sizeStyles.buttonPadding * 1.5 },
          ]}
          onPress={() => setModalVisible(true)}
          disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="share-social" size={sizeStyles.iconSize} color="#FFFFFF" />
              <Text style={[styles.buttonText, { fontSize: sizeStyles.fontSize }]}>
                Partager
              </Text>
            </>
          )}
        </TouchableOpacity>
        <ShareModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onShareText={handleQuickShare}
          onShareImage={handleShareWithImage}
          onShareSocial={handleSocialShare}
          onCopy={handleCopy}
          hasImage={!!viewRef}
          isSharing={isSharing}
        />
      </>
    );
  }

  // variant === 'full'
  return (
    <>
      <TouchableOpacity
        style={styles.fullButton}
        onPress={() => setModalVisible(true)}
        disabled={isSharing}>
        <View style={styles.fullButtonContent}>
          <View style={styles.fullButtonIcon}>
            {isSharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="share-social" size={24} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.fullButtonText}>
            <Text style={styles.fullButtonTitle}>Partager ma réputation</Text>
            <Text style={styles.fullButtonSubtitle}>
              Montrez votre badge {reputation.level}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </View>
      </TouchableOpacity>
      <ShareModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onShareText={handleQuickShare}
        onShareImage={handleShareWithImage}
        onShareSocial={handleSocialShare}
        onCopy={handleCopy}
        hasImage={!!viewRef}
        isSharing={isSharing}
      />
    </>
  );
};

// Modal de partage
interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShareText: () => void;
  onShareImage: () => void;
  onShareSocial: (platform: 'facebook' | 'twitter' | 'whatsapp' | 'instagram') => void;
  onCopy: () => void;
  hasImage: boolean;
  isSharing: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  onShareText,
  onShareImage,
  onShareSocial,
  onCopy,
  hasImage,
  isSharing,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Partager ma réputation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Options de partage principales */}
            <View style={styles.shareOptions}>
              <ShareOption
                icon="share-outline"
                label="Partager (texte)"
                onPress={onShareText}
                disabled={isSharing}
              />

              {hasImage && (
                <ShareOption
                  icon="image-outline"
                  label="Partager avec image"
                  onPress={onShareImage}
                  disabled={isSharing}
                />
              )}

              <ShareOption
                icon="copy-outline"
                label="Copier le message"
                onPress={onCopy}
                disabled={isSharing}
              />
            </View>

            {/* Réseaux sociaux */}
            <Text style={styles.sectionTitle}>Partager sur</Text>
            <View style={styles.socialButtons}>
              <SocialButton
                icon="logo-whatsapp"
                label="WhatsApp"
                color="#25D366"
                onPress={() => onShareSocial('whatsapp')}
                disabled={isSharing}
              />
              <SocialButton
                icon="logo-facebook"
                label="Facebook"
                color="#1877F2"
                onPress={() => onShareSocial('facebook')}
                disabled={isSharing}
              />
              <SocialButton
                icon="logo-twitter"
                label="Twitter"
                color="#1DA1F2"
                onPress={() => onShareSocial('twitter')}
                disabled={isSharing}
              />
              <SocialButton
                icon="logo-instagram"
                label="Instagram"
                color="#E4405F"
                onPress={() => onShareSocial('instagram')}
                disabled={isSharing}
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Option de partage
interface ShareOptionProps {
  icon: any;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

const ShareOption: React.FC<ShareOptionProps> = ({ icon, label, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.shareOption, disabled && styles.shareOptionDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <View style={styles.shareOptionIcon}>
        <Ionicons name={icon} size={24} color={disabled ? '#CBD5E1' : Colors.primaryOrange} />
      </View>
      <Text style={[styles.shareOptionLabel, disabled && styles.shareOptionLabelDisabled]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );
};

// Bouton réseau social
interface SocialButtonProps {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  label,
  color,
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      style={[styles.socialButton, disabled && styles.socialButtonDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <View style={[styles.socialIcon, { backgroundColor: disabled ? '#E2E8F0' : color }]}>
        <Ionicons name={icon} size={28} color="#FFFFFF" />
      </View>
      <Text style={[styles.socialLabel, disabled && styles.socialLabelDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fullButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fullButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullButtonText: {
    flex: 1,
  },
  fullButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  fullButtonSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  shareOptions: {
    gap: 12,
    marginBottom: 24,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shareOptionDisabled: {
    opacity: 0.5,
  },
  shareOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  shareOptionLabelDisabled: {
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialButton: {
    alignItems: 'center',
    gap: 8,
    width: '22%',
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  socialLabelDisabled: {
    color: '#94A3B8',
  },
});

export default ShareReputationButton;
