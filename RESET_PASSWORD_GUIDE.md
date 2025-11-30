# Guide de Réinitialisation du Code PIN

## Pour l'utilisateur +221 78 542 38 33

Votre compte existe dans le système mais vous avez oublié votre code PIN. Voici comment le réinitialiser :

### Option 1 : Via l'application (Recommandé)

1. **Ouvrir l'application SenePanda**
2. **Sur l'écran de connexion**, cliquer sur le lien **"Code PIN oublié ?"**
3. **Entrer votre numéro** : `+221 78 542 38 33`
4. **Créer un nouveau code PIN** : Choisir 4 chiffres faciles à retenir (ex: `1234`)
5. **Confirmer** la réinitialisation
6. **Se connecter** avec le nouveau code PIN

### Option 2 : Réinitialisation manuelle par l'administrateur

Si l'Option 1 ne fonctionne pas, l'administrateur peut réinitialiser manuellement :

#### Pour l'administrateur :

1. Se connecter au **Dashboard Supabase**
2. Aller dans **Authentication > Users**
3. Rechercher l'utilisateur avec l'email : `+221785423833@senepanda.app`
4. Cliquer sur l'utilisateur
5. Cliquer sur **"Send Magic Link"** ou **"Reset Password"**
6. Définir le nouveau mot de passe : `1234` (ou autre code à 4 chiffres)
7. Informer l'utilisateur du nouveau code PIN

### Option 3 : Via SQL (Pour développeurs)

Exécuter le script : `supabase/reset-user-password.sql` dans le SQL Editor de Supabase.

---

## Informations de connexion après réinitialisation

- **Numéro de téléphone** : `+221 78 542 38 33`
- **Nouveau code PIN** : `1234` (ou celui défini par l'admin)

---

## Fonctionnalités de l'application

### Écran de connexion amélioré

✅ **Code pays pré-rempli** : Le `+221` est automatiquement ajouté
✅ **Code PIN à 4 chiffres** : Plus facile à retenir
✅ **Bouton "Code PIN oublié"** : Réinitialisation rapide
✅ **Validation en temps réel** : Feedback immédiat sur les erreurs

### Processus de réinitialisation

1. **Vérification du compte** : Le système vérifie que le numéro existe
2. **Confirmation SMS** (simulé) : En production, un SMS sera envoyé
3. **Nouveau code PIN** : L'utilisateur choisit un nouveau code
4. **Mise à jour** : Le code est mis à jour dans la base de données
5. **Connexion automatique** : L'utilisateur est redirigé vers la connexion

---

## Notes techniques

### Sécurité

- Les codes PIN sont hashés avec bcrypt
- La réinitialisation nécessite une vérification du numéro
- En production, un SMS OTP sera envoyé pour confirmation

### Email généré

Le système génère automatiquement un email à partir du numéro :
```
Format : +221XXXXXXXXX@senepanda.app
Exemple : +221785423833@senepanda.app
```

### Base de données

Les informations utilisateur sont stockées dans deux tables :
- `auth.users` : Authentification (géré par Supabase Auth)
- `profiles` : Profil utilisateur (géré par l'application)

---

## Contact Support

Si vous rencontrez des problèmes, contactez le support :

📧 Email : support@senepanda.app
📱 WhatsApp : +221 XX XXX XX XX

---

**Dernière mise à jour** : 29 Novembre 2025
