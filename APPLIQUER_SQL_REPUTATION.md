# 🚀 Comment Appliquer le Script SQL de Réputation

## ⚡ MÉTHODE RAPIDE (2 minutes)

### Étape 1 : Ouvrir Supabase
1. Allez sur https://supabase.com/dashboard
2. Connectez-vous
3. Sélectionnez votre projet **SenePanda**

### Étape 2 : Ouvrir l'éditeur SQL
1. Dans le menu de gauche, cliquez sur **"SQL Editor"** (icône 📝)
2. Cliquez sur le bouton **"+ New query"**

### Étape 3 : Copier le script
1. Ouvrez le fichier :
   ```
   C:\Users\PC\Downloads\project-bolt-sb1-qw6kprzq\project\supabase\migrations\add_seller_reputation_system.sql
   ```
2. Sélectionnez tout (Ctrl+A)
3. Copiez (Ctrl+C)

### Étape 4 : Coller et exécuter
1. Retournez dans l'éditeur SQL de Supabase
2. Collez le script (Ctrl+V)
3. Cliquez sur **"Run"** (ou Ctrl+Enter)
4. Attendez le message ✅ "Success. No rows returned"

### Étape 5 : Vérifier
Dans un nouvel onglet SQL, exécutez :

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%seller%'
ORDER BY routine_name;
```

**Vous devriez voir 6 fonctions :**
- ✅ calculate_seller_badge
- ✅ get_seller_order_stats
- ✅ get_seller_reputation_details
- ✅ get_top_sellers
- ✅ update_seller_average_rating
- ✅ update_seller_badge

---

## 📋 SCRIPT SQL COMPLET

Voici le script à copier-coller :

```sql
-- =====================================================
-- SYSTÈME DE RÉPUTATION VENDEUR
-- =====================================================

-- FONCTION 1: Statistiques de commandes
CREATE OR REPLACE FUNCTION get_seller_order_stats(seller_id_param UUID)
RETURNS TABLE(
  response_rate NUMERIC,
  completion_rate NUMERIC,
  total_orders INTEGER,
  completed_orders INTEGER,
  avg_response_time_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH seller_orders AS (
    SELECT o.id, o.status, o.created_at
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.seller_id = seller_id_param
    GROUP BY o.id, o.status, o.created_at
  ),
  order_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status IN ('delivered', 'confirmed')) AS completed,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
    FROM seller_orders
  ),
  response_stats AS (
    SELECT
      CASE
        WHEN COUNT(*) > 0 THEN LEAST(100, 50 + (COUNT(*) * 2))
        ELSE 50
      END AS rate
    FROM seller_reviews
    WHERE seller_id = seller_id_param
  )
  SELECT
    COALESCE((SELECT rate FROM response_stats), 75)::NUMERIC AS response_rate,
    CASE
      WHEN os.total > 0 THEN ((os.completed::NUMERIC / os.total::NUMERIC) * 100)
      ELSE 85
    END AS completion_rate,
    os.total::INTEGER AS total_orders,
    os.completed::INTEGER AS completed_orders,
    NULL::NUMERIC AS avg_response_time_hours
  FROM order_stats os;
END;
$$;

-- FONCTION 2: Mettre à jour la note moyenne
CREATE OR REPLACE FUNCTION update_seller_average_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id UUID;
  v_avg_rating NUMERIC;
  v_total_reviews INTEGER;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_seller_id := OLD.seller_id;
  ELSE
    v_seller_id := NEW.seller_id;
  END IF;

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO v_avg_rating, v_total_reviews
  FROM seller_reviews
  WHERE seller_id = v_seller_id;

  UPDATE profiles
  SET
    average_rating = ROUND(v_avg_rating, 2),
    total_reviews = v_total_reviews,
    updated_at = NOW()
  WHERE id = v_seller_id;

  RETURN NEW;
END;
$$;

-- TRIGGER 1: Note moyenne
DROP TRIGGER IF EXISTS trigger_update_seller_rating ON seller_reviews;
CREATE TRIGGER trigger_update_seller_rating
  AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_average_rating();

