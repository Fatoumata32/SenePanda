# Guide d’utilisation — blocked_users (Supabase)

Ce guide accompagne le script `create_blocked_users_WORKING.sql`. Il explique les prérequis, les droits à accorder, les vérifications et l’utilisation côté client via `supabase-js`.

## 1) Prérequis
- Exécutez `create_blocked_users_WORKING.sql` dans Supabase SQL Editor (projet ciblé).
- Vérifiez qu’`auth.users` contient vos utilisateurs (connectez-vous avec deux comptes de test).

## 2) Accorder les droits d’exécution (GRANT)
Par défaut, les fonctions `SECURITY DEFINER` doivent être exécutables par le rôle `authenticated`. Ajoutez ces GRANT si nécessaire (à exécuter une fois) :

```sql
GRANT EXECUTE ON FUNCTION public.is_user_blocked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(uuid, uuid) TO authenticated;
```

Si vous utilisez un autre rôle (ex. `anon` via policies spécifiques), ajustez le rôle dans les GRANT.

## 3) Vérifications rapides
- Table créée :
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'blocked_users'
);
```
- Colonnes :
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blocked_users';
```
- Politiques RLS :
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'blocked_users'
ORDER BY cmd;
```
- Fonctions présentes :
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_user_blocked','block_user','unblock_user');
```

## 4) Utilisation côté client (supabase-js)
Assumons un client initialisé `supabase`.

- Vérifier si A a bloqué B :
```ts
const { data, error } = await supabase.rpc('is_user_blocked', {
  p_user_id: 'UUID_UTILISATEUR_A',         // facultatif, ignoré si différent d'auth.uid()
  p_blocked_user_id: 'UUID_UTILISATEUR_B',
});

if (error) {
  console.error('is_user_blocked error:', error.message);
}
const isBlocked = data === true; // boolean
```

- Bloquer B depuis A :
```ts
const { data, error } = await supabase.rpc('block_user', {
  p_user_id: 'UUID_UTILISATEUR_A',
  p_blocked_user_id: 'UUID_UTILISATEUR_B',
});

if (error) console.error('block_user error:', error.message);
// data: { success: boolean, message: string }
```

- Débloquer B depuis A :
```ts
const { data, error } = await supabase.rpc('unblock_user', {
  p_user_id: 'UUID_UTILISATEUR_A',
  p_blocked_user_id: 'UUID_UTILISATEUR_B',
});

if (error) console.error('unblock_user error:', error.message);
// data: { success: boolean, message: string }
```

Notes importantes :
- Les fonctions utilisent `auth.uid()` comme source de vérité; `p_user_id` est tolérant et ignoré s’il ne correspond pas.
- Les RLS permettent uniquement la lecture/écriture/suppression pour le propriétaire du blocage (`blocker_id = auth.uid()`).

## 5) Intégration UI/Flux
- Chat/Messages : exclure les conversations avec un utilisateur bloqué (côté requêtes ou filtrage en mémoire après fetch).
- Live/Viewer : empêcher l’affichage d’un utilisateur bloqué dans la liste des viewers ou empêcher l’utilisateur bloqué d’interagir.
- Profils : masquer le profil et les actions si `is_user_blocked` retourne `true`.

Exemple de filtre côté client après un fetch d’utilisateurs :
```ts
// users: Array<{ id: string, ... }>
const blockedIds = new Set<string>(/* liste des blocked_id pour auth.uid() */);
const visibleUsers = users.filter(u => !blockedIds.has(u.id));
```

## 6) Tests rapides (manuels)
1. Connectez-vous avec A et B (deux comptes réels).
2. Depuis A, appelez `block_user(A, B)` → attendez `{ success: true }`.
3. Vérifiez `is_user_blocked(A, B)` → `true`.
4. Depuis A, appelez `unblock_user(A, B)` → `{ success: true }`.
5. Vérifiez `is_user_blocked(A, B)` → `false`.

## 7) Dépannage
- Erreur `permission denied` sur RPC :
  - Ajoutez les `GRANT EXECUTE` ci-dessus pour le rôle utilisé (`authenticated`).
- Erreur RLS (INSERT/SELECT/DELETE refusé) :
  - Vérifiez que l’utilisateur est authentifié (token valide), et que `auth.uid()` matche `blocker_id`.
- Conflit unique lors d’un block répétitif :
  - L’INSERT est en `ON CONFLICT DO NOTHING`; l’appel est idempotent.
- Schéma incompatible de l’ancienne table :
  - Le script gère le renommage in-place (`user_id` → `blocker_id`, `blocked_user_id` → `blocked_id`) ou renomme en legacy.

## 8) Sécurité
- Les fonctions sont `SECURITY DEFINER` avec `search_path` contrôlé (`public, pg_temp`).
- Les politiques RLS limitent les opérations à l’utilisateur propriétaire (`blocker_id = auth.uid()`).
- Ne divulguez pas la liste des utilisateurs bloqués d’un autre utilisateur.

---
Besoin d’un helper TypeScript (`lib/blockedUsers.ts`) prêt à l’emploi ? Je peux l’ajouter pour standardiser `isUserBlocked`, `blockUser`, `unblockUser` et le mapping des réponses.