# Guide Admin - Réinitialisation des Mots de Passe

## Réinitialiser tous les comptes à PIN: 1234

### 🎯 Objectif
Réinitialiser tous les comptes existants avec le code PIN **1234** (4 chiffres) pour faciliter les tests et permettre aux utilisateurs de se reconnecter.

## 📌 Politique des Codes PIN

### Code PIN Utilisateur
- **Longueur** : EXACTEMENT 4 chiffres
- **Format** : Numérique uniquement (0-9)
- **Exemples valides** : `1234`, `5678`, `0000`, `9999`
- **Exemples invalides** :
  - `12345` (trop long - 5 chiffres)
  - `123` (trop court - 3 chiffres)
  - `abcd` (non numérique)
  - `12.34` (contient un symbole)

### Stockage dans Supabase
- **Format stocké** : 6 caractères avec padding
- **Exemple** : PIN `1234` → Stocké comme `001234`
- **Raison** : Supabase Auth exige minimum 6 caractères
- **Solution** : Padding automatique dans l'application

### Validation Stricte
L'application impose :
- ✅ `maxLength={4}` dans le champ de saisie
- ✅ `keyboardType="number-pad"` pour numérique uniquement
- ✅ Validation avant soumission : `password.length < 4`
- ✅ Message clair : "Code PIN (4 chiffres)"

---

## 📋 Méthode 1 : Via le Dashboard Supabase (Recommandé)

### Étape 1 : Lister les utilisateurs

1. Aller dans **Supabase Dashboard**
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Exécuter cette requête :

```sql
SELECT
  p.phone as telephone,
  p.full_name as nom,
  au.email as email,
  au.created_at as cree_le
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY au.created_at DESC;
```

5. **Noter tous les emails** affichés (ex: `+221785423833@senepanda.app`)

### Étape 2 : Réinitialiser chaque compte

Pour **CHAQUE** email listé :

1. Aller dans **Authentication** > **Users**
2. Chercher l'utilisateur par son **email**
3. Cliquer sur l'utilisateur
4. Cliquer sur le bouton **"..."** (trois points en haut à droite)
5. Sélectionner **"Reset Password"** ou **"Update user"**
6. Entrer le nouveau mot de passe : `001234`
   - ⚠️ **IMPORTANT** : Taper `001234` (pas `1234`)
   - L'utilisateur tapera `1234`, le système ajoute le padding
7. Cocher **"Auto Confirm User"** si disponible
8. Cliquer sur **"Update user"** ou **"Save"**

### Étape 3 : Vérification

Après chaque réinitialisation :
- ✅ Marquer l'utilisateur comme traité
- ✅ Tester la connexion si possible

---

## 🚀 Méthode 2 : Script SQL Automatique

Si vous avez accès à l'**API Admin** via un service backend :

### Créer un fichier `reset-passwords.js` :