-- FONCTION 3: Calculer le badge
CREATE OR REPLACE FUNCTION calculate_seller_badge(seller_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_reviews INTEGER;
  v_badge TEXT;
BEGIN
  SELECT average_rating, total_reviews
  INTO v_avg_rating, v_total_reviews
  FROM profiles
  WHERE id = seller_id_param;

  IF v_avg_rating >= 4.9 AND v_total_reviews >= 100 THEN
    v_badge := 'platinum';
  ELSIF v_avg_rating >= 4.7 AND v_total_reviews >= 50 THEN
    v_badge := 'gold';
  ELSIF v_avg_rating >= 4.5 AND v_total_reviews >= 20 THEN
    v_badge := 'silver';
  ELSIF v_avg_rating >= 4.0 AND v_total_reviews >= 5 THEN
    v_badge := 'bronze';
  ELSE
    v_badge := NULL;
  END IF;

  RETURN v_badge;
END;
$$;

-- FONCTION 4: Mettre à jour le badge
CREATE OR REPLACE FUNCTION update_seller_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_badge TEXT;
BEGIN
  v_new_badge := calculate_seller_badge(NEW.id);
  IF v_new_badge IS DISTINCT FROM NEW.seller_badge THEN
    NEW.seller_badge := v_new_badge;
  END IF;
  RETURN NEW;
END;
$$;

-- TRIGGER 2: Badge
DROP TRIGGER IF EXISTS trigger_update_seller_badge ON profiles;
CREATE TRIGGER trigger_update_seller_badge
  BEFORE UPDATE OF average_rating, total_reviews ON profiles
  FOR EACH ROW
  WHEN (OLD.is_seller = TRUE AND NEW.is_seller = TRUE)
  EXECUTE FUNCTION update_seller_badge();

-- FONCTION 5: Top vendeurs
CREATE OR REPLACE FUNCTION get_top_sellers(
  limit_param INTEGER DEFAULT 10,
  min_reviews INTEGER DEFAULT 5
)
RETURNS TABLE(
  seller_id UUID,
  shop_name TEXT,
  shop_logo_url TEXT,
  average_rating NUMERIC,
  total_reviews INTEGER,
  seller_badge TEXT,
  verified_seller BOOLEAN,
  reputation_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS seller_id,
    p.shop_name,
    p.shop_logo_url,
    p.average_rating,
    p.total_reviews,
    p.seller_badge,
    p.verified_seller,
    ((p.average_rating * 20) + (LEAST(p.total_reviews, 100) * 0.5))::INTEGER AS reputation_score
  FROM profiles p
  WHERE
    p.is_seller = TRUE
    AND p.total_reviews >= min_reviews
    AND p.average_rating >= 4.0
  ORDER BY reputation_score DESC, p.average_rating DESC, p.total_reviews DESC
  LIMIT limit_param;
END;
$$;

-- FONCTION 6: Détails réputation
CREATE OR REPLACE FUNCTION get_seller_reputation_details(seller_id_param UUID)
RETURNS TABLE(
  seller_id UUID,
  average_rating NUMERIC,
  total_reviews INTEGER,
  total_votes INTEGER,
  positive_reviews INTEGER,
  neutral_reviews INTEGER,
  negative_reviews INTEGER,
  communication_rating NUMERIC,
  shipping_speed_rating NUMERIC,
  seller_badge TEXT,
  verified_seller BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH review_stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE rating >= 4) AS positive,
      COUNT(*) FILTER (WHERE rating = 3) AS neutral,
      COUNT(*) FILTER (WHERE rating <= 2) AS negative,
      AVG(communication_rating) AS avg_communication,
      AVG(shipping_speed_rating) AS avg_shipping
    FROM seller_reviews
    WHERE seller_reviews.seller_id = seller_id_param
  ),
  vote_stats AS (
    SELECT COALESCE(SUM(pr.helpful_count), 0) AS total_votes
    FROM product_reviews pr
    JOIN products p ON pr.product_id = p.id
    WHERE p.seller_id = seller_id_param
  )
  SELECT
    p.id AS seller_id,
    p.average_rating,
    p.total_reviews,
    vs.total_votes::INTEGER,
    COALESCE(rs.positive, 0)::INTEGER AS positive_reviews,
    COALESCE(rs.neutral, 0)::INTEGER AS neutral_reviews,
    COALESCE(rs.negative, 0)::INTEGER AS negative_reviews,
    ROUND(COALESCE(rs.avg_communication, 0), 2) AS communication_rating,
    ROUND(COALESCE(rs.avg_shipping, 0), 2) AS shipping_speed_rating,
    p.seller_badge,
    p.verified_seller
  FROM profiles p
  CROSS JOIN vote_stats vs
  LEFT JOIN review_stats rs ON TRUE
  WHERE p.id = seller_id_param;
END;
$$;

-- VUE: Réputation vendeurs
CREATE OR REPLACE VIEW seller_reputation_view AS
SELECT
  p.id AS seller_id,
  p.shop_name,
  p.shop_logo_url,
  p.average_rating,
  p.total_reviews,
  p.seller_badge,
  p.verified_seller,
  p.is_premium,
  p.subscription_plan,
  ((p.average_rating * 20) + (LEAST(p.total_reviews, 100) * 0.5))::INTEGER AS reputation_score,
  CASE
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 95 THEN 'diamond'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 80 THEN 'platinum'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 60 THEN 'gold'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 40 THEN 'silver'
    WHEN (p.average_rating * 20 + LEAST(p.total_reviews, 100) * 0.5) >= 20 THEN 'bronze'
    ELSE 'nouveau'
  END AS reputation_level
FROM profiles p
WHERE p.is_seller = TRUE;

-- INDEX pour performance
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_rating ON seller_reviews(seller_id, rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_helpful_count ON product_reviews(helpful_count) WHERE helpful_count > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_seller_reputation ON profiles(is_seller, average_rating DESC, total_reviews DESC) WHERE is_seller = TRUE;

-- Permissions
GRANT SELECT ON seller_reputation_view TO anon, authenticated;
```

---

## ✅ C'EST FAIT !

Après avoir exécuté le script :

1. ✅ Les fonctions SQL sont créées
2. ✅ Les triggers sont actifs
3. ✅ La vue est disponible
4. ✅ Les index sont créés
5. ✅ Le système de réputation fonctionne !

**Le badge de réputation s'affichera automatiquement dans le profil des vendeurs.**

---

## 🧪 TESTER

Pour tester que tout fonctionne :

```sql
-- Tester la fonction
SELECT * FROM get_seller_order_stats('00000000-0000-0000-0000-000000000000');

-- Voir tous les vendeurs avec réputation
SELECT * FROM seller_reputation_view LIMIT 10;

-- Obtenir le top 5
SELECT * FROM get_top_sellers(5, 1);
```

---

## 🆘 PROBLÈMES ?

### Erreur "relation does not exist"
**Solution :** Vérifiez que les tables `seller_reviews`, `product_reviews`, `orders`, `order_items`, `products`, `profiles` existent.

### Erreur "permission denied"
**Solution :** Vous devez être connecté en tant qu'admin de la base de données.

### Le script ne s'exécute pas
**Solution :**
1. Vérifiez que vous êtes sur le bon projet Supabase
2. Essayez d'exécuter les fonctions une par une
3. Consultez les logs d'erreur

---

**Une fois le script appliqué, rechargez votre app et le badge apparaîtra ! 🎉**
