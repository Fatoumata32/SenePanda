# 🎁 Système de Récompenses et Parrainage - Guide Complet

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le nouveau système de récompenses et de parrainage qui permet aux utilisateurs d'échanger leurs points contre des avantages.

---

## 🚀 Migrations à Exécuter

Pour activer le système, exécutez les migrations suivantes dans l'ordre sur votre base de données Supabase :

### 1. Migration Principale - Correction du Système de Parrainage
**Fichier**: `supabase/migrations/fix_immediate_referral_rewards.sql`

Cette migration :
- ✅ Met à jour la fonction `register_referral` pour attribuer **200 points au parrain immédiatement**
- ✅ Attribue **50 points au filleul** dès son inscription
- ✅ Change le statut des parrainages de `'pending'` à `'active'`

### 2. Migration Rétroactive - Attribution des Points Manquants
**Fichier**: `supabase/migrations/retroactive_referral_points.sql`

Cette migration :
- ✅ Trouve tous les parrainages en statut `'pending'`
- ✅ Attribue rétroactivement 200 points aux parrains existants
- ✅ Crée les transactions d'historique
- ✅ Affiche un résumé des points attribués

### 3. Migration Système de Récompenses
**Fichier**: `supabase/migrations/create_rewards_system.sql`

Cette migration crée :
- ✅ Table `rewards_catalog` - Catalogue des récompenses disponibles
- ✅ Table `user_rewards` - Récompenses obtenues par les utilisateurs
- ✅ Fonction `redeem_reward()` - Échanger des points contre une récompense
- ✅ Fonction `apply_discount_reward()` - Appliquer un bon de réduction
- ✅ Fonction `convert_points_to_discount()` - Convertir des points en réduction (1 point = 10 XOF)
- ✅ Fonction `get_user_active_rewards()` - Récupérer les récompenses actives
- ✅ 10 récompenses par défaut pré-configurées

---

## 📊 Comment Exécuter les Migrations

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Pour chaque fichier de migration :
   - Ouvrez le fichier
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL
   - Cliquez sur **Run**

### Option 2 : Via la CLI Supabase

```bash
cd project
npx supabase db push
```

---

## 🎯 Fonctionnalités du Système

### 1. Parrainage Amélioré

#### Gains Immédiats
- **Parrain** : Reçoit 200 points immédiatement quand un ami s'inscrit avec son code
- **Filleul** : Reçoit 50 points de bienvenue à l'inscription

#### Code de Parrainage
Chaque utilisateur a un code unique de 8 caractères (exemple: `A3B7F9C2`)

#### Comment Parrainer
```typescript
// Exemple d'utilisation dans votre code
const { data, error } = await supabase.rpc('register_referral', {
  p_referred_user_id: newUser.id,
  p_referral_code: 'A3B7F9C2' // Code du parrain
});
```

---

### 2. Catalogue de Récompenses

#### Types de Récompenses

##### 💰 Réductions (category: 'discount')
- Bon de 500 XOF (50 points)
- Bon de 1000 XOF (100 points)
- Bon de 2500 XOF (200 points)
- Bon de 5000 XOF (400 points)

##### 🚀 Boosts de Visibilité (category: 'boost')
- Boost 24h (100 points) - Met en avant vos produits pendant 24h
- Boost 3 jours (250 points)
- Boost 7 jours (500 points)

##### 👑 Avantages Premium (category: 'premium')
- Badge VIP 30j (300 points)
- 3 Livraisons gratuites (150 points)
- Support prioritaire 30j (200 points)

---

### 3. Utilisation des Récompenses

#### Échanger des Points

```typescript
// Dans votre application React Native
const handleRedeem = async (rewardId: string) => {
  const { data, error } = await supabase.rpc('redeem_reward', {
    p_user_id: user.id,
    p_reward_id: rewardId
  });

  if (data.success) {
    console.log(`Récompense obtenue! Points restants: ${data.remaining_points}`);
  }
};
```

#### Convertir Points en Réduction Directe

```typescript
// Convertir 100 points en 1000 XOF de réduction
const { data, error } = await supabase.rpc('convert_points_to_discount', {
  p_user_id: user.id,
  p_points_to_convert: 100  // Minimum 50 points
});

// Taux de conversion: 1 point = 10 XOF
```

#### Appliquer un Bon de Réduction sur une Commande

```typescript
const { data, error } = await supabase.rpc('apply_discount_reward', {
  p_user_id: user.id,
  p_order_id: orderId,
  p_user_reward_id: userRewardId
});

if (data.success) {
  const discountAmount = data.discount_amount; // Montant à déduire
}
```

