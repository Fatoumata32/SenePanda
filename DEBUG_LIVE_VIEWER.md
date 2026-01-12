# 🔍 Debug: Live Viewer Ne Fonctionne Pas

## ✅ Corrections Déjà Appliquées

1. ✅ API Agora mise à jour (v3 → v4)
2. ✅ Vérification App ID retirée
3. ✅ Event handlers avec `registerEventHandler`
4. ✅ Cleanup avec `unregisterEventHandler` + `release()`

## 🔬 Étapes de Diagnostic

### 1. Vérifier que l'app a bien rechargé le code

**Action**: Recharger complètement l'app
```bash
# Dans le terminal Expo
1. Appuyer sur 'r' pour recharger
   OU
2. Secouer l'appareil → "Reload"
   OU
3. Fermer l'app complètement et la réouvrir
```

### 2. Vérifier les logs dans le terminal

**Chercher ces messages**:
- ✅ `📡 Initialisation Agora Live Viewer avec App ID:` → Bon signe
- ❌ Erreurs TypeScript ou JavaScript → Problème de code
- ❌ `Cannot find module` → Problème d'import

### 3. Vérifier qu'un live existe dans la base de données

**Depuis l'app**:
1. Se connecter en tant que **vendeur** (profil)
2. Aller dans "Ma Boutique"
3. Cliquer "Démarrer un Live"
4. Créer une session live

**Vérifier dans Supabase**:
```sql
-- Voir tous les lives actifs
SELECT * FROM live_sessions
WHERE status = 'live'
ORDER BY created_at DESC
LIMIT 5;
```

### 4. Tester la navigation vers le live

**Depuis l'app (acheteur)**:
1. Aller dans l'onglet "Explorer" (🔍)
2. Scroller jusqu'à "🔴 Lives en cours"
3. Cliquer sur un live

**Ce qui devrait se passer**:
- ✅ Navigation vers `/live-viewer/[id]`
- ✅ Page de chargement brièvement
- ✅ Affichage "En attente du vendeur..." ou vidéo

**Si erreur "This screen doesn't exist"**:
- Problème de routing Expo Router
- Solution: Vérifier que `app/(tabs)/live-viewer/[id].tsx` existe

### 5. Vérifier les logs de la console

**Dans le terminal Expo, chercher**:
```
📡 Initialisation Agora Live Viewer avec App ID: c1a1a6f975c84c8fb781485a24933e9d
🎥 Configuration Agora Viewer...
📡 Rejoindre le canal: live_[session-id]
✅ Agora Viewer configuré avec succès
```

**Erreurs possibles**:

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Cannot find name 'createAgoraRtcEngine'` | Import manquant | Vérifier imports ligne 35-43 |
| `Property 'registerEventHandler' does not exist` | Mauvaise version Agora | Vérifier `package.json` |
| `Agora App ID non configuré` | App ID vide | Vérifier `lib/agoraConfig.ts` |
| Erreur 110 (Agora) | Broadcaster pas connecté | Normal, attendre que vendeur démarre |
| Erreur 17 (Agora) | Nom de canal invalide | Vérifier `getLiveChannelName()` |

### 6. Vérifier la version d'Agora SDK

**Commande**:
```bash
npm list react-native-agora
```

**Version requise**: `4.x.x` (pas 3.x.x)

**Si version 3.x.x**:
```bash
npm install react-native-agora@latest
npx expo prebuild --clean
```

### 7. Vérifier les permissions Android

**Dans** `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 8. Test manuel complet

**Étape par étape**:

1. **Créer un live (Vendeur)**:
   ```
   Profil → Ma Boutique → Démarrer un Live
   → Sélectionner produits → Créer
   ```

