// Configuration Agora pour le Live Shopping
// ⚠️ DEPRECATED: Utiliser ZEGOCLOUD à la place (voir lib/zegoConfig.ts)

export const AGORA_APP_ID = 'c1a1a6f975c84c8fb781485a24933e9d'; // App ID Agora (legacy)
export const AGORA_APP_CERTIFICATE = 'ae54b69729dd48ebbd7b064acd5ec0de'; // Primary Certificate (legacy)

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
  const raw = String(sessionId || '');
  // Agora rejette certains caractères (ex: '-') selon SDK/config.
  // On garde seulement [A-Za-z0-9_] et on limite la longueur.
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '');
  const suffix = cleaned.length > 0 ? cleaned : 'unknown';
  return `live_${suffix}`.slice(0, 64);
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