---

### 4. Récupérer les Récompenses Actives

```typescript
const { data: activeRewards, error } = await supabase
  .rpc('get_user_active_rewards', {
    p_user_id: user.id
  });

// activeRewards contient toutes les récompenses non utilisées et non expirées
```

---

## 📱 Interfaces Utilisateur

### Écrans Disponibles

1. **`/rewards/index`** - Vue d'ensemble des points
   - Affiche le solde de points
   - Niveau de fidélité (Bronze, Silver, Gold, Platinum)
   - Historique des transactions
   - Méthodes pour gagner des points

2. **`/rewards/shop`** - Boutique des récompenses
   - Liste toutes les récompenses disponibles
   - Filtres par catégorie
   - Affiche les points nécessaires
   - Indication de stock

3. **`/rewards/redeem/[id]`** - Confirmation d'échange
   - Détails de la récompense
   - Confirmation avant échange
   - Synthèse vocale disponible

4. **`/referral/index`** - Parrainage
   - Affiche le code de parrainage personnel
   - Partage via réseaux sociaux
   - Liste des filleuls

---

## 💡 Exemples d'Utilisation

### Ajouter une Nouvelle Récompense

```sql
INSERT INTO rewards_catalog (
  title,
  description,
  category,
  points_cost,
  value,
  duration_days,
  icon
) VALUES (
  'Bon de 10000 XOF',
  'Grosse réduction sur votre prochaine commande',
  'discount',
  800,
  10000,
  30,
  '🎉'
);
```

### Vérifier le Solde de Points d'un Utilisateur

```sql
SELECT points, total_earned, level
FROM loyalty_points
WHERE user_id = 'user-uuid';
```

### Voir l'Historique des Transactions

```sql
SELECT *
FROM points_transactions
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔧 Configuration Personnalisée

### Modifier le Taux de Conversion

Dans `create_rewards_system.sql`, ligne 214 :
```sql
v_conversion_rate DECIMAL(10,2) := 10.0; -- Changer ici (1 point = X XOF)
```

### Modifier le Minimum de Points pour Conversion

Dans `create_rewards_system.sql`, ligne 224 :
```sql
IF p_points_to_convert < 50 THEN  -- Changer le minimum ici
```

### Ajouter Plus de Récompenses

Exécutez simplement un INSERT dans `rewards_catalog` :
```sql
INSERT INTO rewards_catalog (title, description, category, points_cost, value, icon)
VALUES ('Votre Récompense', 'Description', 'gift', 100, NULL, '🎁');
```

---

## 📈 Statistiques et Rapports

### Top Parrains

```sql
SELECT
  p.username,
  p.successful_referrals as total_filleuls,
  lp.points as points_actuels
FROM profiles p
JOIN loyalty_points lp ON lp.user_id = p.id
WHERE p.successful_referrals > 0
ORDER BY p.successful_referrals DESC
LIMIT 10;
```

### Récompenses les Plus Populaires

```sql
SELECT
  rc.title,
  COUNT(ur.id) as nombre_echanges,
  SUM(ur.points_spent) as total_points_depenses
FROM rewards_catalog rc
JOIN user_rewards ur ON ur.reward_id = rc.id
GROUP BY rc.id, rc.title
ORDER BY nombre_echanges DESC;
```

---

## ⚠️ Notes Importantes

1. **Points de Parrainage**
   - Les points sont attribués **immédiatement** lors de l'inscription du filleul
   - Pas besoin d'attendre le premier achat
   - Le système est rétroactif (les parrainages passés sont pris en compte)

2. **Récompenses**
   - Une fois échangée, une récompense reste active jusqu'à expiration ou utilisation
   - Les récompenses avec `duration_days` expirent automatiquement
   - Le stock est géré automatiquement

3. **Sécurité**
   - Toutes les fonctions utilisent `SECURITY DEFINER` pour la sécurité
   - Les transactions sont atomiques
   - Vérifications des soldes avant chaque opération

---

## 🎉 C'est Prêt !

Votre système de récompenses et de parrainage est maintenant complet avec :
- ✅ Attribution immédiate des points de parrainage
- ✅ Boutique de récompenses interactive
- ✅ Conversion de points en réductions
- ✅ Historique complet des transactions
- ✅ Interface utilisateur moderne et accessible

Pour toute question ou personnalisation, consultez les fichiers de migration ou les écrans React Native !
