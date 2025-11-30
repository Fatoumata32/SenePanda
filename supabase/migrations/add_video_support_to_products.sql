-- ============================================
-- Migration: Ajouter le support vidéo aux produits
-- Date: 2025-11-30
-- Description: Ajoute la colonne video_url pour permettre aux vendeurs d'ajouter des vidéos
-- ============================================

-- Ajouter la colonne video_url si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'video_url'
  ) THEN
    ALTER TABLE products ADD COLUMN video_url TEXT;
    RAISE NOTICE '✅ Colonne video_url ajoutée à la table products';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne video_url existe déjà';
  END IF;
END $$;

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'ℹ️  Les vendeurs peuvent maintenant ajouter des vidéos à leurs produits';
  RAISE NOTICE 'ℹ️  Seuls les vendeurs avec plan Pro ou Premium peuvent utiliser cette fonctionnalité';
  RAISE NOTICE '====================================';
END $$;