```javascript
import { createClient } from '@supabase/supabase-js'

// ⚠️ Utiliser la SERVICE_ROLE_KEY (pas l'anon key)
const supabaseAdmin = createClient(
  'https://your-project.supabase.co',
  'your-service-role-key', // Attention : NE JAMAIS exposer cette clé
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function resetAllPasswords() {
  console.log('🔄 Début de la réinitialisation...\n')

  // Récupérer tous les utilisateurs
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, full_name, email')

  if (error) {
    console.error('❌ Erreur:', error)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️ Aucun utilisateur trouvé')
    return
  }

  console.log(`📊 ${profiles.length} utilisateur(s) trouvé(s)\n`)

  // Nouveau mot de passe (avec padding)
  const newPassword = '001234' // Correspond à PIN 1234

  let success = 0
  let failed = 0

  for (const profile of profiles) {
    try {
      console.log(`⏳ Traitement: ${profile.phone} (${profile.full_name || 'Sans nom'})`)

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { password: newPassword }
      )

      if (updateError) {
        console.error(`  ❌ Erreur: ${updateError.message}`)
        failed++
      } else {
        console.log(`  ✅ Réinitialisé avec succès`)
        success++
      }
    } catch (err) {
      console.error(`  ❌ Exception:`, err)
      failed++
    }
    console.log('') // Ligne vide
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Succès: ${success}`)
  console.log(`❌ Échecs: ${failed}`)
  console.log(`📊 Total: ${profiles.length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (success > 0) {
    console.log('ℹ️  Les utilisateurs peuvent maintenant se connecter avec:')
    console.log('   Code PIN: 1234')
    console.log('')
  }
}

// Exécuter
resetAllPasswords()
  .then(() => {
    console.log('✅ Script terminé')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Erreur fatale:', err)
    process.exit(1)
  })
```

### Exécuter le script :

```bash
node reset-passwords.js
```

---

## 📝 Liste de Vérification

Avant de commencer :
- [ ] Backup de la base de données fait
- [ ] Liste de tous les utilisateurs récupérée
- [ ] Service role key disponible (si méthode 2)

Pendant la réinitialisation :
- [ ] Réinitialiser chaque compte à `001234`
- [ ] Vérifier qu'aucune erreur n'apparaît
- [ ] Cocher chaque utilisateur traité

Après la réinitialisation :
- [ ] Tester la connexion d'au moins un compte
- [ ] Informer les utilisateurs du nouveau PIN
- [ ] Encourager à changer le PIN après connexion

---

## 👥 Utilisateurs Connus

### Compte Principal
```
Téléphone : +221 78 542 38 33
Email     : +221785423833@senepanda.app
Nouveau PIN : 1234
```

### Autres Comptes
Exécuter cette requête pour voir tous les comptes :

```sql
SELECT
  ROW_NUMBER() OVER (ORDER BY au.created_at) as "#",
  p.phone,
  p.full_name,
  au.email,
  CASE
    WHEN au.last_sign_in_at IS NOT NULL THEN '✓ Actif'
    ELSE '○ Inactif'
  END as statut
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY au.created_at DESC;
```

---

## 📱 Message aux Utilisateurs

Après la réinitialisation, envoyer ce message à tous les utilisateurs :

```
🐼 SenePanda - Réinitialisation du Code PIN

Bonjour,

Votre code PIN a été réinitialisé pour :
📌 Code PIN : 1234

Pour vous connecter :
1. Ouvrir l'application SenePanda
2. Entrer votre numéro de téléphone
3. Entrer le code PIN : 1234

⚠️ Recommandation :
Après votre première connexion, changez votre code PIN dans :
Profil > Paramètres > Modifier le code PIN

Besoin d'aide ? Contactez-nous au +221 XX XXX XX XX

L'équipe SenePanda
```

---

## 🔒 Sécurité

### ⚠️ IMPORTANT

- **NE JAMAIS** faire cela en production avec un mot de passe unique
- **TOUJOURS** envoyer un lien de réinitialisation personnalisé en production
- **JAMAIS** partager la `service_role_key` publiquement
- **TOUJOURS** utiliser HTTPS en production

### Recommandations Production

Pour la production, implémenter :
1. ✅ Réinitialisation par SMS OTP
2. ✅ Expiration des liens de réinitialisation (15 min)
3. ✅ Limite de tentatives (3 max)
4. ✅ Logging de toutes les réinitialisations
5. ✅ Notification email/SMS après changement

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs** dans Supabase Dashboard > Logs
2. **Vérifier la connexion** : Authentication > Users
3. **Tester manuellement** avec un compte
4. **Contacter Supabase Support** si nécessaire

---

## 📊 Monitoring

Après réinitialisation, surveiller :

```sql
-- Connexions récentes
SELECT
  p.phone,
  au.last_sign_in_at,
  au.updated_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.last_sign_in_at > NOW() - INTERVAL '24 hours'
ORDER BY au.last_sign_in_at DESC;

-- Utilisateurs jamais connectés
SELECT
  p.phone,
  p.full_name,
  au.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.last_sign_in_at IS NULL
ORDER BY au.created_at DESC;
```

---

**Dernière mise à jour** : 29 Novembre 2025

**Auteur** : Admin SenePanda
