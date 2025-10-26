# Configuration de l'Authentification Supabase

## Problème : Impossible de se connecter après déconnexion

Si vous rencontrez ce problème, c'est probablement parce que la **confirmation d'email** est activée dans Supabase.

### Solution : Désactiver la confirmation d'email (pour le développement)

1. **Accédez au Dashboard Supabase** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet : `inhzfdufjhuihtuykwmw`

2. **Désactivez la confirmation d'email** :
   - Dans le menu de gauche, cliquez sur **Authentication**
   - Cliquez sur **Providers**
   - Trouvez **Email** dans la liste des providers
   - Cliquez sur **Email** pour ouvrir les paramètres
   - **Désactivez** l'option **"Confirm email"**
   - Cliquez sur **Save**

3. **Alternative : Configurez un serveur SMTP pour les emails** :
   - Allez dans **Authentication > Email Templates**
   - Configurez un serveur SMTP pour envoyer des emails de confirmation
   - Cependant, pour le développement, il est plus simple de désactiver la confirmation

### Pour la production

En production, il est recommandé de :
- **Activer** la confirmation d'email
- Configurer un serveur SMTP personnalisé
- Personnaliser les templates d'email

### Vérification après configuration

Après avoir désactivé la confirmation d'email :
1. Créez un nouveau compte
2. Déconnectez-vous
3. Reconnectez-vous avec les mêmes identifiants
4. La connexion devrait fonctionner immédiatement

### Note importante

Si des utilisateurs existent déjà avec des emails non confirmés, vous devrez les confirmer manuellement :
1. Allez dans **Authentication > Users**
2. Trouvez l'utilisateur
3. Cliquez sur les trois points (⋮)
4. Sélectionnez **Confirm email**

Ou utilisez cette requête SQL :
```sql
-- Confirmer tous les emails existants
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```
