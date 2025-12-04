/**
 * Service d'intégration Wave Money
 * Documentation: https://developer.wave.com/docs
 */

import axios from 'axios';

// Configuration Wave
const WAVE_API_URL = process.env.EXPO_PUBLIC_WAVE_API_URL || 'https://api.wave.com/v1';
const WAVE_API_KEY = process.env.EXPO_PUBLIC_WAVE_API_KEY || '';
const WAVE_SECRET_KEY = process.env.EXPO_PUBLIC_WAVE_SECRET_KEY || '';

export interface WavePaymentRequest {
  amount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface WavePaymentResponse {
  success: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  reference?: string;
  status?: 'pending' | 'success' | 'failed';
  message?: string;
  error?: string;
}

export interface WaveWebhookPayload {
  id: string;
  type: 'payment.succeeded' | 'payment.failed' | 'payment.cancelled';
  data: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reference: string;
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Créer un client Wave configuré
 */
const waveClient = axios.create({
  baseURL: WAVE_API_URL,
  headers: {
    'Authorization': `Bearer ${WAVE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initier un paiement Wave
 */
export async function initiateWavePayment(
  request: WavePaymentRequest
): Promise<WavePaymentResponse> {
  try {
    // Validation
    if (!request.amount || request.amount <= 0) {
      return {
        success: false,
        error: 'Montant invalide',
      };
    }

    if (!request.customerPhone) {
      return {
        success: false,
        error: 'Numéro de téléphone requis',
      };
    }

    // Format du numéro Wave (Sénégal: +221...)
    const formattedPhone = formatPhoneNumber(request.customerPhone);

    // Créer la transaction Wave
    const response = await waveClient.post('/checkout/sessions', {
      amount: Math.round(request.amount), // Wave accepte les montants en centimes
      currency: request.currency || 'XOF',
      error_url: `${process.env.EXPO_PUBLIC_APP_URL}/payment/error`,
      success_url: `${process.env.EXPO_PUBLIC_APP_URL}/payment/success`,
      customer: {
        name: request.customerName,
        phone_number: formattedPhone,
        email: request.customerEmail,
      },
      metadata: {
        order_id: request.orderId,
        ...request.metadata,
      },
      description: request.description || `Commande #${request.orderId}`,
    });

    const data = response.data;

    return {
      success: true,
      transactionId: data.id,
      checkoutUrl: data.wave_launch_url,
      reference: data.id,
      status: 'pending',
      message: 'Paiement initié avec succès',
    };
  } catch (error: any) {
    console.error('Erreur Wave Payment:', error);

    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de l\'initialisation du paiement',
    };
  }
}

/**
 * Vérifier le statut d'un paiement Wave
 */
export async function checkWavePaymentStatus(
  transactionId: string
): Promise<WavePaymentResponse> {
  try {
    const response = await waveClient.get(`/checkout/sessions/${transactionId}`);
    const data = response.data;

    return {
      success: true,
      transactionId: data.id,
      reference: data.id,
      status: mapWaveStatus(data.status),
      message: `Statut: ${data.status}`,
    };
  } catch (error: any) {
    console.error('Erreur vérification Wave:', error);

    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la vérification du paiement',
    };
  }
}

/**
 * Vérifier la signature du webhook Wave
 */
export function verifyWaveWebhook(
  signature: string,
  payload: string
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', WAVE_SECRET_KEY)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Erreur vérification signature:', error);
    return false;
  }
}

/**
 * Traiter un webhook Wave
 */
export async function processWaveWebhook(
  payload: WaveWebhookPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const { type, data } = payload;

    // Log pour debugging
    console.log('📥 Webhook Wave reçu:', { type, transactionId: data.id });

    switch (type) {
      case 'payment.succeeded':
        // Paiement réussi
        return {
          success: true,
          message: 'Paiement confirmé',
        };

      case 'payment.failed':
        // Paiement échoué
        return {
          success: false,
          message: 'Paiement échoué',
        };

      case 'payment.cancelled':
        // Paiement annulé
        return {
          success: false,
          message: 'Paiement annulé',
        };

      default:
        return {
          success: false,
          message: `Type d'événement non géré: ${type}`,
        };
    }
  } catch (error: any) {
    console.error('Erreur traitement webhook:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors du traitement du webhook',
    };
  }
}

/**
 * Formater le numéro de téléphone pour Wave
 * Format attendu: +221XXXXXXXXX (Sénégal)
 */
function formatPhoneNumber(phone: string): string {
  // Retirer tous les espaces et caractères spéciaux
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Ajouter le code pays si absent
  if (!cleaned.startsWith('+')) {
    if (!cleaned.startsWith('221')) {
      cleaned = '+221' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Mapper le statut Wave vers notre statut interne
 */
function mapWaveStatus(waveStatus: string): 'pending' | 'success' | 'failed' {
  switch (waveStatus.toLowerCase()) {
    case 'complete':
    case 'succeeded':
      return 'success';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'failed';
    default:
      return 'pending';
  }
}

/**
 * Annuler un paiement Wave
 */
export async function cancelWavePayment(
  transactionId: string
): Promise<WavePaymentResponse> {
  try {
    const response = await waveClient.post(`/checkout/sessions/${transactionId}/cancel`);

    return {
      success: true,
      transactionId,
      status: 'failed',
      message: 'Paiement annulé avec succès',
    };
  } catch (error: any) {
    console.error('Erreur annulation Wave:', error);

    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de l\'annulation du paiement',
    };
  }
}

/**
 * Obtenir les méthodes de paiement disponibles
 */
export function getWavePaymentMethods() {
  return [
    {
      id: 'wave',
      name: 'Wave',
      description: 'Paiement mobile money avec Wave',
      logo: '💳',
      currencies: ['XOF', 'FCFA'],
      countries: ['SN', 'CI', 'BF', 'ML'],
    },
  ];
}

/**
 * Valider les credentials Wave
 */
export function validateWaveCredentials(): boolean {
  return !!(WAVE_API_KEY && WAVE_SECRET_KEY);
}
