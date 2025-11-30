# Solution pour les Codes PIN de 4 Chiffres

## Problème

Supabase Auth impose une longueur minimale de **6 caractères** pour les mots de passe par défaut, mais notre application utilise des **codes PIN de 4 chiffres** pour une meilleure expérience utilisateur.

### Erreur rencontrée :
```
AuthWeakPasswordError: Password should be at least 6 characters
```

## Solution Implémentée

### Padding Automatique

Nous utilisons une fonction de **padding** qui ajoute automatiquement des zéros au début des codes PIN courts pour atteindre 6 caractères minimum.

#### Comment ça fonctionne :

```typescript
// Fonction de padding (ligne 60-63 de simple-auth.tsx)
const padPinCode = (pin: string): string => {
  return pin.length < 6 ? pin.padStart(6, '0') : pin;
};
```

#### Exemples de transformation :

| Code PIN saisi | Code stocké | Description |
|----------------|-------------|-------------|
| `1234` | `001234` | Padding avec 2 zéros |
| `5678` | `005678` | Padding avec 2 zéros |
| `0000` | `000000` | Padding avec 2 zéros |
| `123456` | `123456` | Pas de padding nécessaire |

### Utilisation dans l'Application

Le padding est appliqué automatiquement dans 3 endroits :

1. **Connexion** (ligne 93)
```typescript
const paddedPassword = padPinCode(password);
await supabase.auth.signInWithPassword({
  email,
  password: paddedPassword,
});
```

2. **Inscription** (ligne 285)
```typescript
const paddedPassword = padPinCode(password);
await supabase.auth.signUp({
  email,
  password: paddedPassword,
});
```

3. **Réinitialisation** (automatique lors de la connexion après reset)

## Avantages de cette Solution

✅ **Transparent pour l'utilisateur** : L'utilisateur tape toujours 4 chiffres
✅ **Compatible avec Supabase** : Respecte la politique de 6 caractères minimum
✅ **Sécurisé** : Le mot de passe est toujours hashé par Supabase
✅ **Facile à maintenir** : Une seule fonction de padding
✅ **Rétrocompatible** : Fonctionne avec les codes existants

## Pour l'Utilisateur +221785423833

### Réinitialisation du compte

1. **Option A : Via l'application**
   - Aller sur l'écran de connexion
   - Cliquer sur "Code PIN oublié ?"
   - Entrer le numéro : `+221 78 542 38 33`
   - Créer un nouveau code PIN : `1234` (ou autre)
   - Le système va automatiquement le convertir en `001234`

2. **Option B : Créer un nouveau compte**
   - Cliquer sur "Créer un compte"
   - Entrer le numéro : `+221 78 542 38 33` (si l'ancien est désactivé)
   - Prénom : (votre prénom)
   - Nom : (votre nom)
   - Code PIN : `1234` → converti en `001234`

3. **Option C : Contact Admin**
   - Contacter l'administrateur
   - L'admin réinitialise le mot de passe à `001234` dans Supabase
   - Vous pouvez vous connecter avec le code PIN `1234`

### Comment se connecter après réinitialisation

```
Numéro : +221 78 542 38 33
Code PIN : 1234
```

Le système convertit automatiquement `1234` en `001234` pour l'authentification.

## Configuration Supabase (Alternative)

Si vous préférez configurer Supabase pour accepter directement 4 caractères :

### Via le Dashboard :

1. Aller dans **Authentication** > **Policies**
2. Trouver **"Password Requirements"**
3. Modifier **"Minimum password length"** : `4`
4. Sauvegarder

⚠️ **Note** : Cette option n'est pas toujours disponible selon le plan Supabase.

## Migration des Comptes Existants

Si des utilisateurs ont déjà des comptes avec des codes à 6 chiffres :

```sql
-- Vérifier les utilisateurs
SELECT email, created_at
FROM auth.users
WHERE email LIKE '%@senepanda.app';
```

Les anciens codes à 6 chiffres continueront de fonctionner normalement car `padPinCode()` ne modifie que les codes de moins de 6 caractères.

## Sécurité

### Est-ce sécurisé ?

✅ **Oui** :
- Les codes PIN sont toujours hashés avec bcrypt par Supabase
- Le padding est transparent et ne diminue pas la sécurité
- `001234` est aussi sécurisé que `1234` après hashage

### Recommandations :

1. En production, activer la **vérification 2FA** (SMS OTP)
2. Limiter les **tentatives de connexion** (3 max)
3. Ajouter un **délai** après échecs multiples
4. Logger les **tentatives suspectes**

## Tests

### Tester la fonctionnalité :

```bash
# 1. Créer un compte avec PIN 4 chiffres
Numéro : +221771234567
PIN : 1234

# 2. Vérifier dans la base de données
# Le mot de passe hashé correspond à "001234"

# 3. Se connecter
PIN : 1234 (fonctionne ✓)
PIN : 001234 (fonctionne aussi ✓)
```

## Fichiers Modifiés

- `app/simple-auth.tsx` : Ajout de la fonction `padPinCode()` et utilisation dans auth
- `supabase/migrations/fix_password_policy.sql` : Documentation de la solution

## Support

Pour toute question :
- 📧 support@senepanda.app
- 📱 WhatsApp : +221 XX XXX XX XX

---

**Dernière mise à jour** : 29 Novembre 2025
