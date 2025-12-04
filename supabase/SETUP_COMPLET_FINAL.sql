-- ========================================
-- SETUP COMPLET FINAL - UN SEUL SCRIPT
-- ========================================
-- Ce script configure TOUT automatiquement
-- S'adapte à votre structure existante
-- SAFE TO RUN - Peut être exécuté plusieurs fois
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 SETUP COMPLET - SYNCHRONISATION AUTO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ========================================
-- PARTIE 1 : CORRIGER subscription_plans
-- ========================================

-- 1.1 Supprimer la contrainte NOT NULL sur max_products si elle existe
DO $$
BEGIN
  -- Permettre NULL dans max_products (pour "illimité")
  BEGIN
    ALTER TABLE subscription_plans ALTER COLUMN max_products DROP NOT NULL;
    RAISE NOTICE '✅ Contrainte NOT NULL sur max_products supprimée';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE '⚠️  max_products permet déjà NULL ou n''existe pas';
  END;
END $$;

-- 1.2 Ajouter les colonnes manquantes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'price') THEN
    ALTER TABLE subscription_plans ADD COLUMN price DECIMAL(10, 2);
    RAISE NOTICE '✅ Colonne price ajoutée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'currency') THEN
    ALTER TABLE subscription_plans ADD COLUMN currency TEXT DEFAULT 'FCFA';
    RAISE NOTICE '✅ Colonne currency ajoutée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'duration_days') THEN
    ALTER TABLE subscription_plans ADD COLUMN duration_days INTEGER DEFAULT 30;
    RAISE NOTICE '✅ Colonne duration_days ajoutée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'max_products') THEN
    ALTER TABLE subscription_plans ADD COLUMN max_products INTEGER;
    RAISE NOTICE '✅ Colonne max_products ajoutée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'max_shops') THEN
    ALTER TABLE subscription_plans ADD COLUMN max_shops INTEGER DEFAULT 1;
    RAISE NOTICE '✅ Colonne max_shops ajoutée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'features') THEN
    ALTER TABLE subscription_plans ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne features ajoutée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'is_active') THEN
    ALTER TABLE subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Colonne is_active ajoutée';
  END IF;
END $$;

-- 1.3 Mettre à jour les plans existants
DO $$
BEGIN
  -- Plan Starter
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'starter') THEN
    UPDATE subscription_plans
    SET
      price = COALESCE(price, 5000.00),
      currency = COALESCE(currency, 'FCFA'),
      duration_days = COALESCE(duration_days, 30),
      max_products = 10,
      max_shops = COALESCE(max_shops, 1),
      features = COALESCE(features, '["Jusqu''à 10 produits", "1 boutique", "Support par email"]'::jsonb),
      is_active = COALESCE(is_active, true)
    WHERE LOWER(name) = 'starter';
    RAISE NOTICE '✅ Plan Starter mis à jour';
  ELSE
    INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
    VALUES ('Starter', 'Plan de démarrage', 5000.00, 'FCFA', 30, 10, 1, '["Jusqu''à 10 produits", "1 boutique"]'::jsonb, true);
    RAISE NOTICE '✅ Plan Starter créé';
  END IF;

  -- Plan Premium (NULL pour illimité)
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'premium') THEN
    UPDATE subscription_plans
    SET
      price = COALESCE(price, 15000.00),
      currency = COALESCE(currency, 'FCFA'),
      duration_days = COALESCE(duration_days, 30),
      max_products = NULL, -- NULL = illimité
      max_shops = COALESCE(max_shops, 3),
      features = COALESCE(features, '["Produits illimités", "3 boutiques", "Support prioritaire"]'::jsonb),
      is_active = COALESCE(is_active, true)
    WHERE LOWER(name) = 'premium';
    RAISE NOTICE '✅ Plan Premium mis à jour (produits illimités)';
  ELSE
    INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
    VALUES ('Premium', 'Plan complet', 15000.00, 'FCFA', 30, NULL, 3, '["Produits illimités", "3 boutiques"]'::jsonb, true);
    RAISE NOTICE '✅ Plan Premium créé';
  END IF;

  -- Plan Business
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'business') THEN
    UPDATE subscription_plans
    SET
      price = COALESCE(price, 50000.00),
      currency = COALESCE(currency, 'FCFA'),
      duration_days = COALESCE(duration_days, 30),
      max_products = NULL, -- NULL = illimité
      max_shops = COALESCE(max_shops, 10),
      features = COALESCE(features, '["Tout Premium", "10 boutiques", "Support 24/7"]'::jsonb),
      is_active = COALESCE(is_active, true)
    WHERE LOWER(name) = 'business';
    RAISE NOTICE '✅ Plan Business mis à jour (produits illimités)';
  ELSE
    INSERT INTO subscription_plans (name, description, price, currency, duration_days, max_products, max_shops, features, is_active)
    VALUES ('Business', 'Solution professionnelle', 50000.00, 'FCFA', 30, NULL, 10, '["Tout Premium", "10 boutiques"]'::jsonb, true);
    RAISE NOTICE '✅ Plan Business créé';
  END IF;
