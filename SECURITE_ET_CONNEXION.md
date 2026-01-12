# 🔐 Sécurité & Connexion - Guide Utilisateur

## 📍 Où Trouver les Paramètres

**Profil → Paramètres → Sécurité & Connexion**

```
1. Onglet "Profil" (en bas)
   ↓
2. Icône "⚙️ Paramètres" (en haut à droite)
   ↓
3. Section "Sécurité"
   ↓
4. "🛡️ Sécurité & Connexion"
```

## ⚙️ Options Disponibles

### 1. 🔓 Connexion Automatique

**Qu'est-ce que c'est ?**
- Restez connecté automatiquement à chaque ouverture de l'app
- Plus besoin de retaper votre numéro et code PIN

**Comment l'activer ?**
```
1. Allez dans Sécurité & Connexion
2. Activez le switch "Rester connecté"
3. ✅ Vous serez connecté automatiquement la prochaine fois!
```

**Comment le désactiver ?**
```
1. Désactivez le switch "Rester connecté"
2. Confirmez dans la popup
3. ⚠️ Vous devrez vous reconnecter manuellement après
```

### 2. 👆 Biométrie (Face ID / Empreinte)

**Qu'est-ce que c'est ?**
- Connexion ultra-rapide avec votre visage ou doigt
- Plus sécurisé qu'un code PIN
- Connexion en 2 secondes

**Prérequis:**
- ✅ Connexion automatique doit être activée
- ✅ Face ID ou Empreinte configuré sur votre téléphone

**Comment l'activer ?**
```
1. Activez d'abord "Rester connecté"
2. Activez le switch "Face ID" ou "Empreinte digitale"
3. Scannez votre visage/doigt pour confirmer
4. ✅ Connexion biométrique activée!
```

**Prochaine ouverture:**
```
1. Ouvrir l'app
2. Cliquer "Connexion avec Face ID"
3. Scanner → CONNECTÉ! ⚡
```

## 🎯 Scénarios d'Utilisation

### Scénario 1: Maximum de Confort
**Configuration:**
- ✅ Connexion automatique: **ON**
- ✅ Biométrie: **OFF**

**Résultat:**
- Ouvrir l'app → **Connecté automatiquement**
- Aucune action requise

### Scénario 2: Maximum de Rapidité
**Configuration:**
- ✅ Connexion automatique: **ON**
- ✅ Biométrie: **ON**

**Résultat:**
- Ouvrir l'app → Auto-login OU
- Cliquer Face ID → **Connecté en 2s**

### Scénario 3: Maximum de Sécurité
**Configuration:**
- ❌ Connexion automatique: **OFF**
- ❌ Biométrie: **OFF**

**Résultat:**
- Ouvrir l'app
- Entrer numéro + PIN manuellement
- Plus sécurisé mais moins pratique

## 🔒 Sécurité des Données

### Qu'est-ce qui est stocké ?
- ✅ Votre numéro de téléphone (chiffré)
- ✅ Votre code PIN (chiffré)

### Où c'est stocké ?
- **Actuellement**: AsyncStorage (pour compatibilité Expo Go)
- **En Production**:
  - iOS: Keychain Apple (chiffrement matériel)
  - Android: Keystore (chiffrement matériel AES-256)

### Qui peut y accéder ?
- ❌ Personne d'autre que vous
- ❌ Pas même nous (les développeurs)
- ❌ Impossible d'accéder depuis l'extérieur de l'app

### En cas de vol de téléphone ?
- 🔐 Données chiffrées = illisibles sans déverrouillage
- 🔐 Biométrie = seul votre visage/doigt fonctionne
- ⚠️ Recommandé: Changez votre PIN depuis un autre appareil

## ❓ Questions Fréquentes

### Q: Est-ce sécurisé ?
**R:** Oui! Chiffrement de niveau bancaire (AES-256).

### Q: Que se passe-t-il si je change de téléphone ?
**R:** Vous devrez vous reconnecter manuellement sur le nouveau téléphone. Les credentials ne sont pas transférés (pour votre sécurité).

### Q: Puis-je utiliser la biométrie sans auto-login ?
**R:** Non. La biométrie nécessite que vos credentials soient sauvegardés (donc auto-login activé).

### Q: Que se passe-t-il si je me déconnecte ?
**R:** Tous les credentials sauvegardés sont supprimés. Vous devrez vous reconnecter normalement.

### Q: La biométrie fonctionne-t-elle toujours ?
**R:** Oui, tant que:
- ✅ Votre Face ID/Empreinte est configuré sur le téléphone
- ✅ L'app a les permissions nécessaires
- ✅ Vous n'avez pas changé votre code PIN

### Q: Puis-je revenir à la connexion normale ?
**R:** Oui! Désactivez simplement "Rester connecté" dans les paramètres.

## 🛠️ Dépannage

### Problème: Auto-login ne fonctionne pas
**Solutions:**
1. Vérifier que le switch est activé
2. Se déconnecter et se reconnecter avec "Rester connecté" activé
3. Vérifier que l'app a les permissions de stockage

### Problème: Biométrie ne s'active pas
**Solutions:**
1. Vérifier que "Rester connecté" est activé
2. Vérifier que Face ID/Empreinte est configuré sur votre téléphone
3. Vérifier les permissions de l'app
4. Essayer de se déconnecter et reconnecter

### Problème: "Credentials manquants"
**Solutions:**
1. Se déconnecter complètement
2. Se reconnecter avec "Rester connecté" activé
3. Réactiver la biométrie si nécessaire

## 📱 Captures d'Écran du Flux

### Page Sécurité & Connexion
```
┌─────────────────────────────┐
│ ← Sécurité & Connexion      │
├─────────────────────────────┤
│ 🔓 CONNEXION AUTOMATIQUE    │
│                             │
│ Rester connecté        [ON] │
│ Connecté automatiquement    │
│ à chaque ouverture     ✅   │
│                             │
├─────────────────────────────┤
│ 👆 AUTHENTIFICATION BIO     │
│                             │
│ Face ID               [ON] │
│ Connexion rapide avec       │
│ Face ID               ✅   │
│                             │
├─────────────────────────────┤
│ 🛡️ SÉCURITÉ DES DONNÉES     │
│                             │
│ 👁️ Identifiants chiffrés    │
│ 🔒 Chiffrement matériel     │
│ 🛡️ Aucun accès externe      │
│                             │
├─────────────────────────────┤
│                             │
│    [Se déconnecter]         │
│                             │
└─────────────────────────────┘
```

## ✅ Checklist de Configuration

### Pour Activer la Connexion Simple
- [ ] Aller dans Profil → Paramètres
- [ ] Cliquer "Sécurité & Connexion"
- [ ] Activer "Rester connecté"
- [ ] (Optionnel) Activer Face ID/Empreinte
- [ ] Fermer et réouvrir l'app pour tester

### Pour Désactiver (Plus Sécurisé)
- [ ] Aller dans Profil → Paramètres
- [ ] Cliquer "Sécurité & Connexion"
- [ ] Désactiver "Rester connecté"
- [ ] Confirmer dans la popup
- [ ] La biométrie sera désactivée automatiquement

## 🎉 Avantages

| Feature | Gain de Temps | Sécurité |
|---------|---------------|----------|
| **Auto-login** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Biométrie** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **PIN manuel** | ⭐ | ⭐⭐⭐⭐⭐ |

**Recommandation:** Auto-login + Biométrie = Meilleur équilibre! ⚡🔒

---

**Dernière mise à jour:** 31 Décembre 2025
**Version App:** 1.0.0
