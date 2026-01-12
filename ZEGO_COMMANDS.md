#!/bin/bash

# 🚀 Commands pour ZegoCloud Backend Setup
# Usage: Copier/coller les commandes selon votre besoin

echo "=== ZegoCloud Backend Commands ==="
echo ""

# ============================================
# DÉVELOPPEMENT LOCAL
# ============================================
echo "📦 DÉVELOPPEMENT LOCAL"
echo ""
echo "1. Démarrer Supabase:"
echo "   cd C:\\Users\\PC\\Downloads\\project-bolt-sb1-qw6kprzq\\project"
echo "   supabase start"
echo ""
echo "2. Tester l'endpoint:"
echo "   node scripts/test-zego-token.js"
echo ""
echo "3. Lancer l'app:"
echo "   npm run dev"
echo ""
echo "4. Voir les logs:"
echo "   supabase functions logs zego-token"
echo ""

# ============================================
# PRODUCTION DEPLOYMENT
# ============================================
echo "🚀 PRODUCTION DEPLOYMENT"
echo ""
echo "1. Se connecter:"
echo "   supabase login"
echo ""
echo "2. Lier le projet:"
echo "   supabase link --project-ref inhzfdufjhuihtuykmwm"
echo ""
echo "3. Ajouter les secrets:"
echo "   supabase secrets set ZEGO_APP_ID=605198386"
echo "   supabase secrets set ZEGO_SERVER_SECRET=5f49247f9861b8c15d27053125ae5e360ff3300f3e03a2ce4945b1525a1b415e"
echo ""
echo "4. Vérifier les secrets:"
echo "   supabase secrets list"
echo ""
echo "5. Déployer:"
echo "   supabase functions deploy zego-token"
echo ""
echo "6. Tester en prod:"
echo "   node scripts/test-zego-token.js https://YOUR_PROJECT_ID.supabase.co/functions/v1"
echo ""

# ============================================
# BUILD ANDROID
# ============================================
echo "📦 BUILD ANDROID RELEASE"
echo ""
echo "1. Clean:"
echo "   cd android"
echo "   .\\gradlew clean"
echo ""
echo "2. Build release:"
echo "   .\\gradlew assembleRelease"
echo ""
echo "3. Vérifier l'APK:"
echo "   cd .."
echo "   ls android/app/build/outputs/apk/release/"
echo ""

# ============================================
# TROUBLESHOOTING
# ============================================
echo "🔧 TROUBLESHOOTING"
echo ""
echo "1. Si 'supabase' command not found:"
echo "   npm install -g supabase"
echo ""
echo "2. Si Supabase ne démarre pas:"
echo "   supabase stop"
echo "   supabase start"
echo ""
echo "3. Si le token n'est pas généré:"
echo "   supabase functions logs zego-token"
echo ""
echo "4. Si CORS error:"
echo "   Vérifier EXPO_PUBLIC_ZEGO_BACKEND_URL"
echo ""
echo "5. Si .env.local not found:"
echo "   Créer le fichier avec les secrets"
echo ""

# ============================================
# VARIABLES D'ENVIRONNEMENT
# ============================================
echo "📋 VARIABLES D'ENVIRONNEMENT"
echo ""
echo ".env (Dev - Public):"
echo "   EXPO_PUBLIC_ZEGO_BACKEND_URL=http://localhost:54321/functions/v1"
echo ""
echo ".env.local (Prod - Secrets):"
echo "   ZEGO_APP_ID=605198386"
echo "   ZEGO_SERVER_SECRET=5f49247f9861b8c15d27053125ae5e360ff3300f3e03a2ce4945b1525a1b415e"
echo "   EXPO_PUBLIC_ZEGO_BACKEND_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1"
echo ""

# ============================================
# SCRIPTS DISPONIBLES
# ============================================
echo "🔧 SCRIPTS DISPONIBLES"
echo ""
echo "1. Test endpoint:"
echo "   node scripts/test-zego-token.js [url] [userId] [roomId] [isHost]"
echo ""
echo "   Exemples:"
echo "   node scripts/test-zego-token.js"
echo "   node scripts/test-zego-token.js http://localhost:54321/functions/v1 user123 room1 true"
echo "   node scripts/test-zego-token.js https://project.supabase.co/functions/v1 user456 room2 false"
echo ""
echo "2. Deploy function:"
echo "   node scripts/deploy-zego-function.js"
echo ""

# ============================================
# ENDPOINTS
# ============================================
echo "🔗 ENDPOINTS"
echo ""
echo "Dev Local:"
echo "   POST http://localhost:54321/functions/v1/zego-token"
echo "   Body: {userId, roomId, isHost, expiresIn}"
echo ""
echo "Production:"
echo "   POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/zego-token"
echo "   Body: {userId, roomId, isHost, expiresIn}"
echo ""

# ============================================
# FICHIERS CLÉS
# ============================================
echo "📁 FICHIERS CLÉS"
echo ""
echo "Backend:"
echo "   supabase/functions/zego-token/index.ts"
echo ""
echo "Config:"
echo "   lib/zegoConfig.ts"
echo ""
echo "Components:"
echo "   components/zegocloud/zego-stream.tsx (HOST)"
echo "   components/zegocloud/zego-viewer.tsx (AUDIENCE)"
echo ""
echo "Environment:"
echo "   .env (dev URLs)"
echo "   .env.local (secrets)"
echo ""
echo "Documentation:"
echo "   ZEGO_QUICK_START.md"
echo "   ZEGO_TOKEN_BACKEND_DEPLOYMENT.md"
echo "   IMPLEMENTATION_SUMMARY.md"
echo ""

echo "=== ✅ Setup Complete ==="
