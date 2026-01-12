# 🪙 Guide: Utilisation des Panda Coins

## Comment ça marche?

Les Panda Coins sont votre monnaie de fidélité sur SenePanda. Vous pouvez les gagner en faisant des achats, en laissant des avis, ou en parrainant des amis. Ensuite, utilisez-les pour obtenir des réductions!

## 💰 Comment gagner des coins?

| Action | Coins gagnés |
|--------|-------------|
| Achat de produits | 1 coin par 1000 FCFA |
| Laisser un avis | +50 coins |
| Parrainer un ami | +200 coins |
| Connexion quotidienne | +10 coins |
| Bonus d'inscription | +100 coins |

## 🛒 Utiliser les coins au checkout

### Conversion directe
- **1 Panda Coin = 5 FCFA de réduction**
- Minimum: 100 coins (500 FCFA de réduction)
- Maximum: 50% du total de la commande

### Comment utiliser?
1. Ajoutez des produits au panier
2. Allez au checkout
3. Cliquez sur "Utiliser vos Panda Coins 🐼"
4. Choisissez combien de coins utiliser (25%, 50%, 75%, MAX)
5. Cliquez sur "Appliquer la réduction"
6. La réduction s'applique automatiquement!

## 🎁 Boutique de récompenses

Vous pouvez aussi échanger vos coins contre des récompenses spéciales:

### Réductions
- 5% de réduction: 500 coins
- 10% de réduction: 1000 coins
- 15% de réduction: 1500 coins
- 25% de réduction: 3000 coins (limité!)
- 50% de réduction: 7500 coins (très limité!)

### Livraison gratuite
- 1x Livraison gratuite: 750 coins
- 2x Livraison gratuite: 1300 coins

### Bons d'achat
- 1000 FCFA: 500 coins
- 2500 FCFA: 1200 coins
- 5000 FCFA: 2200 coins
- 10000 FCFA: 4000 coins

### Pour les vendeurs (Boosts)
- Visibilité 24h: 800 coins
- Visibilité 3 jours: 2000 coins
- Visibilité 7 jours: 4500 coins
- Mise en avant page d'accueil: 1500 coins

## 📊 Niveaux de fidélité

| Niveau | Coins totaux gagnés |
|--------|---------------------|
| 🥉 Bronze | 0 - 999 |
| 🥈 Argent | 1000 - 4999 |
| 🥇 Or | 5000 - 14999 |
| 💎 Platine | 15000+ |

## ⚙️ Configuration technique (pour les admins)

### Ajouter les récompenses à la base de données

Exécutez le fichier SQL suivant dans Supabase:
```
supabase/migrations/add_practical_rewards.sql
```

### Variables de configuration

Dans `hooks/useCoinBalance.ts`:
```typescript
COINS_TO_FCFA_RATE = 5;        // 1 coin = 5 FCFA
MIN_COINS_TO_USE = 100;        // Minimum 100 coins
MAX_DISCOUNT_PERCENTAGE = 50;  // Maximum 50% du total
```

## 🔧 Fichiers modifiés

- `hooks/useCoinBalance.ts` - Hook pour gérer le solde de coins
- `components/checkout/CoinRedemption.tsx` - Composant de rédemption au checkout
- `components/rewards/MyRewardsList.tsx` - Liste des récompenses réclamées
- `app/checkout.tsx` - Intégration des coins au checkout
- `app/(tabs)/profile.tsx` - Affichage des coins dans le profil
- `app/rewards/index.tsx` - Page principale des récompenses
- `app/rewards/shop.tsx` - Boutique de récompenses
- `supabase/migrations/add_practical_rewards.sql` - SQL pour ajouter les récompenses
