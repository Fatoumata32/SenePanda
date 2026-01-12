/**
 * Service de guidage vocal amélioré
 * Fournit des annonces vocales claires et naturelles pour guider les utilisateurs
 */

import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_SETTINGS_KEY = 'voice_guide_settings';

export interface VoiceSettings {
  enabled: boolean;
  rate: number; // 0.5 - 2.0 (vitesse)
  pitch: number; // 0.5 - 2.0 (hauteur de voix)
  language: string; // 'fr-FR', 'wo-SN' (wolof)
  volume: number; // 0.0 - 1.0
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  rate: 0.85, // Un peu plus lent pour meilleure compréhension
  pitch: 1.0, // Ton naturel
  language: 'fr-FR',
  volume: 1.0,
};

/**
 * Récupérer les paramètres vocaux
 */
export async function getVoiceSettings(): Promise<VoiceSettings> {
  try {
    const stored = await AsyncStorage.getItem(VOICE_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Erreur récupération paramètres vocaux:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Sauvegarder les paramètres vocaux
 */
export async function saveVoiceSettings(settings: Partial<VoiceSettings>): Promise<void> {
  try {
    const current = await getVoiceSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Erreur sauvegarde paramètres vocaux:', error);
  }
}

/**
 * Activer/Désactiver le guidage vocal
 */
export async function toggleVoiceGuide(enabled: boolean): Promise<void> {
  await saveVoiceSettings({ enabled });
  if (enabled) {
    speak('Guidage vocal activé', { rate: 1.0 });
  }
}

/**
 * Parler avec les paramètres configurés
 */
export async function speak(
  text: string,
  options?: Partial<Speech.SpeechOptions>
): Promise<void> {
  try {
    const settings = await getVoiceSettings();

    if (!settings.enabled) {
      return;
    }

    // Arrêter toute annonce en cours
    await Speech.stop();

    // Configuration optimale pour la voix
    const speechOptions: Speech.SpeechOptions = {
      language: settings.language,
      rate: options?.rate ?? settings.rate,
      pitch: options?.pitch ?? settings.pitch,
      volume: options?.volume ?? settings.volume,
      // Utiliser une voix de qualité si disponible
      voice: options?.voice,
      onDone: options?.onDone,
      onError: (error) => {
        console.error('Erreur speech:', error);
        options?.onError?.(error);
      },
    };

    await Speech.speak(text, speechOptions);
  } catch (error) {
    console.error('Erreur speak:', error);
  }
}

/**
 * Arrêter toute annonce vocale
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Erreur stop speech:', error);
  }
}

/**
 * Vérifier si le système est en train de parler
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    return false;
  }
}

// ============================================
// MESSAGES PRÉDÉFINIS PAR CONTEXTE
// ============================================

export const VoiceMessages = {
  // Authentification
  auth: {
    welcome: 'Bienvenue sur Sénépanda! La marketplace sénégalaise qui connecte acheteurs et vendeurs.',
    signInSuccess: 'Connexion réussie! Bienvenue dans votre espace.',
    signUpSuccess: 'Compte créé avec succès! Vous faites maintenant partie de la communauté Sénépanda.',
    signOut: 'Déconnexion réussie. À bientôt!',
    invalidCredentials: 'Identifiants incorrects. Veuillez vérifier votre numéro et votre code PIN.',
    phoneInvalid: 'Le numéro de téléphone saisi n\'est pas valide. Format attendu: plus deux deux un, suivi de neuf chiffres.',
  },

  // Navigation
  navigation: {
    home: 'Vous êtes sur la page d\'accueil',
    explore: 'Explorez les produits et boutiques',
    cart: 'Votre panier d\'achats',
    profile: 'Votre profil',
    search: 'Recherchez vos produits préférés',
  },

  // Actions produits
  products: {
    addedToCart: (name: string) => `${name} ajouté au panier`,
    removedFromCart: (name: string) => `${name} retiré du panier`,
    liked: (name: string) => `${name} ajouté aux favoris`,
    unliked: (name: string) => `${name} retiré des favoris`,
    outOfStock: 'Désolé, ce produit est en rupture de stock',
    priceUpdated: (price: number) => `Prix mis à jour: ${price} francs CFA`,
  },

  // Commandes
  orders: {
    placed: 'Commande passée avec succès! Vous recevrez une notification lors de la préparation.',
    confirmed: 'Votre commande a été confirmée par le vendeur',
    shipped: 'Votre commande est en cours de livraison',
    delivered: 'Commande livrée! Merci de votre confiance.',
    cancelled: 'Commande annulée',
  },

  // Live shopping
  live: {
    started: 'Le live shopping a démarré! Profitez des offres en direct.',
    ended: 'Le live est terminé. Merci de votre participation!',
    joined: (viewers: number) => `Vous avez rejoint le live. ${viewers} spectateurs connectés.`,
    productAdded: 'Nouveau produit disponible dans le live!',
    priceReduced: (reduction: number) => `Prix réduit de ${reduction} pour cent! Profitez-en maintenant!`,
  },

  // Paiement
  payment: {
    processing: 'Traitement du paiement en cours...',
    success: 'Paiement effectué avec succès!',
    failed: 'Le paiement a échoué. Veuillez réessayer.',
    pending: 'Paiement en attente de confirmation',
  },

  // Erreurs
  errors: {
    network: 'Problème de connexion internet. Veuillez vérifier votre réseau.',
    general: 'Une erreur s\'est produite. Veuillez réessayer.',
    notFound: 'Élément non trouvé',
    unauthorized: 'Vous devez vous connecter pour accéder à cette fonctionnalité',
  },

  // Succès généraux
  success: {
    saved: 'Modifications enregistrées avec succès',
    deleted: 'Suppression effectuée',
    updated: 'Mise à jour réussie',
    copied: 'Copié dans le presse-papier',
  },

  // Guidage
  guide: {
    swipeRight: 'Balayez vers la droite pour voir plus d\'options',
    swipeLeft: 'Balayez vers la gauche pour revenir',
    doubleTap: 'Appuyez deux fois pour aimer',
    longPress: 'Maintenez appuyé pour plus d\'actions',
    pullToRefresh: 'Tirez vers le bas pour actualiser',
  },
};

// ============================================
// FONCTIONS PRATIQUES
// ============================================

/**
 * Annoncer une navigation
 */
export async function announceNavigation(screen: keyof typeof VoiceMessages.navigation) {
  await speak(VoiceMessages.navigation[screen]);
}

/**
 * Annoncer une action sur un produit
 */
export async function announceProductAction(
  action: keyof typeof VoiceMessages.products,
  productName?: string,
  value?: number
) {
  const message = VoiceMessages.products[action];
  if (typeof message === 'function') {
    await speak(message(productName || value!));
  } else {
    await speak(message);
  }
}

/**
 * Annoncer une erreur
 */
export async function announceError(type: keyof typeof VoiceMessages.errors) {
  await speak(VoiceMessages.errors[type], { rate: 0.8, pitch: 0.95 });
}

/**
 * Annoncer un succès
 */
export async function announceSuccess(type: keyof typeof VoiceMessages.success) {
  await speak(VoiceMessages.success[type], { rate: 1.0, pitch: 1.1 });
}

/**
 * Lire un nombre de manière naturelle
 */
export function formatNumberForSpeech(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (remainder === 0) return `${thousands} mille`;
    return `${thousands} mille ${remainder}`;
  }
  const millions = Math.floor(num / 1000000);
  const remainder = num % 1000000;
  if (remainder === 0) return `${millions} million${millions > 1 ? 's' : ''}`;
  return `${millions} million${millions > 1 ? 's' : ''} ${formatNumberForSpeech(remainder)}`;
}

/**
 * Annoncer un prix
 */
export async function announcePrice(price: number) {
  const priceText = `${formatNumberForSpeech(price)} francs CFA`;
  await speak(priceText);
}

/**
 * Lire une notification
 */
export async function readNotification(title: string, body: string) {
  await speak(`Notification: ${title}. ${body}`, { rate: 0.85 });
}

/**
 * Guidage pour nouvelle fonctionnalité
 */
export async function announceFeature(featureName: string, description: string) {
  await speak(
    `Découvrez ${featureName}. ${description}`,
    { rate: 0.8, pitch: 1.05 }
  );
}

/**
 * Confirmation d'action
 */
export async function confirmAction(action: string) {
  await speak(`${action} effectué`, { rate: 1.1 });
}

/**
 * Obtenir les voix disponibles sur l'appareil
 */
export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    // Filtrer les voix françaises et wolof
    return voices.filter(v =>
      v.language.startsWith('fr') || v.language.startsWith('wo')
    );
  } catch (error) {
    console.error('Erreur récupération voix:', error);
    return [];
  }
}

export default {
  speak,
  stopSpeaking,
  isSpeaking,
  getVoiceSettings,
  saveVoiceSettings,
  toggleVoiceGuide,
  announceNavigation,
  announceProductAction,
  announceError,
  announceSuccess,
  announcePrice,
  readNotification,
  announceFeature,
  confirmAction,
  getAvailableVoices,
  VoiceMessages,
};
