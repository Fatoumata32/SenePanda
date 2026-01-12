-- ============================================
-- FIX: Ajouter colonne last_message_preview
-- ============================================

-- Ajouter la colonne manquante
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Vérification
SELECT
  '✅ Colonne last_message_preview ajoutée' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'conversations'
  AND column_name = 'last_message_preview'
);

-- Afficher la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;
