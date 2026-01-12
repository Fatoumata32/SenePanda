# 🐼 Activer le Système Panda Coins - Guide Rapide

## 📋 Étapes d'Activation

### ÉTAPE 1: Diagnostic (2 minutes)

**Exécutez dans Supabase SQL Editor:**

```sql
-- Vérifier si les tables existent
SELECT
  CASE
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_points')
    THEN '✅ loyalty_points existe'
    ELSE '❌ loyalty_points MANQUE'
  END as table_loyalty,
  CASE
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'points_transactions')
    THEN '✅ points_transactions existe'
    ELSE '❌ points_transactions MANQUE'
  END as table_transactions,
  CASE
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'rewards')
    THEN '✅ rewards existe'
    ELSE '❌ rewards MANQUE'
  END as table_rewards;
```

---

### ÉTAPE 2: Installation (si tables manquent)

Si vous voyez des ❌ ci-dessus, exécutez le script complet:

**Fichier:** [SETUP_COINS_SYSTEM_FINAL.sql](SETUP_COINS_SYSTEM_FINAL.sql)

1. Ouvrez Supabase SQL Editor
2. Copiez tout le contenu de `SETUP_COINS_SYSTEM_FINAL.sql`
3. Cliquez sur **RUN** ▶️
4. Attendez le succès (vert)

---

### ÉTAPE 3: Donner des Coins aux Utilisateurs

#### Option A: Donner à UN utilisateur spécifique

```sql
-- Remplacez l'email
INSERT INTO loyalty_points (user_id, points, total_earned)
SELECT id, 100, 100
FROM profiles
WHERE email = 'votre.email@exemple.com'
ON CONFLICT (user_id)
DO UPDATE SET
  points = loyalty_points.points + 100,
  total_earned = loyalty_points.total_earned + 100;

-- Enregistrer la transaction
INSERT INTO points_transactions (user_id, points, type, description)
SELECT id, 100, 'bonus', 'Bonus de bienvenue!'
FROM profiles
WHERE email = 'votre.email@exemple.com';
```

#### Option B: Donner à TOUS les utilisateurs

```sql
-- Donner 50 coins à tous les utilisateurs
INSERT INTO loyalty_points (user_id, points, total_earned)
SELECT id, 50, 50
FROM profiles
ON CONFLICT (user_id)
DO UPDATE SET
  points = loyalty_points.points + 50,
  total_earned = loyalty_points.total_earned + 50;

-- Enregistrer les transactions
INSERT INTO points_transactions (user_id, points, type, description)
SELECT id, 50, 'bonus', 'Bonus de lancement!'
FROM profiles;
```

#### Option C: Donner au numéro +221785423833

```sql
-- Donner 500 coins à ce numéro
INSERT INTO loyalty_points (user_id, points, total_earned)
SELECT id, 500, 500
FROM profiles
WHERE phone LIKE '%785423833%'
ON CONFLICT (user_id)
DO UPDATE SET
  points = loyalty_points.points + 500,
  total_earned = loyalty_points.total_earned + 500;

-- Transaction
INSERT INTO points_transactions (user_id, points, type, description)
SELECT id, 500, 'bonus', 'Bonus VIP - Bienvenue!'
FROM profiles
WHERE phone LIKE '%785423833%';
```

---

### ÉTAPE 4: Ajouter des Récompenses

```sql
-- Récompenses pratiques
INSERT INTO rewards (title, description, points_cost, reward_type, value, is_active) VALUES
('Réduction 500 FCFA', 'Utilisez cette récompense lors de votre prochain achat', 100, 'discount', 500, true),
('Réduction 1000 FCFA', 'Économisez 1000 FCFA sur votre commande', 200, 'discount', 1000, true),
('Réduction 2500 FCFA', 'Grande réduction de 2500 FCFA', 500, 'discount', 2500, true),
('Livraison Gratuite', 'Profitez de la livraison gratuite sur votre prochaine commande', 150, 'free_shipping', 0, true),
('Produit Mystère', 'Recevez un produit surprise d''une valeur de 5000 FCFA', 800, 'gift', 5000, true);
```

---

### ÉTAPE 5: Vérification

```sql
-- Voir les utilisateurs avec leurs coins
SELECT
  p.full_name,
  p.email,
  lp.points,
  lp.total_earned,
  lp.level
FROM loyalty_points lp
JOIN profiles p ON p.id = lp.user_id
ORDER BY lp.points DESC
LIMIT 10;

-- Voir les récompenses disponibles
SELECT
  title,
  points_cost,
  reward_type,
  value
FROM rewards
WHERE is_active = true
ORDER BY points_cost;
```

