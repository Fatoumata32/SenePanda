/*
  # Système de Plans d'Abonnement pour Vendeurs

  Ce système offre 4 plans d'abonnement avec des avantages progressifs:

  1. GRATUIT (Free)
     - Commission: 20%
     - 5 produits maximum
     - Photos standard
     - Aucune mise en avant

  2. STARTER (Débutant) - 5,000 XOF/mois
     - Commission: 15%
     - 25 produits maximum
     - Photos HD
     - Badge "Vendeur Vérifié"
     - Apparition occasionnelle en page d'accueil
     - Support prioritaire

  3. PRO (Professionnel) - 15,000 XOF/mois
     - Commission: 10%
     - 100 produits maximum
     - Photos HD + Vidéos
     - Badge "Vendeur Pro"
     - Mise en avant régulière (rotation toutes les 2 heures)
     - Boost de visibilité +50%
     - Support prioritaire VIP
     - Statistiques avancées

  4. PREMIUM (Elite) - 30,000 XOF/mois
     - Commission: 7%
     - Produits illimités
     - Photos HD + Vidéos + 360°
     - Badge "Vendeur Elite"
     - Position premium permanente
     - Boost de visibilité +100%
     - Concierge dédié 24/7
     - Statistiques avancées + Analytics IA
     - Campagnes marketing sponsorisées
*/

-- Types ENUM pour les plans
DO $$ BEGIN
  CREATE TYPE subscription_plan_type AS ENUM ('free', 'starter', 'pro', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table des définitions de plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan_type NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL CHECK (price_monthly >= 0),
  currency text DEFAULT 'XOF',

  -- Avantages commerciaux
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  max_products integer NOT NULL CHECK (max_products > 0),

  -- Avantages de visibilité
  visibility_boost integer DEFAULT 0 CHECK (visibility_boost >= 0),
  featured_rotation_hours integer, -- null = pas de rotation automatique
  homepage_spots integer DEFAULT 0, -- nombre de slots sur la page d'accueil
  priority_in_search integer DEFAULT 0 CHECK (priority_in_search >= 0), -- boost dans les résultats de recherche

  -- Fonctionnalités média
  hd_photos boolean DEFAULT false,
  video_allowed boolean DEFAULT false,
  photo_360_allowed boolean DEFAULT false,
  max_photos_per_product integer DEFAULT 5,

  -- Badges et certifications
  badge_name text,
  verified_badge boolean DEFAULT false,

  -- Support et services
  support_level text, -- 'standard', 'priority', 'vip', 'concierge'
  advanced_analytics boolean DEFAULT false,
  ai_analytics boolean DEFAULT false,
  sponsored_campaigns boolean DEFAULT false,

  -- Metadata
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements des vendeurs
CREATE TABLE IF NOT EXISTS seller_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  plan_type subscription_plan_type NOT NULL,

  -- Informations d'abonnement
  status subscription_status DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,

  -- Facturation
  amount_paid numeric,
  currency text DEFAULT 'XOF',
  payment_method text,
  transaction_id text,

  -- Renouvellement automatique
  auto_renew boolean DEFAULT true,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(seller_id, plan_type)
);

-- Table des rotations de mise en avant
CREATE TABLE IF NOT EXISTS featured_products_rotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type subscription_plan_type NOT NULL,

  -- Slot de rotation
  rotation_slot integer NOT NULL, -- 1-12 pour les différentes rotations de la journée
  priority integer DEFAULT 0,

  -- Période d'affichage
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,

  -- Statistiques
  views_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

-- Table de l'historique des abonnements
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type subscription_plan_type NOT NULL,
  action text NOT NULL, -- 'activated', 'renewed', 'cancelled', 'expired', 'upgraded', 'downgraded'
  old_plan_type subscription_plan_type,
  new_plan_type subscription_plan_type,
  amount_paid numeric,
  currency text DEFAULT 'XOF',
  created_at timestamptz DEFAULT now()
);

-- Insertion des plans par défaut
INSERT INTO subscription_plans (
  plan_type, name, description, price_monthly, commission_rate, max_products,
  visibility_boost, featured_rotation_hours, homepage_spots, priority_in_search,
  hd_photos, video_allowed, photo_360_allowed, max_photos_per_product,
  badge_name, verified_badge, support_level, advanced_analytics, ai_analytics,
  sponsored_campaigns, display_order
) VALUES
  (
    'free', 'Gratuit',
    'Idéal pour commencer à vendre sur la plateforme',
    0, 20, 5,
    0, null, 0, 0,
    false, false, false, 5,
    null, false, 'standard', false, false, false, 1
  ),
  (
    'starter', 'Starter',
    'Pour les vendeurs qui démarrent leur activité',
    5000, 15, 25,
    20, 24, 1, 10,
    true, false, false, 10,
    'Vendeur Vérifié', true, 'priority', false, false, false, 2
  ),
  (
    'pro', 'Pro',
    'Pour les vendeurs professionnels établis',
    15000, 10, 100,
    50, 2, 3, 30,
    true, true, false, 15,
    'Vendeur Pro', true, 'vip', true, false, false, 3
  ),
  (
    'premium', 'Premium',
    'Pour les vendeurs d''élite à fort volume',
    30000, 7, 999999,
    100, null, 5, 50,
    true, true, true, 30,
    'Vendeur Elite', true, 'concierge', true, true, true, 4
  )
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  commission_rate = EXCLUDED.commission_rate,
  max_products = EXCLUDED.max_products,
  visibility_boost = EXCLUDED.visibility_boost,
  featured_rotation_hours = EXCLUDED.featured_rotation_hours,
  homepage_spots = EXCLUDED.homepage_spots,
  priority_in_search = EXCLUDED.priority_in_search,
  hd_photos = EXCLUDED.hd_photos,
  video_allowed = EXCLUDED.video_allowed,
  photo_360_allowed = EXCLUDED.photo_360_allowed,
  max_photos_per_product = EXCLUDED.max_photos_per_product,
  badge_name = EXCLUDED.badge_name,
  verified_badge = EXCLUDED.verified_badge,
  support_level = EXCLUDED.support_level,
  advanced_analytics = EXCLUDED.advanced_analytics,
  ai_analytics = EXCLUDED.ai_analytics,
  sponsored_campaigns = EXCLUDED.sponsored_campaigns,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- Ajouter les colonnes d'abonnement à la table profiles si elles n'existent pas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan_type DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_auto_renew boolean DEFAULT false;

