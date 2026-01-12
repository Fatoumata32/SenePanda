# 🔧 Fix: Live Shopping bloqué malgré Premium

## 🐛 Problème

Vous avez souscrit à Premium mais le Live Shopping affiche toujours "Passez au Premium".

## 🔍 Cause

Le champ `subscription_status` dans votre profil n'est pas défini sur `'active'`. Le système vérifie 3 conditions:

1. ✅ `subscription_plan = 'premium'` (vous l'avez)
2. ❌ `subscription_status = 'active'` (manquant)
3. ✅ `subscription_expires_at > NOW()` (probablement OK)

## ✅ Solution Rapide

### Option 1: Via SQL (Recommandé)

1. **Ouvrez Supabase Dashboard** → SQL Editor

2. **Trouvez votre ID utilisateur**:
```sql
SELECT id, full_name, phone, subscription_plan, subscription_status
FROM profiles
WHERE is_seller = true
ORDER BY created_at DESC
LIMIT 5;
```

3. **Activez votre Premium** (remplacez `VOTRE_USER_ID`):
```sql
UPDATE profiles
SET
  subscription_plan = 'premium',
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE id = 'VOTRE_USER_ID';
```

4. **Vérifiez**:
```sql
SELECT
  full_name,
  subscription_plan,
  subscription_status,
  subscription_expires_at > NOW() as est_actif
FROM profiles
WHERE id = 'VOTRE_USER_ID';
```

Résultat attendu:
- `subscription_plan`: "premium"
- `subscription_status`: "active"
- `est_actif`: true

### Option 2: Via l'App (Plus simple)

1. **Fermez complètement l'app** SenePanda
2. **Réouvrez l'app**
3. **Allez dans** Profil → Abonnements
4. **Sélectionnez Premium** à nouveau
5. **Cliquez sur "Procéder au paiement"**
6. **Dans le simulateur Wave**, cliquez sur **"Confirmer le paiement"**
7. Le code corrigé ajoutera maintenant `subscription_status = 'active'`

## 🧪 Tester le Déblocage

Après avoir appliqué la solution:

1. **Fermez l'app complètement**
2. **Réouvrez l'app**
3. **Allez dans** le menu vendeur
4. **Cliquez sur "Démarrer un Live"**
5. Vous devriez voir le formulaire de création au lieu du message "Passez au Premium"

## 📋 Fichiers Modifiés

### `app/seller/subscription-plans.tsx`

Ajouté `subscription_status: 'active'` dans 2 endroits:

**Ligne 307-316** (fonction `processSubscriptionRequest`):
```typescript
const { error: updateError } = await supabase
  .from('profiles')
  .update({
    subscription_plan: selectedPlan.plan_type,
    subscription_status: 'active',  // ⬅️ AJOUTÉ
    subscription_expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id);
```

**Ligne 379-387** (fonction `handleWavePaymentSuccess`):
```typescript
const { error: updateError } = await supabase
  .from('profiles')
  .update({
    subscription_plan: selectedPlan.plan_type,
    subscription_status: 'active',  // ⬅️ AJOUTÉ
    subscription_expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id);
```

## 🔍 Vérification Technique

Le hook `useSubscriptionLimits` (ligne 99) vérifie:
```typescript
can_create_live: isActive && !isExpired,
```

Où:
```typescript
const isActive = profile?.subscription_status === 'active';  // ⬅️ IMPORTANT
const isExpired = profile?.subscription_expires_at
  ? new Date(profile.subscription_expires_at) < new Date()
  : false;
```

## ✅ Checklist de Validation

- [ ] `subscription_plan = 'premium'` dans la BDD
- [ ] `subscription_status = 'active'` dans la BDD
- [ ] `subscription_expires_at` est dans le futur
- [ ] App fermée puis réouverte
- [ ] Page "Démarrer un Live" accessible

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez dans Supabase** que les 3 champs sont corrects:
```sql
SELECT subscription_plan, subscription_status, subscription_expires_at
FROM profiles
WHERE id = 'VOTRE_ID';
```

2. **Vérifiez la console de l'app** pour les logs:
- Cherchez "Error loading subscription limits"
- Cherchez "Plan actuel: PREMIUM"

3. **Videz le cache de l'app**:
```bash
npm start -- --clear
```

## 📝 Pour les Futurs Paiements

Avec le code corrigé, tous les nouveaux abonnements définiront automatiquement `subscription_status = 'active'`.

Le problème ne devrait plus se reproduire!
