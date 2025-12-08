# ===================================
# Script de Build Android - SenePanda
# ===================================

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  SenePanda - Build Android" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verification de EAS CLI
Write-Host "Verification de EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "EAS CLI n'est pas installe." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation de EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Echec de l'installation de EAS CLI" -ForegroundColor Red
        exit 1
    }

    Write-Host "EAS CLI installe avec succes !" -ForegroundColor Green
}
else {
    Write-Host "EAS CLI est deja installe" -ForegroundColor Green
}

Write-Host ""

# Verification TypeScript
Write-Host "Verification TypeScript..." -ForegroundColor Yellow
npm run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Erreurs TypeScript detectees !" -ForegroundColor Red
    Write-Host "Veuillez corriger les erreurs avant de continuer." -ForegroundColor Yellow
    Write-Host ""

    $continue = Read-Host "Voulez-vous continuer quand meme ? (o/N)"
    if ($continue -ne "o" -and $continue -ne "O") {
        Write-Host "Build annule." -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "Aucune erreur TypeScript" -ForegroundColor Green
}

Write-Host ""

# Nettoyage du cache
Write-Host "Nettoyage du cache..." -ForegroundColor Yellow

$cachePaths = @(
    "node_modules\.cache",
    ".expo"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  Supprime: $path" -ForegroundColor Gray
    }
}

Write-Host "Cache nettoye" -ForegroundColor Green
Write-Host ""

# Demander le type de build
Write-Host "Type de build :" -ForegroundColor Cyan
Write-Host "  1. Preview (developpement - APK)" -ForegroundColor White
Write-Host "  2. Production (release - APK)" -ForegroundColor White
Write-Host "  3. Preview Local (plus rapide)" -ForegroundColor White
Write-Host ""

$buildType = Read-Host "Choisissez le type de build (1/2/3)"

switch ($buildType) {
    "1" {
        $profile = "preview"
        $local = $false
        Write-Host ""
        Write-Host "Lancement du build PREVIEW dans le cloud..." -ForegroundColor Green
    }
    "2" {
        $profile = "production"
        $local = $false
        Write-Host ""
        Write-Host "Lancement du build PRODUCTION dans le cloud..." -ForegroundColor Green
    }
    "3" {
        $profile = "preview"
        $local = $true
        Write-Host ""
        Write-Host "Lancement du build PREVIEW en local..." -ForegroundColor Green
        Write-Host "Assurez-vous que Docker est installe et en cours d'execution." -ForegroundColor Yellow
    }
    default {
        Write-Host "Choix invalide. Build annule." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Le build peut prendre 10-20 minutes..." -ForegroundColor Yellow
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
    Write-Host "Le build a echoue !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Conseils de depannage :" -ForegroundColor Yellow
    Write-Host "  1. Verifiez que vous etes connecte : eas whoami" -ForegroundColor Gray
    Write-Host "  2. Verifiez vos variables d'environnement (.env)" -ForegroundColor Gray
    Write-Host "  3. Consultez le guide : GUIDE_GENERATION_APK.md" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Build termine avec succes !" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (-not $local) {
    Write-Host "L'APK sera bientot disponible sur :" -ForegroundColor Cyan
    Write-Host "   https://expo.dev/accounts/[votre-compte]/builds" -ForegroundColor White
    Write-Host ""
    Write-Host "Vous recevrez egalement un email avec le lien de telechargement." -ForegroundColor Cyan
}
else {
    Write-Host "L'APK a ete genere localement dans le dossier du projet." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Merci d'utiliser SenePanda !" -ForegroundColor Green
Write-Host ""