---

## 📱 Test dans l'Application

### Test 1: Voir le Solde

1. Ouvrez l'app
2. Allez dans **Profil**
3. Vous devriez voir une carte "Panda Coins" avec votre solde

**Code vérifié:**
- [app/(tabs)/profile.tsx](app/(tabs)/profile.tsx) - Affichage du solde
- [components/CoinBalanceBadge.tsx](components/CoinBalanceBadge.tsx) - Badge

### Test 2: Page Récompenses

1. Dans le profil, cliquez sur "Récompenses" ou "Points"
2. Vous devriez voir:
   - Votre solde total
   - Historique des gains/dépenses
   - Récompenses disponibles

**Route:** [app/rewards/index.tsx](app/rewards/index.tsx)

### Test 3: Utiliser au Checkout

1. Ajoutez un produit au panier
2. Allez au checkout
3. Vous devriez voir une section "Panda Coins"
4. Saisissez le nombre de coins à utiliser
5. La réduction s'applique automatiquement

**Code:** [app/checkout.tsx](app/checkout.tsx)

---

## 🐛 Dépannage

### Problème 1: "Aucun coin ne s'affiche"

**Vérifiez:**
```sql
-- L'utilisateur a-t-il une entrée?
SELECT * FROM loyalty_points WHERE user_id = 'USER_ID';

-- Sinon, créez-en une:
INSERT INTO loyalty_points (user_id, points) VALUES ('USER_ID', 100);
```

### Problème 2: "Erreur column does not exist"

**Solution:** La table loyalty_points manque des colonnes.

Exécutez:
```sql
-- Ajouter les colonnes manquantes
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0;
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'bronze';
```

### Problème 3: "Les coins ne se synchronisent pas"

**Vérifiez le realtime:**
```sql
-- Activer realtime sur loyalty_points
ALTER PUBLICATION supabase_realtime ADD TABLE loyalty_points;
```

---

## 🎯 Flow Complet d'Utilisation

### Scénario: Un client achète pour 25000 FCFA

1. **Au checkout:**
   - Total: 25000 FCFA
   - Client a 500 coins (= 2500 FCFA)
   - Client utilise 200 coins
   - Réduction appliquée: 1000 FCFA
   - **Nouveau total: 24000 FCFA**

2. **Après paiement:**
   - Coins dépensés: -200
   - Coins gagnés: +25 (1 coin par 1000 FCFA)
   - **Solde final: 325 coins**

3. **Transaction enregistrée:**
   ```sql
   -- Dépense
   INSERT INTO points_transactions VALUES (user_id, -200, 'purchase', 'Utilisé au checkout');
   -- Gain
   INSERT INTO points_transactions VALUES (user_id, 25, 'purchase', 'Achat de 25000 FCFA');
   ```

---

## ✅ Checklist Finale

Avant de dire que ça fonctionne:

- [ ] Tables créées (loyalty_points, points_transactions, rewards, claimed_rewards)
- [ ] Au moins 1 utilisateur a des coins
- [ ] Au moins 3 récompenses disponibles
- [ ] Le solde s'affiche dans le profil
- [ ] La page Récompenses charge
- [ ] Le widget au checkout fonctionne
- [ ] Les transactions sont enregistrées

---

## 🚀 Pour Aller Plus Loin

### Gagner des coins automatiquement

Modifiez [app/checkout.tsx](app/checkout.tsx) pour ajouter après paiement:

```typescript
// Après succès du paiement
const coinsEarned = Math.floor(total / 1000);
if (coinsEarned > 0) {
  await addCoins(coinsEarned, 'purchase', `Achat de ${total} FCFA`);

  // Afficher modal de félicitations
  setShowCoinsModal(true);
  setCoinsEarnedAmount(coinsEarned);
}
```

### Niveaux de fidélité

```sql
-- Fonction pour mettre à jour le niveau
CREATE OR REPLACE FUNCTION update_loyalty_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = CASE
    WHEN NEW.total_earned >= 10000 THEN 'platinum'
    WHEN NEW.total_earned >= 5000 THEN 'gold'
    WHEN NEW.total_earned >= 1000 THEN 'silver'
    ELSE 'bronze'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_trigger
BEFORE UPDATE ON loyalty_points
FOR EACH ROW
EXECUTE FUNCTION update_loyalty_level();
```

---

**Date:** 2026-01-12
**Status:** 📝 Guide Complet
**Action Requise:** Exécuter les scripts SQL dans Supabase
