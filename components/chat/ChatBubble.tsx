import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Check, CheckCheck, Clock } from 'lucide-react-native';

export interface ChatMessage {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  delivered: boolean;
  image_url?: string;
  product_id?: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  onImagePress?: (url: string) => void;
  onProductPress?: (productId: string) => void;
}

export function ChatBubble({
  message,
  isOwnMessage,
  showAvatar = false,
  avatarUrl,
  onImagePress,
  onProductPress,
}: ChatBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatus = () => {
    if (!isOwnMessage) return null;

    if (message.read) {
      return <CheckCheck size={14} color={Colors.primaryOrange} />;
    } else if (message.delivered) {
      return <CheckCheck size={14} color={Colors.textMuted} />;
    } else {
      return <Check size={14} color={Colors.textMuted} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {!isOwnMessage && showAvatar && (
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>?</Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        {message.image_url && (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.image_url!)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: message.image_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {message.product_id && (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => onProductPress?.(message.product_id!)}
            activeOpacity={0.8}
          >
            <Text style={styles.productCardText}>📦 Produit partagé</Text>
          </TouchableOpacity>
        )}

        <Text
          style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {message.text}
        </Text>

        <View style={styles.footer}>
          <Text
            style={[
              styles.time,
              isOwnMessage ? styles.ownTime : styles.otherTime,
            ]}
          >
            {formatTime(message.created_at)}
          </Text>
          {renderStatus()}
        </View>
      </View>

      {isOwnMessage && showAvatar && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  spacer: {
    width: 40,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: Colors.primaryOrange,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.white,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  productCardText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontSize: 11,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTime: {
    color: Colors.textMuted,
  },
});

export default ChatBubble;
