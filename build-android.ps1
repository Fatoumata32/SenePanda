# ===================================
# Script de Build Android - SenePanda
# ===================================

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  SenePanda - Build Android" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si EAS CLI est installé
Write-Host "🔍 Vérification de EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "❌ EAS CLI n'est pas installé." -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Installation de EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de l'installation de EAS CLI" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ EAS CLI installé avec succès !" -ForegroundColor Green
}
else {
    Write-Host "✅ EAS CLI est déjà installé" -ForegroundColor Green
}

Write-Host ""

# Vérifier TypeScript
Write-Host "📝 Vérification TypeScript..." -ForegroundColor Yellow
npm run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erreurs TypeScript détectées !" -ForegroundColor Red
    Write-Host "Veuillez corriger les erreurs avant de continuer." -ForegroundColor Yellow
    Write-Host ""

    $continue = Read-Host "Voulez-vous continuer quand même ? (o/N)"
    if ($continue -ne "o" -and $continue -ne "O") {
        Write-Host "Build annulé." -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "✅ Aucune erreur TypeScript" -ForegroundColor Green
}

Write-Host ""

# Nettoyer le cache
Write-Host "🧹 Nettoyage du cache..." -ForegroundColor Yellow

$cachePaths = @(
    "node_modules\.cache",
    ".expo"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  ✓ Supprimé: $path" -ForegroundColor Gray
    }
}

Write-Host "✅ Cache nettoyé" -ForegroundColor Green
Write-Host ""

# Demander le type de build
Write-Host "📦 Type de build :" -ForegroundColor Cyan
Write-Host "  1. Preview (développement - APK)" -ForegroundColor White
Write-Host "  2. Production (release - APK)" -ForegroundColor White
Write-Host "  3. Preview Local (plus rapide)" -ForegroundColor White
Write-Host ""

$buildType = Read-Host "Choisissez le type de build (1/2/3)"

switch ($buildType) {
    "1" {
        $profile = "preview"
        $local = $false
        Write-Host ""
        Write-Host "🚀 Lancement du build PREVIEW dans le cloud..." -ForegroundColor Green
    }
    "2" {
        $profile = "production"
        $local = $false
        Write-Host ""
        Write-Host "🚀 Lancement du build PRODUCTION dans le cloud..." -ForegroundColor Green
    }
    "3" {
        $profile = "preview"
        $local = $true
        Write-Host ""
        Write-Host "🚀 Lancement du build PREVIEW en local..." -ForegroundColor Green
        Write-Host "⚠️  Assurez-vous que Docker est installé et en cours d'exécution." -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Choix invalide. Build annulé." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "⏳ Le build peut prendre 10-20 minutes..." -ForegroundColor Yellow
Write-Host ""

# Lancer le build
if ($local) {
    eas build --platform android --profile $profile --local
}
else {
    eas build --platform android --profile $profile
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Le build a échoué !" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Conseils de dépannage :" -ForegroundColor Yellow
    Write-Host "  1. Vérifiez que vous êtes connecté : eas whoami" -ForegroundColor Gray
    Write-Host "  2. Vérifiez vos variables d'environnement (.env)" -ForegroundColor Gray
    Write-Host "  3. Consultez le guide : GUIDE_GENERATION_APK.md" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  ✅ Build terminé avec succès !" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (-not $local) {
    Write-Host "📱 L'APK sera bientôt disponible sur :" -ForegroundColor Cyan
    Write-Host "   https://expo.dev/accounts/[votre-compte]/builds" -ForegroundColor White
    Write-Host ""
    Write-Host "📧 Vous recevrez également un email avec le lien de téléchargement." -ForegroundColor Cyan
}
else {
    Write-Host "📱 L'APK a été généré localement dans le dossier du projet." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 Merci d'utiliser SenePanda !" -ForegroundColor Green
Write-Host ""
