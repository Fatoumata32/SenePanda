-- ========================================
-- CRÉATION MINIMALE DES TABLES
-- ========================================
-- Script ultra-simple sans aucune logique complexe
-- ========================================

-- 1. Créer subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'FCFA',
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  max_products INTEGER,
  max_shops INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer user_subscriptions
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

-- 3. Vérifier
SELECT 'subscription_plans' as table_name, COUNT(*) as count FROM subscription_plans
UNION ALL
SELECT 'user_subscriptions' as table_name, COUNT(*) as count FROM user_subscriptions;

-- Si vous voyez ce résultat sans erreur, les tables sont créées !
-- Ensuite exécutez ENABLE_REALTIME_SUBSCRIPTIONS.sql
