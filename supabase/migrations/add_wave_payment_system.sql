-- ============================================
-- Migration: Système de paiement Wave
-- Date: 2025-12-04
-- Description: Tables et fonctions pour gérer les paiements Wave
-- ============================================

-- Table pour stocker les transactions Wave
CREATE TABLE IF NOT EXISTS wave_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wave_transaction_id TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  -- Montant et devise
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF' NOT NULL,

  -- Statut
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'complete', 'succeeded', 'failed', 'cancelled', 'expired')),
  payment_status TEXT GENERATED ALWAYS AS (
    CASE
      WHEN status IN ('complete', 'succeeded') THEN 'paid'
      WHEN status IN ('failed', 'cancelled', 'expired') THEN 'failed'
      ELSE 'pending'
    END
  ) STORED,

  -- Informations client
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  webhook_type TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT wave_transaction_id_format CHECK (wave_transaction_id ~* '^[a-zA-Z0-9_-]+$')
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_wave_transactions_order_id ON wave_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wave_transactions_status ON wave_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wave_transactions_customer_phone ON wave_transactions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_wave_transactions_created_at ON wave_transactions(created_at DESC);

-- Ajouter la colonne wave_transaction_id à la table orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS wave_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Index pour wave_transaction_id
CREATE INDEX IF NOT EXISTS idx_orders_wave_transaction_id ON orders(wave_transaction_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_wave_transaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Si le statut passe à 'succeeded' ou 'complete', définir paid_at
  IF NEW.status IN ('succeeded', 'complete') AND OLD.status NOT IN ('succeeded', 'complete') THEN
    NEW.paid_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_wave_transaction_updated_at ON wave_transactions;
CREATE TRIGGER trigger_update_wave_transaction_updated_at
  BEFORE UPDATE ON wave_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wave_transaction_updated_at();

-- Fonction pour synchroniser le statut de paiement de la commande
CREATE OR REPLACE FUNCTION sync_order_payment_status_from_wave()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le paiement Wave est confirmé
  IF NEW.status IN ('succeeded', 'complete') AND OLD.status NOT IN ('succeeded', 'complete') THEN
    UPDATE orders
    SET
      payment_status = 'paid',
      payment_method = 'wave',
      wave_transaction_id = NEW.wave_transaction_id,
      paid_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.order_id;

    RAISE NOTICE '✅ Commande % marquée comme payée', NEW.order_id;
  END IF;

  -- Si le paiement Wave a échoué
  IF NEW.status IN ('failed', 'cancelled', 'expired') AND OLD.status NOT IN ('failed', 'cancelled', 'expired') THEN
    UPDATE orders
    SET
      payment_status = 'failed',
      payment_method = 'wave',
      wave_transaction_id = NEW.wave_transaction_id,
      updated_at = NOW()
    WHERE id = NEW.order_id;

    RAISE NOTICE '❌ Commande % marquée comme échouée', NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour synchroniser automatiquement
DROP TRIGGER IF EXISTS trigger_sync_order_payment_status_from_wave ON wave_transactions;
CREATE TRIGGER trigger_sync_order_payment_status_from_wave
  AFTER UPDATE ON wave_transactions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_order_payment_status_from_wave();

-- Fonction RPC pour créer une commande avec paiement Wave
CREATE OR REPLACE FUNCTION create_order_with_wave_payment(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_phone TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_postal_code TEXT DEFAULT NULL,
  p_shipping_country TEXT DEFAULT 'Sénégal',
  p_order_notes TEXT DEFAULT NULL,
  p_wave_transaction_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  total_amount DECIMAL,
  requires_payment BOOLEAN
) AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_total_amount DECIMAL;
BEGIN
  -- Appeler la fonction existante pour créer la commande
  SELECT INTO v_order_id, v_order_number, v_total_amount, requires_payment
    * FROM create_order_from_cart(
      p_user_id,
      p_shipping_name,
      p_shipping_phone,
      p_shipping_address,
      p_shipping_city,
      p_shipping_postal_code,
      p_shipping_country,
      p_order_notes,
      'wave' -- payment_method
    );

  -- Si un wave_transaction_id est fourni, l'associer
  IF p_wave_transaction_id IS NOT NULL THEN
    UPDATE orders
    SET wave_transaction_id = p_wave_transaction_id,
        payment_status = 'pending'
    WHERE id = v_order_id;
  END IF;

  RETURN QUERY SELECT v_order_id, v_order_number, v_total_amount, TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE wave_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres transactions via les commandes
CREATE POLICY "Users can view their own wave transactions"
  ON wave_transactions FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE buyer_id = auth.uid()
    )
  );

-- Policy: Les vendeurs peuvent voir les transactions de leurs ventes
CREATE POLICY "Sellers can view their sales wave transactions"
  ON wave_transactions FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE seller_id = auth.uid()
    )
  );

-- Policy: Seuls les webhooks (via service_role) peuvent insérer/modifier
CREATE POLICY "Service role can insert wave transactions"
  ON wave_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update wave transactions"
  ON wave_transactions FOR UPDATE
  USING (auth.role() = 'service_role');

-- Vérification et affichage
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Système de paiement Wave créé!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Tables créées:';
  RAISE NOTICE '   - wave_transactions';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Fonctions créées:';
  RAISE NOTICE '   - update_wave_transaction_updated_at()';
  RAISE NOTICE '   - sync_order_payment_status_from_wave()';
  RAISE NOTICE '   - create_order_with_wave_payment()';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Policies RLS activées';
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Prêt pour les paiements Wave!';
  RAISE NOTICE '====================================';
END $$;
