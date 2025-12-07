require('dotenv').config();

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
      backgroundColor: "#FEF7E6"
    },
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      icon: "./assets/images/icon.png",
      bundleIdentifier: "com.senepanda.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "SenePanda utilise votre localisation pour vous montrer les produits disponibles près de chez vous.",
        NSLocationAlwaysUsageDescription: "SenePanda utilise votre localisation pour améliorer votre expérience d'achat.",
        NSSpeechRecognitionUsageDescription: "Cette application utilise la reconnaissance vocale pour rechercher des produits.",
        NSMicrophoneUsageDescription: "Cette application utilise le microphone pour la recherche vocale."
      }
    },
    android: {
      package: "com.senepanda.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FEF7E6"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "android.permission.RECORD_AUDIO"
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
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};
