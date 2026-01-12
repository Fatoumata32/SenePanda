# 🔧 Configuration Production - SenePanda

## ⚠️ ÉTAPE CRITIQUE: À FAIRE AVANT LE BUILD

### 📝 Fichier à Modifier: `eas.json`

Ouvrir le fichier `eas.json` et remplacer les lignes 38-40:

**AVANT** (valeurs par défaut - ❌ NE FONCTIONNE PAS):
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://YOUR-PROJECT.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "YOUR-ANON-KEY-HERE"
}
```

**APRÈS** (vos vraies valeurs - ✅ FONCTIONNE):
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://VOTRE-VRAI-PROJET.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ..."
}
```

---

## 🔍 Comment Trouver Vos Valeurs Supabase

### Étape 1: Aller sur Supabase Dashboard

1. Ouvrir https://supabase.com/dashboard
2. Se connecter avec votre compte
3. Sélectionner le projet **SenePanda** (ou votre projet)

### Étape 2: Récupérer les Credentials

1. Dans le menu de gauche, cliquer sur **⚙️ Settings**
2. Cliquer sur **API**
3. Vous verrez deux sections importantes:

#### Section "Project URL"
```
Project URL
https://xyzabcdefg.supabase.co
```
**→ Copier cette URL complète**

#### Section "Project API keys"

Vous verrez plusieurs clés. **UTILISEZ UNIQUEMENT**:

```
anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6I...
```

**→ Copier cette clé (elle est longue, ~300 caractères)**

**❌ NE PAS utiliser**:
- `service_role secret` (clé secrète backend uniquement)

---

## ✏️ Exemple de Configuration Complète

Voici à quoi doit ressembler votre `eas.json` après modification:

```json
{
  "cli": {
    "version": ">= 7.8.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug",
        "buildType": "apk"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "image": "latest"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview-simple": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "withoutCredentials": true,
        "image": "latest"
      }
    },
    "production": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://xyzabcdefg.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5NzA0MTIwMCwiZXhwIjoyMDEyNjE3MjAwfQ.abcdefghijklmnopqrstuvwxyz1234567890"
      },
      "android": {
        "buildType": "apk",
        "image": "latest"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "production-aab": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**⚠️ IMPORTANT**: Remplacez:
- `https://xyzabcdefg.supabase.co` → Votre vraie URL Supabase
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Votre vraie clé anon

---

## 🔒 Sécurité

### ✅ Ces valeurs sont PUBLIQUES et SÛRES

Les variables `EXPO_PUBLIC_*` sont **conçues** pour être incluses dans l'APK. Elles sont publiques.

**La sécurité est assurée par**:
1. **Row Level Security (RLS)** dans Supabase
2. **Policies** qui limitent l'accès aux données
3. **Authentication** qui identifie les utilisateurs

### ❌ Ne PAS inclure dans l'APK

- `SUPABASE_SERVICE_ROLE_KEY` (clé secrète)
- Clés API privées (Stripe secret key, etc.)
- Mots de passe
- Secrets

---

## 🧪 Vérification

### Avant de Builder

Vérifier que votre configuration est correcte:

```bash
# Vérifier que les variables sont chargées
cat eas.json | grep -A 3 '"env"'
```

**Sortie attendue**:
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://xyzabcdefg.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Si vous voyez encore `YOUR-PROJECT` ou `YOUR-ANON-KEY-HERE` → ❌ **PAS BON, À MODIFIER**

---

## 🚀 Après Configuration

Une fois que vous avez modifié `eas.json` avec vos vraies valeurs:

```bash
# 1. Sauvegarder le fichier
# 2. Lancer le build
eas build --platform android --profile production --non-interactive
```

---

## 🎯 Checklist Rapide

- [ ] Ouvrir https://supabase.com/dashboard
- [ ] Aller dans Settings → API
- [ ] Copier "Project URL"
- [ ] Copier "anon public" key
- [ ] Ouvrir `eas.json` dans votre éditeur
- [ ] Remplacer ligne 39: `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Remplacer ligne 40: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Sauvegarder
- [ ] Vérifier que les valeurs ne contiennent plus "YOUR-"
- [ ] Builder: `eas build --platform android --profile production`

---

## 📸 Screenshots de Supabase Dashboard

### Où trouver Project URL:
```
Settings → API → Configuration → Project URL
┌────────────────────────────────────────┐
│ Project URL                            │
│ https://xyzabcdefg.supabase.co        │
│ [Copy]                                 │
└────────────────────────────────────────┘
```

### Où trouver anon public:
```
Settings → API → Project API keys → anon public
┌────────────────────────────────────────┐
│ anon                                   │
│ public                                 │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│
│ [Copy]                                 │
└────────────────────────────────────────┘
```

---

## ❓ FAQ

### Q: Dois-je créer un fichier `.env.production` ?
**R**: Non, avec cette configuration dans `eas.json`, c'est suffisant. Le fichier `.env.production` est optionnel.

### Q: Que faire si je n'ai pas encore de projet Supabase ?
**R**:
1. Créer un compte sur https://supabase.com
2. Créer un nouveau projet (prend ~2 minutes)
3. Exécuter les migrations SQL (dans `supabase/migrations/`)
4. Récupérer les credentials comme indiqué ci-dessus

### Q: Puis-je utiliser les mêmes credentials pour dev et prod ?
**R**: Oui, mais il est recommandé d'avoir deux projets Supabase séparés:
- Un pour le développement/test
- Un pour la production

### Q: Comment savoir si mes credentials fonctionnent ?
**R**: Testez dans le navigateur:
```
https://VOTRE-URL.supabase.co/rest/v1/
```
Si vous voyez une réponse JSON → ✅ C'est bon!

---

**Date de création**: 2026-01-05
**Fichier à modifier**: `eas.json`
**Lignes à modifier**: 38-40
