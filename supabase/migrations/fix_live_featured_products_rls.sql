-- Fix: Ajouter les policies RLS manquantes pour live_featured_products

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Tout le monde peut voir les produits en vedette" ON live_featured_products;
DROP POLICY IF EXISTS "Les vendeurs peuvent ajouter leurs produits en vedette" ON live_featured_products;
DROP POLICY IF EXISTS "Les vendeurs peuvent modifier leurs produits en vedette" ON live_featured_products;
DROP POLICY IF EXISTS "Les vendeurs peuvent supprimer leurs produits en vedette" ON live_featured_products;
DROP POLICY IF EXISTS "Les vendeurs peuvent voir les commandes de leurs lives" ON live_orders;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des commandes live" ON live_orders;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs commandes live" ON live_orders;

-- Policies pour live_featured_products
CREATE POLICY "Tout le monde peut voir les produits en vedette"
  ON live_featured_products FOR SELECT
  USING (true);

CREATE POLICY "Les vendeurs peuvent ajouter leurs produits en vedette"
  ON live_featured_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = live_featured_products.live_session_id
        AND live_sessions.seller_id = auth.uid()
    )
  );

CREATE POLICY "Les vendeurs peuvent modifier leurs produits en vedette"
  ON live_featured_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = live_featured_products.live_session_id
        AND live_sessions.seller_id = auth.uid()
    )
  );

CREATE POLICY "Les vendeurs peuvent supprimer leurs produits en vedette"
  ON live_featured_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = live_featured_products.live_session_id
        AND live_sessions.seller_id = auth.uid()
    )
  );

-- Policies pour live_orders (également manquantes)
CREATE POLICY "Les vendeurs peuvent voir les commandes de leurs lives"
  ON live_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions
      WHERE live_sessions.id = live_orders.live_session_id
        AND live_sessions.seller_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent créer des commandes live"
  ON live_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent voir leurs commandes live"
  ON live_orders FOR SELECT
  USING (auth.uid() = user_id);
