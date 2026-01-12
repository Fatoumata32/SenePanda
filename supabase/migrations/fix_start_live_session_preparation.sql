-- Correction de la fonction start_live_session pour accepter le statut 'preparation'
-- Le problème: la fonction n'acceptait que 'scheduled', mais les lives sont créés avec 'preparation'

CREATE OR REPLACE FUNCTION start_live_session(session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE live_sessions
  SET
    status = 'live',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = session_id AND status IN ('scheduled', 'preparation');

  -- Log pour debug
  RAISE NOTICE 'Live session % démarré', session_id;
END;
$$;
