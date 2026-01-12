# Configuration des Notifications 🔔

## Problème
Le compteur de notifications affiche 0 car la table `deal_notifications` n'existe pas encore ou ne contient pas de données.

## Solution

### Option 1: Via le Dashboard Supabase (Recommandé)

1. Allez sur votre projet Supabase: https://supabase.com/dashboard
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier `scripts/create-test-notifications.sql`
5. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)

Cela va:
- ✅ Créer la table `deal_notifications`
- ✅ Configurer les index et RLS (sécurité)
- ✅ Créer 3 notifications de test pour chaque utilisateur

### Option 2: Via un script Node.js

Vous pouvez aussi créer un script pour insérer des notifications:

```javascript
// scripts/add-test-notifications.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Attention: Utiliser la clé service_role
);

async function createTestNotifications() {
  const { data: { users } } = await supabase.auth.admin.listUsers();

  for (const user of users) {
    await supabase.from('deal_notifications').insert([
      {
        user_id: user.id,
        title: 'Bienvenue sur SenePanda! 🎉',
        message: 'Découvrez nos promotions exclusives.',
        type: 'promo',
        is_read: false
      },
      {
        user_id: user.id,
        title: 'Nouvelle promotion Flash! ⚡',
        message: 'Jusqu\'à 50% de réduction sur certains produits.',
        type: 'promo',
        is_read: false
      }
    ]);
  }

  console.log('✅ Notifications créées!');
}

createTestNotifications();
```

## Vérification

Après avoir exécuté le script SQL:

1. Rechargez votre application Expo
2. Le badge rouge devrait apparaître sur l'icône 🔔
3. Le nombre de notifications devrait s'afficher
4. Les logs console devraient afficher: `"Total notifications count: 3"` (ou plus)

## Structure de la table

```sql
deal_notifications
├── id (UUID)
├── user_id (UUID) -> auth.users
├── deal_id (UUID, optionnel)
├── title (TEXT)
├── message (TEXT)
├── type (TEXT: 'promo', 'order', 'reward', etc.)
├── is_read (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Fonctionnalités implémentées

✅ Compteur total de notifications dans l'icône Bell
✅ Badge rouge qui apparaît quand count > 0
✅ Mise à jour en temps réel via Supabase Realtime
✅ Affichage "99+" si plus de 99 notifications
✅ Support du mode sombre
✅ Gestion d'erreur robuste

## Debug

Si le badge n'apparaît toujours pas:

1. Vérifiez les logs console pour voir les erreurs
2. Le texte rouge sous l'icône (en mode DEV) affiche la valeur actuelle
3. Vérifiez dans Supabase Dashboard > Table Editor > deal_notifications
