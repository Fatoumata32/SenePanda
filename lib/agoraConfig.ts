// Configuration Agora pour le Live Shopping
// IMPORTANT : Remplacez ces valeurs par vos vraies clés Agora

// Détection de la disponibilité d'Agora
let AgoraEngine: any = null;
let isAgoraAvailable = false;

try {
  // Essayer d'importer Agora (fonctionne uniquement avec build natif)
  AgoraEngine = require('react-native-agora').default;
  isAgoraAvailable = true;
  console.log('✅ Agora SDK available');
} catch (e) {
  console.warn('⚠️ Agora SDK not available - Live streaming disabled in Expo Go');
  console.log('ℹ️ Build with EAS to enable live streaming: eas build --profile development');
}

export { AgoraEngine, isAgoraAvailable };

export const AGORA_APP_ID = 'c1a1a6f975c84c8fb781485a24933e9d'; // App ID Agora configuré
export const AGORA_APP_CERTIFICATE = 'YOUR_AGORA_APP_CERTIFICATE'; // À remplacer

// Pour obtenir un App ID gratuit :
// 1. Créer un compte sur https://console.agora.io/
// 2. Créer un projet
// 3. Copier l'App ID et le Certificate
// 4. Coller ici

// Token Generator (Backend)
// En production, générez les tokens côté serveur pour la sécurité
export const generateAgoraToken = async (
  channelName: string,
  uid: number,
  role: 'publisher' | 'subscriber'
): Promise<string> => {
  try {
    // En production, appelez votre backend
    // const response = await fetch('https://your-api.com/generate-token', {
    //   method: 'POST',
    //   body: JSON.stringify({ channelName, uid, role })
    // });
    // return response.json().token;

    // Pour le dev, retournez null (Agora accepte null en mode test)
    return '';
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return '';
  }
};

// Configuration des canaux
export const getLiveChannelName = (sessionId: string) => {
  return `live_${sessionId}`;
};

// Configuration vidéo
export const VIDEO_PROFILE = {
  width: 720,
  height: 1280, // Portrait mode pour mobile
  frameRate: 30,
  bitrate: 2000, // 2 Mbps
};

// Configuration audio
export const AUDIO_PROFILE = {
  sampleRate: 48000,
  channels: 2,
  bitrate: 128, // 128 kbps
};