-- Indexes pour la performance
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_seller_id ON seller_subscriptions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_status ON seller_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_seller_subscriptions_expires_at ON seller_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_featured_products_rotation_times ON featured_products_rotation(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_featured_products_rotation_product ON featured_products_rotation(product_id);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_products_rotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Les plans sont visibles par tous
CREATE POLICY "Subscription plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Les vendeurs peuvent voir leur propre abonnement
CREATE POLICY "Sellers can view own subscription"
  ON seller_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Les vendeurs peuvent créer leur propre abonnement
CREATE POLICY "Sellers can create own subscription"
  ON seller_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Les vendeurs peuvent mettre à jour leur propre abonnement
CREATE POLICY "Sellers can update own subscription"
  ON seller_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Les rotations de produits sont visibles par tous
CREATE POLICY "Featured rotations are viewable by everyone"
  ON featured_products_rotation FOR SELECT
  TO authenticated, anon
  USING (true);

-- Les vendeurs peuvent voir leur historique
CREATE POLICY "Sellers can view own subscription history"
  ON subscription_history FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Fonction pour vérifier si un vendeur peut ajouter un produit
CREATE OR REPLACE FUNCTION can_add_product(seller_uuid uuid)
RETURNS boolean AS $$
DECLARE
  current_plan subscription_plan_type;
  product_count integer;
  max_allowed integer;
BEGIN
  -- Récupérer le plan actuel du vendeur
  SELECT subscription_plan INTO current_plan
  FROM profiles
  WHERE id = seller_uuid;

  -- Si pas de plan, considérer comme 'free'
  IF current_plan IS NULL THEN
    current_plan := 'free';
  END IF;

  -- Compter les produits actifs du vendeur
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE seller_id = seller_uuid AND is_active = true;

  -- Récupérer la limite du plan
  SELECT max_products INTO max_allowed
  FROM subscription_plans
  WHERE plan_type = current_plan;

  -- Retourner si le vendeur peut ajouter un produit
  RETURN product_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les avantages du plan d'un vendeur
CREATE OR REPLACE FUNCTION get_seller_plan_benefits(seller_uuid uuid)
RETURNS TABLE (
  plan_type subscription_plan_type,
  commission_rate numeric,
  max_products integer,
  current_products integer,
  visibility_boost integer,
  can_add_more_products boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.plan_type,
    sp.commission_rate,
    sp.max_products,
    (SELECT COUNT(*)::integer FROM products WHERE seller_id = seller_uuid AND is_active = true) as current_products,
    sp.visibility_boost,
    can_add_product(seller_uuid) as can_add_more_products
  FROM subscription_plans sp
  INNER JOIN profiles p ON p.subscription_plan = sp.plan_type
  WHERE p.id = seller_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le plan d'un vendeur
CREATE OR REPLACE FUNCTION upgrade_seller_plan(
  seller_uuid uuid,
  new_plan subscription_plan_type,
  payment_amount numeric,
  payment_transaction_id text
)
RETURNS void AS $$
DECLARE
  old_plan subscription_plan_type;
  plan_id_var uuid;
  expires_date timestamptz;
BEGIN
  -- Récupérer le plan actuel
  SELECT subscription_plan INTO old_plan
  FROM profiles
  WHERE id = seller_uuid;

  -- Récupérer l'ID du nouveau plan
  SELECT id INTO plan_id_var
  FROM subscription_plans
  WHERE plan_type = new_plan;

  -- Calculer la date d'expiration (30 jours)
  expires_date := now() + interval '30 days';

  -- Mettre à jour le profil
  UPDATE profiles
  SET
    subscription_plan = new_plan,
    subscription_expires_at = expires_date,
    subscription_auto_renew = true,
    updated_at = now()
  WHERE id = seller_uuid;

  -- Annuler les anciens abonnements actifs
  UPDATE seller_subscriptions
  SET
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  WHERE seller_id = seller_uuid AND status = 'active';

  -- Créer un nouvel abonnement
  INSERT INTO seller_subscriptions (
    seller_id, plan_id, plan_type, status,
    expires_at, amount_paid, transaction_id
  ) VALUES (
    seller_uuid, plan_id_var, new_plan, 'active',
    expires_date, payment_amount, payment_transaction_id
  );

  -- Enregistrer dans l'historique
  INSERT INTO subscription_history (
    seller_id, plan_type, action, old_plan_type, new_plan_type, amount_paid
  ) VALUES (
    seller_uuid, new_plan,
    CASE
      WHEN old_plan IS NULL OR old_plan = 'free' THEN 'activated'
      WHEN new_plan > old_plan THEN 'upgraded'
      ELSE 'downgraded'
    END,
    old_plan, new_plan, payment_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour vérifier le nombre de produits avant insertion
CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_add_product(NEW.seller_id) THEN
    RAISE EXCEPTION 'Product limit reached for your subscription plan. Please upgrade to add more products.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_product_limit ON products;
CREATE TRIGGER enforce_product_limit
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_limit();
