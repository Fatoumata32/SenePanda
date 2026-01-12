// Configuration intelligente pour Live Streaming
// ✅ Utilise ZEGOCLOUD pour tous les environnements

import Constants from 'expo-constants';

// Détecte si on est en Expo Go ou en build natif
export const isExpoGo = Constants.appOwnership === 'expo';
export const isNativeBuild = !isExpoGo;

// Type de provider à utiliser
export type LiveProvider = 'agora' | 'zegocloud';

export const getCurrentProvider = (): LiveProvider => {
  // ✅ ZEGOCLOUD maintenant utilisé pour tous les environnements
  return 'zegocloud';
};

export const getLiveProviderName = () => {
  const provider = getCurrentProvider();
  return provider === 'agora' ? 'Agora (Legacy)' : 'ZEGOCLOUD';
};

// ⚠️ Configuration Agora (LEGACY - Ne plus utiliser)
export const AGORA_APP_ID = 'c1a1a6f975c84c8fb781485a24933e9d';

// ✅ Configuration ZEGOCLOUD (NOUVEAU PROVIDER)
export const ZEGO_APP_ID = 605198386;
export const ZEGO_APP_SIGN = '5f49247f9861b8c15d27053125ae5e360ff3300f3e03a2ce4945b1525a1b415e';

export const getLiveRoomID = (sessionId: string) => {
  return `senepanda_live_${sessionId}`;
};

export const getAgoraChannelName = (sessionId: string) => {
  const raw = String(sessionId || '');
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '');
  const suffix = cleaned.length > 0 ? cleaned : 'unknown';
  return `live_${suffix}`.slice(0, 64);
};