END $$;

-- ========================================
-- PARTIE 2 : CRÉER user_subscriptions
-- ========================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  payment_proof_url TEXT,
  is_approved BOOLEAN DEFAULT NULL,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  -- Ajouter colonnes manquantes si table existait
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'is_approved') THEN
    ALTER TABLE user_subscriptions ADD COLUMN is_approved BOOLEAN DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'approved_by') THEN
    ALTER TABLE user_subscriptions ADD COLUMN approved_by UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'approved_at') THEN
    ALTER TABLE user_subscriptions ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'payment_proof_url') THEN
    ALTER TABLE user_subscriptions ADD COLUMN payment_proof_url TEXT;
  END IF;

  RAISE NOTICE '✅ Table user_subscriptions prête';
END $$;

-- ========================================
-- PARTIE 3 : INDEX DE PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status) WHERE status IN ('pending', 'active');

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- ========================================
-- PARTIE 4 : ROW LEVEL SECURITY
-- ========================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Policy pour subscription_plans
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Anyone can view active plans') THEN
    CREATE POLICY "Anyone can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);
  END IF;

  -- Policies pour user_subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users view own subscriptions') THEN
    CREATE POLICY "Users view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users create own subscriptions') THEN
    CREATE POLICY "Users create own subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_subscriptions' AND policyname = 'Users update own subscriptions') THEN
    CREATE POLICY "Users update own subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  RAISE NOTICE '✅ Policies RLS configurées';
END $$;

-- ========================================
-- PARTIE 5 : ACTIVER REALTIME
-- ========================================

DO $$
BEGIN
  -- Créer publication si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
    RAISE NOTICE '✅ Publication supabase_realtime créée';
  END IF;

  -- Ajouter user_subscriptions à la publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;
    RAISE NOTICE '✅ user_subscriptions ajouté à Realtime';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️  user_subscriptions déjà dans Realtime';
  END;
END $$;

-- Index pour Realtime
CREATE INDEX IF NOT EXISTS idx_user_subs_realtime ON user_subscriptions(user_id, status) WHERE status IN ('pending', 'active');

-- ========================================
-- RÉSUMÉ FINAL
-- ========================================

DO $$
DECLARE
  v_plans_count INTEGER;
  v_subs_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plans_count FROM subscription_plans;
  SELECT COUNT(*) INTO v_subs_count FROM user_subscriptions;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP TERMINÉ AVEC SUCCÈS !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Configuration complète :';
  RAISE NOTICE '  ✓ subscription_plans : % plan(s)', v_plans_count;
  RAISE NOTICE '  ✓ user_subscriptions : % abonnement(s)', v_subs_count;
  RAISE NOTICE '  ✓ Realtime : Activé';
  RAISE NOTICE '  ✓ RLS : Configuré';
  RAISE NOTICE '  ✓ Index : Créés';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaine étape :';
  RAISE NOTICE '  → Redémarrer l''app : npx expo start --clear';
  RAISE NOTICE '  → Tester la synchronisation';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- Afficher les plans configurés
SELECT
  name,
  COALESCE(price::TEXT, 'N/A') || ' ' || COALESCE(currency, 'FCFA') as prix,
  COALESCE(duration_days::TEXT, '30') || ' jours' as duree,
  CASE WHEN max_products IS NULL THEN 'Illimité' ELSE max_products::TEXT END as produits,
  COALESCE(max_shops::TEXT, '1') as boutiques,
  COALESCE(is_active, true) as actif
FROM subscription_plans
ORDER BY COALESCE(price, 0);

-- ========================================
-- FIN DU SCRIPT
-- ========================================
