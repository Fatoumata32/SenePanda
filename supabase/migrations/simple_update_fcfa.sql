-- ============================================
-- Migration Simple: XOF → FCFA
-- Date: 2025-11-30
-- Description: Version simplifiée pour mettre à jour uniquement subscription_history
-- ============================================

-- Mettre à jour la valeur par défaut de la colonne currency
ALTER TABLE subscription_history
ALTER COLUMN currency SET DEFAULT 'FCFA';

-- Mettre à jour tous les enregistrements existants
UPDATE subscription_history
SET currency = 'FCFA'
WHERE currency = 'XOF' OR currency IS NULL;

-- Afficher le résultat
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM subscription_history
  WHERE currency = 'FCFA';

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migration XOF → FCFA terminée';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Table: subscription_history';
  RAISE NOTICE 'Enregistrements en FCFA: %', updated_count;
  RAISE NOTICE 'Valeur par défaut: FCFA';
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 Succès!';
  RAISE NOTICE '====================================';
END $$;
