// Charger les variables d'environnement depuis .env.local en priorité, puis .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Vérifier que les variables sont bien chargées
console.log('🔍 Vérification des variables d\'environnement:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Définie' : '❌ Manquante');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Manquante');

module.exports = {
  expo: {
    name: "SenePanda",
    slug: "senepanda",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FDB913"
    },
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      icon: "./assets/images/icon.png",
      bundleIdentifier: "com.senepanda.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: "SenePanda utilise votre localisation pour vous montrer les produits disponibles près de chez vous.",
        NSLocationAlwaysUsageDescription: "SenePanda utilise votre localisation pour améliorer votre expérience d'achat.",
        NSSpeechRecognitionUsageDescription: "Cette application utilise la reconnaissance vocale pour rechercher des produits.",
        NSMicrophoneUsageDescription: "Cette application utilise le microphone pour la recherche vocale et le Live Shopping.",
        NSCameraUsageDescription: "SenePanda a besoin d'accéder à votre caméra pour le Live Shopping et les photos de produits.",
        NSPhotoLibraryUsageDescription: "SenePanda a besoin d'accéder à vos photos pour ajouter des images de produits."
      }
    },
    android: {
      package: "com.senepanda.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FDB913"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.BLUETOOTH",
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.INTERNET",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "SenePanda utilise votre localisation pour vous montrer les produits et services près de chez vous."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "SenePanda a besoin d'accéder à votre caméra pour le Live Shopping et les photos de produits.",
          microphonePermission: "SenePanda a besoin d'accéder à votre microphone pour le Live Shopping.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-av",
        {
          microphonePermission: "SenePanda a besoin d'accéder à votre microphone pour le Live Shopping."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      eas: {
        projectId: "efb67d51-196a-420e-9f69-b9500e680ebc"
      }
    }
  }
};
