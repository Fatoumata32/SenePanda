import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

type ModalType = 'warning' | 'danger' | 'success' | 'info';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  loading?: boolean;
  destructive?: boolean;
}

function ConfirmationModalComponent({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning',
  loading = false,
  destructive = false,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    if (loading) return;
    Haptics.notificationAsync(
      destructive
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    onConfirm();
  };

  const handleCancel = () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const getIcon = () => {
    const iconProps = { size: 32 };

    switch (type) {
      case 'danger':
        return <XCircle {...iconProps} color={Colors.error} />;
      case 'success':
        return <CheckCircle {...iconProps} color={Colors.success} />;
      case 'info':
        return <Info {...iconProps} color={Colors.info} />;
      case 'warning':
      default:
        return <AlertTriangle {...iconProps} color={Colors.warning} />;
    }
  };

  const getIconBackgroundColor = () => {
    switch (type) {
      case 'danger':
        return `${Colors.error}15`;
      case 'success':
        return `${Colors.success}15`;
      case 'info':
        return `${Colors.info}15`;
      case 'warning':
      default:
        return `${Colors.warning}15`;
    }
  };

  const getConfirmButtonColor = () => {
    if (destructive) return Colors.error;
    switch (type) {
      case 'danger':
        return Colors.error;
      case 'success':
        return Colors.success;
      case 'info':
        return Colors.info;
      default:
        return Colors.primaryOrange;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getIconBackgroundColor() },
            ]}
          >
            {getIcon()}
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
              accessible={true}
              accessibilityLabel={cancelText}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: getConfirmButtonColor() },
              ]}
              onPress={handleConfirm}
              disabled={loading}
              accessible={true}
              accessibilityLabel={confirmText}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: Colors.primaryOrange,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

export const ConfirmationModal = memo(ConfirmationModalComponent);
export default ConfirmationModal;
