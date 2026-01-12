# 🚀 Guide Rapide: Activer Realtime pour les PandaCoins

## 🎯 Problème Actuel

Les notifications affichent "+13 PandaCoins" mais le solde dans le profil ne se met pas à jour automatiquement.

![Screenshot Problème](WhatsApp%20Image%202025-12-24%20at%2023.53.10.jpeg)

## ✅ Solution en 2 Minutes

### Étape 1: Copier ce SQL

```sql
-- =====================================================
-- ACTIVER REALTIME POUR PANDACOINS
-- =====================================================

-- 1. Activer realtime pour loyalty_points
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_points;
        RAISE NOTICE '✅ Realtime activé pour loyalty_points';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ loyalty_points déjà dans supabase_realtime';
    END;
END $$;

-- 2. Activer realtime pour points_transactions
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
        RAISE NOTICE '✅ Realtime activé pour points_transactions';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ points_transactions déjà dans supabase_realtime';
    END;
END $$;

-- 3. Vérifier que c'est activé
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('loyalty_points', 'points_transactions');

-- Devrait retourner 2 lignes
```

### Étape 2: Exécuter dans Supabase

1. Ouvrir **Supabase Dashboard**
2. Aller dans **SQL Editor**
3. Copier-coller le SQL ci-dessus
4. Cliquer sur **Run**
5. Vérifier les messages:
   - `✅ Realtime activé pour loyalty_points`
   - `✅ Realtime activé pour points_transactions`

### Étape 3: Tester

1. Ouvrir l'app sur votre téléphone
2. Aller dans le profil
3. Noter le solde actuel (exemple: 100 coins)
4. Dans Supabase SQL Editor, exécuter:

```sql
-- Remplacer 'YOUR-USER-ID' par votre vrai ID utilisateur
SELECT award_coins(
    'YOUR-USER-ID',
    50,
    'test',
    'Test synchronisation realtime',
    NULL
);
```

5. **Résultat attendu**:
   - Le solde dans l'app passe de 100 → 150 automatiquement
   - Pas besoin de rafraîchir
   - Notification toast apparaît: "🪙 +50 PandaCoins"
   - Annonce vocale: "Vous avez gagné 50 PandaCoins!"

## 🔍 Comment Vérifier que ça Fonctionne

### Dans les Logs de l'App

Vous devriez voir ces logs dans la console:

```
🪙 Realtime coins update: { eventType: 'UPDATE', new: { points: 150 } }
```

Si vous voyez ça = ✅ **C'EST BON!**

### Dans le Profil

Le solde se met à jour automatiquement sans rafraîchir la page.

## 🐛 Si ça ne Marche Toujours Pas

### Vérification 1: Tables dans Realtime

```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Vous devez voir au minimum:
- `loyalty_points`
- `points_transactions`
- `profiles`

### Vérification 2: RLS Policies

```sql
-- Les policies doivent permettre SELECT pour tous
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'loyalty_points';
```

Si la policy SELECT n'existe pas:

```sql
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty_points"
    ON loyalty_points FOR SELECT
    USING (auth.uid() = user_id);
```

### Vérification 3: Redémarrer l'App

Parfois il faut juste redémarrer l'app pour que la subscription realtime se reconnecte:

1. Fermer complètement l'app
2. Réouvrir l'app
3. Retester

## 📚 Fichiers du Système

Le système de synchronisation est déjà implémenté dans:

- ✅ [`hooks/useCoinBalance.ts`](hooks/useCoinBalance.ts:136-164) - Hook avec realtime
- ✅ [`contexts/CoinsContext.tsx`](contexts/CoinsContext.tsx) - Contexte global
- ✅ [`app/(tabs)/profile.tsx`](app/(tabs)/profile.tsx:97) - Profil utilise le hook
- ✅ [`components/rewards/CoinNotificationToast.tsx`](components/rewards/CoinNotificationToast.tsx) - Toast de notification

**Il manque juste l'activation du realtime dans Supabase!**

## ⚡ Quick Fix

Si vous voulez vraiment aller vite:

```bash
# Dans Supabase Dashboard > Database > Replication
# Activer manuellement "Realtime" pour ces tables:
# - loyalty_points ✅
# - points_transactions ✅
```

## 🎉 Après la Correction

**Avant**:
- Notification "+13 coins"
- Profil ne bouge pas ❌

**Après**:
- Notification "+13 coins"
- Profil: 100 → 113 ✅
- Toast: "🪙 +13 PandaCoins"
- Voix: "Vous avez gagné 13 PandaCoins!"
- Vibration

---

**Temps estimé**: ⏱️ 2 minutes
**Difficulté**: 🟢 Facile
**Impact**: 🔥 Très important pour l'UX
