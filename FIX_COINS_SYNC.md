# 🔄 Correction Synchronisation PandaCoins

## Problème
Les PandaCoins gagnés ("+13 PandaCoins" dans les notifications) ne se mettaient pas à jour automatiquement dans le profil.

## Cause
Le profil utilisait `profile?.panda_coins` (table `profiles`) au lieu des données de `loyalty_points` avec la synchronisation en temps réel.

## Solution Implémentée

### 1. Nouveau Contexte CoinsContext
- Fichier: `contexts/CoinsContext.tsx`
- Subscription Supabase Realtime pour `loyalty_points` et `points_transactions`
- Mise à jour automatique du solde quand les données changent en base

### 2. Hook useCoinBalance Amélioré  
- Fichier: `hooks/useCoinBalance.ts`
- Ajout d'une subscription realtime
- Mise à jour locale optimiste + synchronisation serveur

### 3. Notification Toast
- Fichier: `components/rewards/CoinNotificationToast.tsx`
- Affiche une notification quand des coins sont gagnés ou dépensés
- Ajouté au layout principal

### 4. Profil Corrigé
- Fichier: `app/(tabs)/profile.tsx`
- Utilise maintenant `useCoinBalance()` au lieu de `profile?.panda_coins`
- Les coins se mettent à jour en temps réel

## Configuration Supabase Requise

Exécutez ce SQL dans Supabase pour activer le realtime:

```sql
-- Activer la réplication pour loyalty_points
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_points;

-- Activer la réplication pour points_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
```

Ou exécutez le fichier `SETUP_COINS_SYSTEM_FINAL.sql` qui inclut cette configuration.

## Vérification

1. Faites un achat
2. Le toast "🪙 +X PandaCoins" doit apparaître
3. Le solde dans le profil doit se mettre à jour automatiquement
4. La page /rewards doit montrer le nouveau solde

## Fichiers Modifiés

- `app/_layout.tsx` - Ajout de CoinsProvider et CoinNotificationToast
- `app/(tabs)/profile.tsx` - Utilisation de useCoinBalance()
- `hooks/useCoinBalance.ts` - Ajout realtime subscription
- `contexts/CoinsContext.tsx` - Nouveau fichier
- `components/rewards/CoinNotificationToast.tsx` - Nouveau fichier
- `SETUP_COINS_SYSTEM_FINAL.sql` - Ajout activation realtime
