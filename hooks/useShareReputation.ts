import { useState } from 'react';
import { Share, Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { ReputationData } from '@/components/SellerReputationBadge';

interface ShareOptions {
  includeImage?: boolean;
  customMessage?: string;
}

/**
 * Hook pour partager le badge de réputation d'un vendeur
 */
export function useShareReputation() {
  const [isSharing, setIsSharing] = useState(false);

  /**
   * Partage le badge de réputation avec texte uniquement
   */
  const shareText = async (
    reputation: ReputationData,
    shopName?: string,
    options?: ShareOptions
  ) => {
    try {
      setIsSharing(true);

      const message = options?.customMessage || generateShareMessage(reputation, shopName);
      const url = 'https://senepanda.com'; // À remplacer par votre URL

      const result = await Share.share(
        {
          message: Platform.OS === 'ios' ? message : `${message}\n\n${url}`,
          url: Platform.OS === 'ios' ? url : undefined,
          title: 'Ma réputation vendeur SenePanda',
        },
        {
          dialogTitle: 'Partager ma réputation',
          subject: 'Ma réputation vendeur SenePanda',
        }
      );

      if (result.action === Share.sharedAction) {
        return { success: true, shared: true };
      } else if (result.action === Share.dismissedAction) {
        return { success: true, shared: false };
      }

      return { success: true, shared: false };
    } catch (error) {
      console.error('Error sharing reputation:', error);
      Alert.alert('Erreur', 'Impossible de partager pour le moment');
      return { success: false, shared: false };
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Partage le badge de réputation avec une image
   */
  const shareImage = async (
    viewRef: any,
    reputation: ReputationData,
    shopName?: string,
    options?: ShareOptions
  ) => {
    try {
      setIsSharing(true);

      if (!viewRef || !viewRef.current) {
        throw new Error('View reference is null');
      }

      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        // Fallback sur le partage texte
        return await shareText(reputation, shopName, options);
      }

      // Capturer la vue en image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // Créer un nom de fichier unique
      const filename = `senepanda-reputation-${Date.now()}.png`;
      const newUri = `${FileSystem.cacheDirectory}${filename}`;

      // Copier le fichier dans le cache
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      // Partager l'image
      await Sharing.shareAsync(newUri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager ma réputation',
        UTI: 'public.png',
      });

      // Nettoyer le fichier temporaire
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(newUri, { idempotent: true });
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }
      }, 5000);

      return { success: true, shared: true };
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert(
        'Erreur',
        'Impossible de partager l\'image. Voulez-vous partager par texte ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Partager par texte',
            onPress: () => shareText(reputation, shopName, options),
          },
        ]
      );
      return { success: false, shared: false };
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Partage sur les réseaux sociaux
   */
  const shareToSocial = async (
    platform: 'facebook' | 'twitter' | 'whatsapp' | 'instagram',
    reputation: ReputationData,
    shopName?: string
  ) => {
    try {
      setIsSharing(true);

      const message = generateShareMessage(reputation, shopName);
      const url = 'https://senepanda.com';

      let shareUrl = '';

      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
          break;

        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
          break;

        case 'whatsapp':
          shareUrl = `whatsapp://send?text=${encodeURIComponent(`${message}\n\n${url}`)}`;
          break;

        case 'instagram':
          // Instagram ne supporte pas le partage direct de liens
          Alert.alert(
            'Instagram',
            'Copiez le message et partagez-le sur Instagram',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Copier',
                onPress: async () => {
                  const { default: Clipboard } = await import('expo-clipboard');
                  await Clipboard.setStringAsync(message);
                  Alert.alert('✓ Copié!', 'Message copié dans le presse-papiers');
                },
              },
            ]
          );
          return { success: true, shared: false };
      }

      // Ouvrir l'URL de partage
      const { Linking } = await import('react-native');
      const supported = await Linking.canOpenURL(shareUrl);

      if (supported) {
        await Linking.openURL(shareUrl);
        return { success: true, shared: true };
      } else {
        // Fallback sur le partage natif
        return await shareText(reputation, shopName);
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      Alert.alert('Erreur', `Impossible d'ouvrir ${platform}`);
      return { success: false, shared: false };
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Copie le message de réputation dans le presse-papiers
   */
  const copyToClipboard = async (reputation: ReputationData, shopName?: string) => {
    try {
      const message = generateShareMessage(reputation, shopName);
      const { default: Clipboard } = await import('expo-clipboard');
      await Clipboard.setStringAsync(message);
      Alert.alert('✓ Copié!', 'Message copié dans le presse-papiers');
      return { success: true };
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Erreur', 'Impossible de copier le texte');
      return { success: false };
    }
  };

  return {
    shareText,
    shareImage,
    shareToSocial,
    copyToClipboard,
    isSharing,
  };
}

/**
 * Génère un message de partage personnalisé basé sur la réputation
 */
function generateShareMessage(reputation: ReputationData, shopName?: string): string {
  const levelEmojis = {
    nouveau: '🌱',
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
    diamond: '💠',
  };

  const levelNames = {
    nouveau: 'Nouveau',
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    platinum: 'Platine',
    diamond: 'Diamant',
  };

  const emoji = levelEmojis[reputation.level];
  const levelName = levelNames[reputation.level];
  const stars = '⭐'.repeat(Math.floor(reputation.averageRating));

  let message = `${emoji} Badge ${levelName} sur SenePanda!\n\n`;

  if (shopName) {
    message += `🏪 ${shopName}\n`;
  }

  message += `${stars} ${reputation.averageRating.toFixed(1)}/5\n`;
  message += `💬 ${reputation.totalReviews} avis client${reputation.totalReviews > 1 ? 's' : ''}\n`;
  message += `🎯 Score: ${reputation.score}/100\n\n`;

  // Message personnalisé selon le niveau
  if (reputation.level === 'diamond') {
    message += '🏆 Excellence absolue! Vendeur d\'élite certifié.';
  } else if (reputation.level === 'platinum') {
    message += '⭐ Vendeur d\'élite reconnu pour son excellence.';
  } else if (reputation.level === 'gold') {
    message += '✨ Vendeur de confiance avec une qualité exceptionnelle.';
  } else if (reputation.level === 'silver') {
    message += '👍 Bon vendeur apprécié par ses clients.';
  } else if (reputation.level === 'bronze') {
    message += '🎯 Vendeur fiable en progression.';
  } else {
    message += '🌟 Nouveau vendeur motivé!';
  }

  message += '\n\n#SenePanda #VendeurDeConfiance';

  return message;
}

/**
 * Génère des statistiques de partage formatées
 */
export function generateShareStats(reputation: ReputationData): string {
  return `
📊 Mes statistiques de vendeur:

⭐ Note: ${reputation.averageRating.toFixed(1)}/5
💬 Avis: ${reputation.totalReviews}
👍 Votes utiles: ${reputation.totalVotes}
🎯 Score global: ${reputation.score}/100
🏅 Niveau: ${reputation.level.toUpperCase()}

${reputation.nextLevelScore ? `🎯 Prochain objectif: ${reputation.nextLevelScore} points` : '🏆 Niveau maximum atteint!'}
  `.trim();
}
