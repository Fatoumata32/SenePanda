/*
  # Système de Promos Flash & Deals du Jour

  Fonctionnalités:
  - Promotions à durée limitée avec compte à rebours
  - Deals du jour automatiques
  - Stock limité pour créer l'urgence
  - Historique des deals
  - Notifications aux utilisateurs
*/

-- Type ENUM pour le statut des promotions
CREATE TYPE deal_status AS ENUM ('scheduled', 'active', 'expired', 'cancelled');
CREATE TYPE deal_type AS ENUM ('flash_sale', 'daily_deal', 'weekend_special', 'seasonal');

-- Table des promotions flash
CREATE TABLE IF NOT EXISTS flash_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Produit concerné
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Type et statut
  deal_type deal_type DEFAULT 'flash_sale',
  status deal_status DEFAULT 'scheduled',

  -- Prix
  original_price numeric NOT NULL,
  deal_price numeric NOT NULL,
  discount_percentage integer GENERATED ALWAYS AS (
    ROUND(((original_price - deal_price) / original_price * 100)::numeric, 0)::integer
  ) STORED,

  -- Période
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,

  -- Stock limité pour créer l'urgence
  total_stock integer NOT NULL,
  claimed_count integer DEFAULT 0,
  remaining_stock integer GENERATED ALWAYS AS (total_stock - claimed_count) STORED,

  -- Visibilité et priorité
  is_featured boolean DEFAULT false,
  priority_order integer DEFAULT 0,

  -- Badge personnalisé
  badge_text text DEFAULT 'PROMO FLASH',
  badge_color text DEFAULT '#EF4444',

  -- Statistiques
  views_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Contraintes
  CONSTRAINT valid_price_range CHECK (deal_price > 0 AND deal_price < original_price),
  CONSTRAINT valid_date_range CHECK (ends_at > starts_at),
  CONSTRAINT valid_stock CHECK (total_stock > 0)
);

-- Table pour les utilisateurs qui ont claim un deal
CREATE TABLE IF NOT EXISTS deal_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES flash_deals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,

  -- Prix réservé
  claimed_price numeric NOT NULL,
  quantity integer DEFAULT 1,

  -- Statut
  is_purchased boolean DEFAULT false,
  purchased_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,

  -- Expiration de la réservation (15 minutes)
  expires_at timestamptz DEFAULT (now() + interval '15 minutes'),

  created_at timestamptz DEFAULT now(),

  -- Un utilisateur ne peut claim qu'une fois par deal
  UNIQUE(deal_id, user_id)
);

-- Table pour notifier les utilisateurs intéressés
CREATE TABLE IF NOT EXISTS deal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES flash_deals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Type de notification
  notification_type text CHECK (notification_type IN ('deal_starting', 'deal_ending', 'stock_low')),

  -- État
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  is_read boolean DEFAULT false,
  read_at timestamptz,

  created_at timestamptz DEFAULT now(),

  UNIQUE(deal_id, user_id, notification_type)
);

