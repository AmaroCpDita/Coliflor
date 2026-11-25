-- ============================================================
-- Coliflor — Migration v033: Public Read-Only RPC for iOS/Scriptable Widget (Enhanced with Yesterday Recovery Check)
-- ============================================================
-- Returns non-sensitive streak status, including whether yesterday
-- was completed or requires a recovery photo.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_widget_streak_status(
  p_couple_id UUID DEFAULT '7b8edae0-65da-44b7-a9b9-8073ecdd607e'::UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := get_today_santiago();
  v_yesterday DATE := v_today - 1;
  v_streak INT := 0;
  v_photos_today INT := 0;
  v_photos_yesterday INT := 0;
  v_yesterday_recovered BOOLEAN := FALSE;
  v_needs_recovery BOOLEAN := FALSE;
BEGIN
  -- Obtener racha registrada en la pareja
  SELECT COALESCE(current_streak, 0) INTO v_streak
  FROM couples
  WHERE id = p_couple_id;

  -- Cantidad de fotos únicas subidas hoy
  SELECT COUNT(DISTINCT user_id) INTO v_photos_today
  FROM streak_photos
  WHERE couple_id = p_couple_id AND photo_date = v_today;

  -- Cantidad de fotos únicas subidas ayer
  SELECT COUNT(DISTINCT user_id) INTO v_photos_yesterday
  FROM streak_photos
  WHERE couple_id = p_couple_id AND photo_date = v_yesterday;

  -- Verificar si ayer ya fue recuperado formalmente
  SELECT EXISTS (
    SELECT 1 FROM streak_recoveries
    WHERE couple_id = p_couple_id AND recovered_date = v_yesterday
  ) INTO v_yesterday_recovered;

  -- Si hay una racha en curso (> 0) y ayer NO se completaron las 2 fotos ni se ha recuperado,
  -- la racha está en riesgo y requiere recuperar la foto de ayer.
  IF v_streak > 0 AND v_photos_yesterday < 2 AND NOT v_yesterday_recovered THEN
    v_needs_recovery := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'current_streak', COALESCE(v_streak, 0),
    'completed_today', (v_photos_today >= 2),
    'photos_today', v_photos_today,
    'needs_recovery', v_needs_recovery,
    'photos_yesterday', v_photos_yesterday,
    'yesterday_recovered', v_yesterday_recovered,
    'today', v_today::TEXT,
    'yesterday', v_yesterday::TEXT
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_widget_streak_status(UUID) TO anon, authenticated;
