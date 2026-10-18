-- A recovery belongs to the person who missed their photo.
-- Replace migration 026's function while preserving its seven-day window.
CREATE OR REPLACE FUNCTION public.use_streak_recovery(
  p_couple_id UUID,
  p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := get_today_santiago();
  v_current_month DATE := date_trunc('month', v_today)::DATE;
  v_couple couples%ROWTYPE;
  v_remaining INT;
  v_day DATE;
  v_streak INT := 0;
BEGIN
  -- Lock the shared balance before checking it so simultaneous requests
  -- cannot spend the same remaining recovery twice.
  SELECT * INTO v_couple
  FROM couples
  WHERE id = p_couple_id AND v_user_id IN (user1_id, user2_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_date IS NULL OR p_date < v_today - 7 OR p_date >= v_today THEN
    RAISE EXCEPTION 'Can only recover a date from the last seven days';
  END IF;

  IF EXISTS (
    SELECT 1 FROM streak_recoveries
    WHERE couple_id = p_couple_id AND recovered_date = p_date
  ) THEN
    RAISE EXCEPTION 'Day already recovered';
  END IF;

  IF EXISTS (
    SELECT 1 FROM streak_photos
    WHERE couple_id = p_couple_id AND photo_date = p_date AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You already uploaded your photo for this date';
  END IF;

  IF (
    SELECT count(DISTINCT user_id) FROM streak_photos
    WHERE couple_id = p_couple_id AND photo_date = p_date
  ) = 2 THEN
    RAISE EXCEPTION 'Day already complete';
  END IF;

  IF v_couple.recoveries_reset_month < v_current_month THEN
    v_couple.recoveries_used := 0;
  END IF;
  IF v_couple.recoveries_used >= 10 THEN
    RAISE EXCEPTION 'No recoveries remaining this month';
  END IF;

  INSERT INTO streak_recoveries (couple_id, recovered_date, used_by)
  VALUES (p_couple_id, p_date, v_user_id);

  -- The active streak ends today if both photos are present, otherwise
  -- yesterday. Walk backwards through complete or recovered dates.
  v_day := v_today;
  IF NOT EXISTS (
    SELECT 1 FROM streak_recoveries
    WHERE couple_id = p_couple_id AND recovered_date = v_day
  ) AND (
    SELECT count(DISTINCT user_id) FROM streak_photos
    WHERE couple_id = p_couple_id AND photo_date = v_day
  ) < 2 THEN
    v_day := v_day - 1;
  END IF;

  WHILE v_day >= v_today - 30 LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM streak_recoveries
      WHERE couple_id = p_couple_id AND recovered_date = v_day
    ) AND (
      SELECT count(DISTINCT user_id) FROM streak_photos
      WHERE couple_id = p_couple_id AND photo_date = v_day
    ) < 2;
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  END LOOP;

  -- Old installations may have deleted photo metadata beyond 30 days.
  -- Preserve an established longer streak if the entire retained window
  -- is continuous; current_streak is the only surviving count for it.
  IF v_streak = 31 THEN
    v_streak := GREATEST(v_streak, v_couple.current_streak + 1);
  END IF;

  UPDATE couples
  SET recoveries_used = v_couple.recoveries_used + 1,
      recoveries_reset_month = v_current_month,
      current_streak = v_streak,
      max_streak = GREATEST(max_streak, v_streak)
  WHERE id = p_couple_id;

  v_remaining := 10 - v_couple.recoveries_used - 1;
  RETURN jsonb_build_object('success', true, 'recoveries_remaining', v_remaining);
END;
$$;

REVOKE ALL ON FUNCTION public.use_streak_recovery(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_streak_recovery(UUID, DATE) TO authenticated;
NOTIFY pgrst, 'reload schema';
