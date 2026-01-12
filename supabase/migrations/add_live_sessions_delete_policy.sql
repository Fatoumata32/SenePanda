-- Ajouter la policy DELETE manquante pour live_sessions
-- Permettre aux vendeurs de supprimer leurs propres lives

CREATE POLICY "Les vendeurs peuvent supprimer leurs lives"
  ON live_sessions FOR DELETE
  USING (auth.uid() = seller_id);