-- Table historique des deals passés
CREATE TABLE IF NOT EXISTS deal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES flash_deals(id) ON DELETE SET NULL,
  product_id uuid,
  seller_id uuid,

  -- Résultats
  original_price numeric,
  deal_price numeric,
  total_stock integer,
  claimed_count integer,
  purchased_count integer,
  total_revenue numeric,

  -- Performance
  conversion_rate numeric, -- claimed_count / views_count
  sell_through_rate numeric, -- claimed_count / total_stock

  -- Période
  started_at timestamptz,
  ended_at timestamptz,
  duration_hours numeric,

  created_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_flash_deals_status ON flash_deals(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller ON flash_deals(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_flash_deals_product ON flash_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_featured ON flash_deals(is_featured, priority_order DESC);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active ON flash_deals(status, ends_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_deal_claims_user ON deal_claims(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_claims_deal ON deal_claims(deal_id, is_purchased);
CREATE INDEX IF NOT EXISTS idx_deal_notifications_user ON deal_notifications(user_id, is_read, created_at DESC);

-- RLS Policies
ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_history ENABLE ROW LEVEL SECURITY;

-- Flash deals : Visibles par tous (actifs), créés/modifiés par vendeurs
CREATE POLICY "Everyone can view active deals"
  ON flash_deals FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Sellers can create own deals"
  ON flash_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own deals"
  ON flash_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own deals"
  ON flash_deals FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Deal claims : Visible par l'utilisateur et le vendeur
CREATE POLICY "Users can view own claims"
  ON deal_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims"
  ON deal_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims"
  ON deal_claims FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deal notifications : Visible uniquement par le destinataire
CREATE POLICY "Users can view own notifications"
  ON deal_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON deal_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deal history : Visible par tous pour transparence
CREATE POLICY "Everyone can view deal history"
  ON deal_history FOR SELECT
  USING (true);

-- Fonction pour obtenir les deals actifs avec détails produit
CREATE OR REPLACE FUNCTION get_active_deals()
RETURNS TABLE (
  deal_id uuid,
  product_id uuid,
  product_title text,
  product_image text,
  seller_id uuid,
  seller_name text,
  deal_type deal_type,
  original_price numeric,
  deal_price numeric,
  discount_percentage integer,
  starts_at timestamptz,
  ends_at timestamptz,
  time_remaining interval,
  total_stock integer,
  remaining_stock integer,
  is_featured boolean,
  badge_text text,
  badge_color text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as deal_id,
    p.id as product_id,
    p.title as product_title,
    p.image_url as product_image,
    d.seller_id,
    COALESCE(prof.shop_name, prof.full_name, 'Vendeur') as seller_name,
    d.deal_type,
    d.original_price,
    d.deal_price,
    d.discount_percentage,
    d.starts_at,
    d.ends_at,
    (d.ends_at - now()) as time_remaining,
    d.total_stock,
    d.remaining_stock,
    d.is_featured,
    d.badge_text,
    d.badge_color
  FROM flash_deals d
  JOIN products p ON p.id = d.product_id
  JOIN profiles prof ON prof.id = d.seller_id
  WHERE d.status = 'active'
    AND d.starts_at <= now()
    AND d.ends_at > now()
    AND d.remaining_stock > 0
  ORDER BY d.is_featured DESC, d.priority_order DESC, d.remaining_stock ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour claim un deal
CREATE OR REPLACE FUNCTION claim_flash_deal(
  p_deal_id uuid,
  p_user_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS uuid AS $$
DECLARE
  v_claim_id uuid;
  v_deal flash_deals%ROWTYPE;
  v_product_id uuid;
  v_claimed_price numeric;
BEGIN
  -- Récupérer les infos du deal
  SELECT * INTO v_deal
  FROM flash_deals
  WHERE id = p_deal_id
  FOR UPDATE; -- Lock pour éviter race condition

  -- Vérifications
  IF v_deal.id IS NULL THEN
    RAISE EXCEPTION 'Deal non trouvé';
  END IF;

  IF v_deal.status != 'active' THEN
    RAISE EXCEPTION 'Ce deal n''est plus actif';
  END IF;

  IF v_deal.starts_at > now() THEN
    RAISE EXCEPTION 'Ce deal n''a pas encore commencé';
  END IF;

  IF v_deal.ends_at <= now() THEN
    RAISE EXCEPTION 'Ce deal est terminé';
  END IF;

  IF v_deal.remaining_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuffisant (reste: %)', v_deal.remaining_stock;
  END IF;

  -- Vérifier si l'utilisateur a déjà claim
  IF EXISTS (
    SELECT 1 FROM deal_claims
    WHERE deal_id = p_deal_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà réservé ce deal';
  END IF;

  -- Créer le claim
  INSERT INTO deal_claims (
    deal_id,
    user_id,
    product_id,
    claimed_price,
    quantity
  ) VALUES (
    p_deal_id,
    p_user_id,
    v_deal.product_id,
    v_deal.deal_price,
    p_quantity
  )
  RETURNING id INTO v_claim_id;

  -- Incrémenter le compteur
  UPDATE flash_deals
  SET claimed_count = claimed_count + p_quantity
  WHERE id = p_deal_id;

  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les statuts des deals (à appeler périodiquement)
CREATE OR REPLACE FUNCTION update_deal_statuses()
RETURNS void AS $$
BEGIN
  -- Activer les deals qui commencent
  UPDATE flash_deals
  SET status = 'active', updated_at = now()
  WHERE status = 'scheduled'
    AND starts_at <= now();

  -- Expirer les deals terminés
  UPDATE flash_deals
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND (ends_at <= now() OR remaining_stock <= 0);

  -- Nettoyer les réservations expirées
  DELETE FROM deal_claims
  WHERE is_purchased = false
    AND expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour archiver un deal dans l'historique
CREATE OR REPLACE FUNCTION archive_expired_deal(p_deal_id uuid)
RETURNS void AS $$
DECLARE
  v_deal flash_deals%ROWTYPE;
  v_purchased_count integer;
  v_total_revenue numeric;
BEGIN
  SELECT * INTO v_deal FROM flash_deals WHERE id = p_deal_id;

  IF v_deal.id IS NULL THEN
    RETURN;
  END IF;

  -- Compter les achats réels
  SELECT
    COUNT(*),
    SUM(claimed_price * quantity)
  INTO v_purchased_count, v_total_revenue
  FROM deal_claims
  WHERE deal_id = p_deal_id AND is_purchased = true;

  -- Insérer dans l'historique
  INSERT INTO deal_history (
    deal_id,
    product_id,
    seller_id,
    original_price,
    deal_price,
    total_stock,
    claimed_count,
    purchased_count,
    total_revenue,
    conversion_rate,
    sell_through_rate,
    started_at,
    ended_at,
    duration_hours
  ) VALUES (
    v_deal.id,
    v_deal.product_id,
    v_deal.seller_id,
    v_deal.original_price,
    v_deal.deal_price,
    v_deal.total_stock,
    v_deal.claimed_count,
    v_purchased_count,
    COALESCE(v_total_revenue, 0),
    CASE WHEN v_deal.views_count > 0
      THEN ROUND((v_deal.claimed_count::numeric / v_deal.views_count::numeric * 100), 2)
      ELSE 0
    END,
    ROUND((v_deal.claimed_count::numeric / v_deal.total_stock::numeric * 100), 2),
    v_deal.starts_at,
    v_deal.ends_at,
    EXTRACT(EPOCH FROM (v_deal.ends_at - v_deal.starts_at)) / 3600
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les deals d'un vendeur
CREATE OR REPLACE FUNCTION get_seller_deals(p_seller_id uuid)
RETURNS TABLE (
  deal_id uuid,
  product_title text,
  status deal_status,
  deal_price numeric,
  discount_percentage integer,
  starts_at timestamptz,
  ends_at timestamptz,
  total_stock integer,
  remaining_stock integer,
  claimed_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id as deal_id,
    p.title as product_title,
    d.status,
    d.deal_price,
    d.discount_percentage,
    d.starts_at,
    d.ends_at,
    d.total_stock,
    d.remaining_stock,
    d.claimed_count
  FROM flash_deals d
  JOIN products p ON p.id = d.product_id
  WHERE d.seller_id = p_seller_id
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nettoyer automatiquement les réservations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_claims()
RETURNS trigger AS $$
BEGIN
  DELETE FROM deal_claims
  WHERE is_purchased = false
    AND expires_at <= now();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_claims
  AFTER INSERT OR UPDATE ON deal_claims
  EXECUTE FUNCTION cleanup_expired_claims();

-- Insertion de deals de démonstration (optionnel, à supprimer en production)
/*
INSERT INTO flash_deals (
  product_id,
  seller_id,
  deal_type,
  status,
  original_price,
  deal_price,
  starts_at,
  ends_at,
  total_stock,
  is_featured,
  badge_text,
  badge_color
)
SELECT
  id as product_id,
  seller_id,
  'flash_sale',
  'active',
  price,
  ROUND(price * 0.7), -- 30% de réduction
  now(),
  now() + interval '24 hours',
  GREATEST(stock / 2, 10), -- La moitié du stock ou 10 minimum
  true,
  'PROMO FLASH -30%',
  '#EF4444'
FROM products
WHERE is_active = true
  AND stock > 10
LIMIT 5;
*/