2. **Vérifier le statut**:
   ```sql
   SELECT id, status, seller_id
   FROM live_sessions
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - Status doit être `'scheduled'` ou `'live'`

3. **Rejoindre en tant qu'acheteur**:
   ```
   Explorer → Lives en cours → [Cliquer sur le live]
   ```

4. **Observer les logs**:
   ```
   ✅ Viewer rejoint le canal avec succès
   ⚠️ En attente du broadcaster... (normal si vendeur pas encore streamé)
   🎉 BROADCASTER DÉTECTÉ! (quand vendeur démarre)
   ```

## 🚨 Problèmes Courants et Solutions

### Problème 1: "This screen doesn't exist"

**Cause**: Route non trouvée par Expo Router

**Solutions**:
1. Vérifier que `app/(tabs)/live-viewer/[id].tsx` existe
2. Vérifier que `app/(tabs)/live-viewer/_layout.tsx` existe
3. Relancer Metro: `npx expo start --clear`

### Problème 2: Écran blanc sans erreur

**Cause**: Erreur JavaScript silencieuse

**Solutions**:
1. Ouvrir Chrome DevTools (pour web) ou React Native Debugger
2. Chercher les erreurs dans la console
3. Activer les warnings: Shake → Debug → Enable Warnings

### Problème 3: "Agora App ID non configuré"

**Cause**: App ID vide ou invalide

**Solutions**:
```typescript
// lib/agoraConfig.ts
export const AGORA_APP_ID = 'c1a1a6f975c84c8fb781485a24933e9d'; // ✅ Doit être une string non vide
```

### Problème 4: Vidéo ne s'affiche pas

**Causes possibles**:
1. Broadcaster (vendeur) n'a pas démarré le stream
2. UID du broadcaster incorrect
3. Problème de permissions caméra

**Debug**:
```typescript
// Dans les logs, chercher:
console.log('🎉 BROADCASTER DÉTECTÉ! UID:', uid);
console.log('📡 Broadcaster UID enregistré:', uid);
```

Si ces logs n'apparaissent pas → Le vendeur n'a pas démarré

### Problème 5: Metro Bundler ne recharge pas

**Solution**:
```bash
# Arrêter Metro (Ctrl+C)
# Nettoyer le cache
npx expo start --clear

# OU redémarrer complètement
rm -rf node_modules/.cache
npx expo start --clear
```

## 📝 Checklist de Vérification Rapide

- [ ] Metro Bundler en cours d'exécution
- [ ] App rechargée après modifications
- [ ] Fichier `app/(tabs)/live-viewer/[id].tsx` existe
- [ ] Agora App ID configuré dans `lib/agoraConfig.ts`
- [ ] Au moins 1 live session en base (status = 'live')
- [ ] Permissions caméra/micro accordées
- [ ] Pas d'erreurs TypeScript dans le terminal
- [ ] react-native-agora version 4.x.x

## 🔧 Commandes de Debug Utiles

```bash
# Voir la version d'Agora
npm list react-native-agora

# Nettoyer le cache Expo
npx expo start --clear

# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Voir les logs en temps réel
# (Déjà dans le terminal Metro)

# Rebuild complet (si nécessaire)
cd android && ./gradlew clean && cd ..
npx expo prebuild --clean
npx expo run:android
```

## 📞 Informations pour le Support

Si le problème persiste, fournir:
1. **Message d'erreur exact** (screenshot ou copie)
2. **Logs du terminal** Metro Bundler
3. **Version Agora SDK**: `npm list react-native-agora`
4. **Plateforme**: iOS / Android / Web
5. **Étapes pour reproduire**:
   - Quelle page vous êtes
   - Quel bouton vous avez cliqué
   - Ce qui s'est passé

## 🎯 Prochaines Étapes Suggérées

Si aucune des solutions ci-dessus ne fonctionne:

1. **Vérifier la configuration Agora**:
   - App ID valide sur https://console.agora.io/
   - Projet actif et non suspendu
   - Quota de minutes non dépassé

2. **Tester avec un exemple minimal**:
   ```typescript
   // Test simple dans une nouvelle page
   import { createAgoraRtcEngine } from 'react-native-agora';

   const engine = createAgoraRtcEngine();
   engine.initialize({ appId: 'c1a1a6f975c84c8fb781485a24933e9d' });
   console.log('✅ Agora Engine créé');
   ```

3. **Vérifier les dépendances**:
   ```bash
   npm install
   npx expo prebuild --clean
   ```

---

**Dernière mise à jour**: 31 Décembre 2025
**Fichiers concernés**:
- `app/(tabs)/live-viewer/[id].tsx`
- `lib/agoraConfig.ts`
- `hooks/useLiveShopping.ts`
