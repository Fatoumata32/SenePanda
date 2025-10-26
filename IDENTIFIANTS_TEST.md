# Identifiants de Test - Marketplace Africaine

## Compte Client (Acheteur)

### Identifiants de connexion:
- **Email**: `test@marketplace.com`
- **Mot de passe**: `TestMarket123!`

### Informations du profil:
- **Nom**: Utilisateur Test
- **Téléphone**: +221 77 123 45 67
- **Pays**: Sénégal
- **Type**: Client (acheteur)

---

## Compte Vendeur

### Identifiants de connexion:
- **Email**: `vendeur@marketplace.com`
- **Mot de passe**: `VendeurTest123!`

### Informations du profil:
- **Nom**: Amadou Diallo
- **Boutique**: Boutique Africaine
- **Description**: Artisan spécialisé dans les produits traditionnels africains
- **Téléphone**: +225 05 12 34 56 78
- **Pays**: Côte d'Ivoire
- **Type**: Vendeur

---

## Instructions pour créer les comptes

### Option 1: Via Supabase Dashboard (Recommandé)

1. Connectez-vous à votre projet Supabase
2. Allez dans **Authentication** > **Users**
3. Cliquez sur **Add user** > **Create new user**
4. Entrez l'email et le mot de passe ci-dessus
5. Copiez l'UUID de l'utilisateur créé
6. Allez dans **SQL Editor**
7. Ouvrez le fichier `supabase/migrations/20251011235000_create_test_profile.sql`
8. Remplacez `USER_UUID_HERE` ou `SELLER_UUID_HERE` par l'UUID copié
9. Exécutez la requête SQL

### Option 2: Via API (Programmatique)

Utilisez le script suivant dans votre application:

```typescript
import { supabase } from './lib/supabase';

async function createTestAccounts() {
  // Créer le compte client
  const { data: client, error: clientError } = await supabase.auth.signUp({
    email: 'test@marketplace.com',
    password: 'TestMarket123!',
    options: {
      data: {
        full_name: 'Utilisateur Test',
        phone: '+221 77 123 45 67',
        country: 'Sénégal'
      }
    }
  });

  if (clientError) {
    console.error('Erreur création client:', clientError);
  } else {
    console.log('Client créé avec succès:', client.user?.id);

    // Créer le profil client
    await supabase.from('profiles').insert({
      id: client.user?.id,
      full_name: 'Utilisateur Test',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      is_seller: false,
      phone: '+221 77 123 45 67',
      country: 'Sénégal'
    });
  }

  // Créer le compte vendeur
  const { data: seller, error: sellerError } = await supabase.auth.signUp({
    email: 'vendeur@marketplace.com',
    password: 'VendeurTest123!',
    options: {
      data: {
        full_name: 'Amadou Diallo',
        phone: '+225 05 12 34 56 78',
        country: 'Côte d\'Ivoire'
      }
    }
  });

  if (sellerError) {
    console.error('Erreur création vendeur:', sellerError);
  } else {
    console.log('Vendeur créé avec succès:', seller.user?.id);

    // Créer le profil vendeur
    await supabase.from('profiles').insert({
      id: seller.user?.id,
      full_name: 'Amadou Diallo',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller',
      is_seller: true,
      shop_name: 'Boutique Africaine',
      shop_description: 'Artisan spécialisé dans les produits traditionnels africains',
      phone: '+225 05 12 34 56 78',
      country: 'Côte d\'Ivoire'
    });
  }
}
```

---

## Structure de la base de données

Les profils sont stockés dans la table `profiles` avec les champs suivants:
- `id` (UUID) - Référence vers auth.users
- `full_name` - Nom complet
- `avatar_url` - URL de l'avatar
- `is_seller` - Statut vendeur (true/false)
- `shop_name` - Nom de la boutique (si vendeur)
- `shop_description` - Description de la boutique (si vendeur)
- `phone` - Numéro de téléphone
- `country` - Pays

---

## Notes de sécurité

Ces identifiants sont à usage de **TEST UNIQUEMENT**.
- Ne les utilisez jamais en production
- Changez les mots de passe régulièrement
- Supprimez ces comptes une fois les tests terminés