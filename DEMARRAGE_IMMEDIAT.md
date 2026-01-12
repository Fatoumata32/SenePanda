# 🚀 Démarrage Immédiat - SenePanda

## 🎯 Problèmes Actuels

Vous rencontrez ces erreurs:
- ❌ `column shop_logo_url does not exist` (Explorer, Favorites, Shop)
- ❌ `table 'rewards' does not exist` (Rewards Shop)
- ❌ Produits ne s'affichent pas dans Explorer
- ❌ Favoris ne chargent pas

## ✅ Solution en 2 ÉTAPES

### **ÉTAPE 1: Exécuter le Script SQL** (3 minutes)

1. Ouvrez **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Copiez-collez le script ci-dessous
4. Cliquez sur **Run**

```sql
-- PARTIE 1: Colonnes manquantes dans PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- PARTIE 2: Colonnes manquantes dans PRODUCTS
ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;

-- PARTIE 2.5: Colonnes manquantes dans CONVERSATIONS
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- PARTIE 3: Créer table REWARDS
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    reward_type TEXT DEFAULT 'gift',
    value DECIMAL(10,2),
    duration_days INTEGER DEFAULT 30,
    stock INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 4: Créer table LOYALTY_POINTS
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    level TEXT DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 5: Créer table CLAIMED_REWARDS
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reward_id UUID REFERENCES rewards(id),
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIE 6: Activer RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- PARTIE 7: Policies
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
CREATE POLICY "Anyone can view active rewards" ON rewards FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own points" ON loyalty_points;
CREATE POLICY "Users can view own points" ON loyalty_points FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own points" ON loyalty_points;
CREATE POLICY "Users can insert own points" ON loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own points" ON loyalty_points;
CREATE POLICY "Users can update own points" ON loyalty_points FOR UPDATE USING (auth.uid() = user_id);

-- PARTIE 8: Ajouter récompenses de base
INSERT INTO rewards (title, description, points_cost, reward_type, value, is_active)
VALUES
  ('Réduction 5%', 'Obtenez 5% de réduction', 500, 'discount', 5, true),
  ('Réduction 10%', 'Obtenez 10% de réduction', 1000, 'discount', 10, true),
  ('Livraison Gratuite', 'Livraison gratuite', 750, 'free_shipping', 2500, true),
  ('Bon 1000 FCFA', 'Bon d''achat de 1000 FCFA', 500, 'gift', 1000, true),
  ('Bon 5000 FCFA', 'Bon d''achat de 5000 FCFA', 2200, 'gift', 5000, true)
ON CONFLICT (id) DO NOTHING;

-- PARTIE 9: Activer les produits
UPDATE products SET is_active = true WHERE created_at > NOW() - INTERVAL '24 hours';

-- PARTIE 10: Corriger name NULL
UPDATE products SET name = COALESCE(name, title, 'Produit') WHERE name IS NULL OR name = '';

-- PARTIE 11: Forcer mise à jour cache
UPDATE products SET updated_at = NOW();

-- Vérification
SELECT 'Total produits actifs: ' || COUNT(*)::text FROM products WHERE is_active = true;
SELECT 'Total récompenses: ' || COUNT(*)::text FROM rewards WHERE is_active = true;
```

### **ÉTAPE 2: Redémarrer l'App** (1 minute)

Dans le terminal:

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer avec cache vidé:
npm start -- --clear
```

---

## ✅ Résultat Attendu

Après ces 2 étapes:

✅ **Explorer** - Les produits s'affichent
✅ **Favorites** - Les favoris chargent sans erreur
✅ **Rewards Shop** - La boutique de récompenses fonctionne
✅ **Shop Pages** - Les logos de boutiques s'affichent
✅ **Aucune erreur** "column does not exist" ou "table does not exist"

---

## 🆘 Si Problème Persiste

Si vous voyez encore des erreurs après ces 2 étapes:

1. **Vérifiez que le SQL a bien été exécuté**:
   - Allez dans Supabase → Table Editor
   - Vérifiez que les tables `rewards`, `loyalty_points`, `claimed_rewards` existent

2. **Vérifiez les colonnes**:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name LIKE '%shop%';
   ```

3. **Envoyez-moi l'erreur exacte** de la console avec le stack trace complet

---

## 📁 Fichiers Créés

- **[FIX_TOUTES_TABLES_MANQUANTES.sql](FIX_TOUTES_TABLES_MANQUANTES.sql)** - Script complet
- **[DEMARRAGE_IMMEDIAT.md](DEMARRAGE_IMMEDIAT.md)** - Ce guide

---

**Date**: 2026-01-11
**Status**: Prêt à exécuter
**Durée estimée**: 5 minutes
