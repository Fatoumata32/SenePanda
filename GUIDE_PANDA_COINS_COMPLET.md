# 🐼 Guide Complet du Système Panda Coins

## 🎯 Vue d'ensemble

Les **Panda Coins** sont la monnaie de fidélité de SenePanda. Les utilisateurs peuvent les gagner, les accumuler, et les utiliser pour obtenir des réductions ou des récompenses exclusives.

### Conversion
- **1 Panda Coin = 5 FCFA**
- Minimum de 100 coins pour utiliser au checkout
- Maximum 50% de réduction par commande

---

## 📁 Structure des Fichiers

```
├── hooks/
│   └── useCoinBalance.ts          # Hook principal pour gérer les coins
├── components/
│   ├── CoinBalanceBadge.tsx       # Badge pour afficher le solde
│   ├── checkout/
│   │   └── CoinRedemption.tsx     # Widget d'échange au checkout
│   └── rewards/
│       ├── CoinsEarnedModal.tsx   # Modal de félicitations
│       ├── CoinsHistory.tsx       # Historique des transactions
│       └── MyRewardsList.tsx      # Liste des récompenses réclamées
├── app/
│   ├── checkout.tsx               # Intégration checkout
│   └── rewards/
│       ├── index.tsx              # Page principale récompenses
│       └── shop.tsx               # Boutique récompenses
└── supabase/
    └── migrations/
        └── add_practical_rewards.sql
```

---

## 💾 Configuration Base de Données

### Tables Requises

Exécutez le script `SETUP_COINS_SYSTEM.sql` dans Supabase SQL Editor:

```sql
-- Tables créées:
-- 1. loyalty_points - Solde de coins des utilisateurs
-- 2. points_transactions - Historique des transactions
-- 3. rewards - Récompenses disponibles
-- 4. claimed_rewards - Récompenses réclamées
```

---

## 🪙 Comment Gagner des Coins

### 1. Achats
Les utilisateurs gagnent **1 coin par 1000 FCFA** dépensés.

```typescript
// Automatique dans checkout.tsx
const coinsEarned = Math.floor(total / 1000);
if (coinsEarned > 0) {
  await addCoins(coinsEarned, 'purchase', `Achat de ${total} FCFA`);
}
```

### 2. Bonus de bienvenue
Offrez des coins aux nouveaux utilisateurs via le profil:

```typescript
// Dans profile ou après inscription
await addCoins(50, 'bonus', 'Bonus de bienvenue!');
```

### 3. Parrainage (à implémenter)
```typescript
await addCoins(100, 'referral', 'Parrainage de @ami');
```

---

## 💳 Comment Utiliser les Coins

### Au Checkout (Réduction directe)

Le composant `CoinRedemption` permet d'appliquer une réduction:

```tsx
import CoinRedemption from '@/components/checkout/CoinRedemption';

<CoinRedemption
  total={25000}
  onApply={(discount, coinsUsed) => {
    setCoinDiscount(discount);
    setCoinsUsed(coinsUsed);
  }}
  onRemove={() => {
    setCoinDiscount(0);
    setCoinsUsed(0);
  }}
/>
```

### Dans la Boutique Récompenses

Les utilisateurs peuvent échanger leurs coins contre:
- **Réductions** (500, 1000, 2500, 5000 FCFA)
- **Livraison gratuite**
- **Boost visibilité** (pour vendeurs)
- **Badge Premium**
- **Bons d'achat**

---

## 📊 Hook useCoinBalance

```typescript
import { useCoinBalance, COINS_TO_FCFA_RATE } from '@/hooks/useCoinBalance';

const { 
  balance,           // { points, level, total_earned, total_spent }
  loading,           // boolean
  spendCoins,        // async (amount, type, description) => boolean
  addCoins,          // async (amount, type, description) => boolean
  calculateMaxDiscount, // (total) => { maxCoins, maxDiscount }
  refreshBalance     // async () => void
} = useCoinBalance();
```

### Exemples d'utilisation

```typescript
// Vérifier le solde
if (balance?.points >= 100) {
  // Peut utiliser des coins
}

// Ajouter des coins
await addCoins(50, 'bonus', 'Bonus journalier');

// Dépenser des coins
const success = await spendCoins(200, 'checkout_discount', 'Réduction');

// Calculer réduction max
const { maxCoins, maxDiscount } = calculateMaxDiscount(15000);
// maxDiscount = 7500 (50% de 15000)
// maxCoins = 1500 (7500 / 5 FCFA par coin)
```

---

## 🎨 Composants UI

### CoinBalanceBadge
Badge compact pour afficher le solde dans l'en-tête:

```tsx
import CoinBalanceBadge from '@/components/CoinBalanceBadge';

// Version compacte
<CoinBalanceBadge compact />

// Version complète avec animation
<CoinBalanceBadge showAnimation={true} />

// Avec action personnalisée
<CoinBalanceBadge onPress={() => router.push('/rewards')} />
```

### CoinsEarnedModal
Modal de félicitations après un achat:

```tsx
import CoinsEarnedModal from '@/components/rewards/CoinsEarnedModal';

<CoinsEarnedModal
  visible={showModal}
  coinsEarned={25}
  onClose={() => setShowModal(false)}
  onViewRewards={() => router.push('/rewards/shop')}
/>
```

### CoinsHistory
Historique des transactions:

```tsx
import CoinsHistory from '@/components/rewards/CoinsHistory';

// Toutes les transactions
<CoinsHistory />

// Limité aux 5 dernières
<CoinsHistory maxItems={5} />
```

---

## 🔒 Sécurité

### Policies RLS dans Supabase

```sql
-- Les utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can view own points" ON loyalty_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON loyalty_points
    FOR UPDATE USING (auth.uid() = user_id);
```

### Validation côté serveur
- Vérifier que l'utilisateur a assez de coins avant de dépenser
- Limiter la réduction à 50% du total
- Minimum 100 coins pour utiliser

---

## 🚀 Améliorations Futures

1. **Système de niveaux**
   - Bronze: 0-999 coins cumulés
   - Silver: 1000-4999 coins
   - Gold: 5000+ coins
   - Avantages par niveau

2. **Parrainage**
   - 100 coins pour le parrain
   - 50 coins pour le filleul

3. **Défis quotidiens**
   - +5 coins par connexion
   - +10 coins premier achat du jour

4. **Expiration des coins**
   - Coins expirent après 12 mois d'inactivité

---

## ❓ Dépannage

### "Column does not exist"
Exécutez le script `SETUP_COINS_SYSTEM.sql` dans Supabase.

### Coins non affichés
Vérifiez que `loyalty_points` a une entrée pour l'utilisateur:
```sql
SELECT * FROM loyalty_points WHERE user_id = 'USER_UUID';
```

### Récompenses non affichées
Vérifiez que les récompenses sont actives:
```sql
SELECT * FROM rewards WHERE is_active = true;
```

---

## 📱 Tester le Système

1. **Créer un compte test**
2. **Ajouter des coins** (via SQL ou bonus admin):
   ```sql
   INSERT INTO loyalty_points (user_id, points, total_earned)
   VALUES ('user-uuid', 500, 500);
   ```
3. **Aller au checkout** et tester l'échange
4. **Visiter /rewards/shop** pour voir la boutique

---

*Dernière mise à jour: Janvier 2025*
