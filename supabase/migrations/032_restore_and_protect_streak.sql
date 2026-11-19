-- ============================================================
-- Coliflor — Migration v032: Restore and Protect Long Streak & Recoveries
-- ============================================================
-- 1. Add streak_start_date to couples so active streaks are never
--    truncated by ephemeral photo retention windows.
-- 2. Preserve streak_photos records permanently (stop deleting them
--    in cleanup_old_photos; only binary storage files should be pruned).
-- 3. Update use_streak_recovery to restore full streak from streak_start_date.
-- 4. Update upload_streak_photo to compute streak using streak_start_date.
-- 5. Restore the active streak for couple 7b8edae0-65da-44b7-a9b9-8073ecdd607e
--    (started on 2026-08-27).
-- ============================================================

-- 1. Add streak_start_date column if not present
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS streak_start_date DATE;

-- 2. Prevent deletion of streak_photos metadata records
CREATE OR REPLACE FUNCTION public.cleanup_old_photos()
RETURNS void AS $$
BEGIN
  -- Preserve all streak_photos database rows permanently as attendance history.
  -- Storage binaries can be cleaned via storage lifecycle/API if desired.
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Replace use_streak_recovery with persistent streak calculation
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
  v_last_day DATE;
  v_first_day DATE;
  v_day DATE;
  v_streak INT := 0;
  v_retained_boundary DATE;
BEGIN
  -- Lock the couple row
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

  -- Reset monthly recoveries if month changed
  IF v_couple.recoveries_reset_month IS NULL OR v_couple.recoveries_reset_month < v_current_month THEN
    v_couple.recoveries_used := 0;
  END IF;

  IF v_couple.recoveries_used >= 10 THEN
    RAISE EXCEPTION 'No recoveries remaining this month';
  END IF;

  INSERT INTO streak_recoveries (couple_id, recovered_date, used_by)
  VALUES (p_couple_id, p_date, v_user_id);

  -- Determine the last day of the active streak
  v_last_day := v_today;
  IF NOT EXISTS (
    SELECT 1 FROM streak_recoveries
    WHERE couple_id = p_couple_id AND recovered_date = v_last_day
  ) AND (
    SELECT count(DISTINCT user_id) FROM streak_photos
    WHERE couple_id = p_couple_id AND photo_date = v_last_day
  ) < 2 THEN
    v_last_day := v_today - 1;
  END IF;

  -- Determine the earliest retained day with evidence
  SELECT min(day) INTO v_first_day FROM (
    SELECT min(photo_date) AS day FROM public.streak_photos WHERE couple_id = p_couple_id
    UNION ALL
    SELECT min(recovered_date) AS day FROM public.streak_recoveries WHERE couple_id = p_couple_id
  ) evidence;

  IF v_first_day IS NULL THEN
    v_first_day := v_last_day;
  END IF;

  -- Never check before streak_start_date if configured
  IF v_couple.streak_start_date IS NOT NULL AND v_couple.streak_start_date > v_first_day THEN
    v_first_day := v_couple.streak_start_date;
  END IF;

  -- Walk backwards through complete or recovered dates
  v_day := v_last_day;
  WHILE v_day >= v_first_day LOOP
    IF NOT EXISTS (
      SELECT 1 FROM streak_recoveries
      WHERE couple_id = p_couple_id AND recovered_date = v_day
    ) AND (
      SELECT count(DISTINCT user_id) FROM streak_photos
      WHERE couple_id = p_couple_id AND photo_date = v_day
    ) < 2 THEN
      EXIT;
    END IF;
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  END LOOP;

  -- If continuous all the way to the earliest retained day (v_day < v_first_day)
  IF v_day < v_first_day THEN
    IF v_couple.streak_start_date IS NOT NULL AND v_couple.streak_start_date <= v_last_day THEN
      v_streak := (v_last_day - v_couple.streak_start_date + 1);
    ELSE
      v_streak := GREATEST(v_streak, v_couple.current_streak + 1, v_couple.max_streak);
    END IF;
  END IF;

  UPDATE couples
  SET recoveries_used = v_couple.recoveries_used + 1,
      recoveries_reset_month = v_current_month,
      current_streak = v_streak,
      max_streak = GREATEST(max_streak, v_streak),
      streak_start_date = COALESCE(streak_start_date, v_last_day - v_streak + 1)
  WHERE id = p_couple_id;

  v_remaining := 10 - v_couple.recoveries_used - 1;
  RETURN jsonb_build_object('success', true, 'recoveries_remaining', v_remaining);
END;
$$;

REVOKE ALL ON FUNCTION public.use_streak_recovery(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_streak_recovery(UUID, DATE) TO authenticated;

-- 4. Update upload_streak_photo to respect streak_start_date
CREATE OR REPLACE FUNCTION public.upload_streak_photo(
  p_couple_id UUID,
  p_storage_path TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := get_today_santiago();
  v_partner_has_photo BOOLEAN;
  v_yesterday_complete BOOLEAN;
  v_yesterday_recovered BOOLEAN;
  v_current_streak INT;
  v_max_streak INT;
  v_photo_id UUID;
  v_couple couples%ROWTYPE;
BEGIN
  SELECT * INTO v_couple
  FROM couples
  WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM streak_photos
    WHERE couple_id = p_couple_id AND user_id = v_user_id AND photo_date = v_today
  ) THEN
    RAISE EXCEPTION 'Already uploaded photo today';
  END IF;

  INSERT INTO streak_photos (couple_id, user_id, photo_date, storage_path)
  VALUES (p_couple_id, v_user_id, v_today, p_storage_path)
  RETURNING id INTO v_photo_id;

  SELECT EXISTS (
    SELECT 1 FROM streak_photos
    WHERE couple_id = p_couple_id AND user_id != v_user_id AND photo_date = v_today
  ) INTO v_partner_has_photo;

  IF v_partner_has_photo THEN
    SELECT EXISTS (
      SELECT 1 FROM streak_photos sp1
      JOIN streak_photos sp2 ON sp1.couple_id = sp2.couple_id AND sp1.photo_date = sp2.photo_date
      WHERE sp1.couple_id = p_couple_id
        AND sp1.photo_date = v_today - INTERVAL '1 day'
        AND sp1.user_id != sp2.user_id
    ) INTO v_yesterday_complete;

    SELECT EXISTS (
      SELECT 1 FROM streak_recoveries
      WHERE couple_id = p_couple_id AND recovered_date = v_today - INTERVAL '1 day'
    ) INTO v_yesterday_recovered;

    v_current_streak := v_couple.current_streak;
    v_max_streak := v_couple.max_streak;

    IF v_yesterday_complete OR v_yesterday_recovered THEN
      IF v_couple.streak_start_date IS NOT NULL AND v_couple.streak_start_date <= v_today THEN
        v_current_streak := (v_today - v_couple.streak_start_date + 1);
      ELSE
        v_current_streak := v_current_streak + 1;
        v_couple.streak_start_date := v_today - v_current_streak + 1;
      END IF;
    ELSIF v_current_streak = 0 THEN
      v_current_streak := 1;
      v_couple.streak_start_date := v_today;
    ELSE
      -- Yesterday is missing. Keep streak_start_date intact during the recovery window,
      -- setting temporary count to 1 until recovered.
      v_current_streak := 1;
    END IF;

    IF v_current_streak > v_max_streak THEN
      v_max_streak := v_current_streak;
    END IF;

    UPDATE couples
    SET current_streak = v_current_streak,
        max_streak = v_max_streak,
        streak_start_date = COALESCE(streak_start_date, v_couple.streak_start_date)
    WHERE id = p_couple_id;
  END IF;

  RETURN jsonb_build_object(
    'photo_id', v_photo_id,
    'day_complete', v_partner_has_photo,
    'current_streak', (SELECT current_streak FROM couples WHERE id = p_couple_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.upload_streak_photo(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upload_streak_photo(UUID, TEXT) TO authenticated;

-- 5. Immediate restoration of the confirmed August 27 streak and reset of monthly recoveries
DO $$
DECLARE
  v_couple_id UUID := '7b8edae0-65da-44b7-a9b9-8073ecdd607e';
  v_start DATE := DATE '2026-08-27';
  v_today DATE := public.get_today_santiago();
  v_current_month DATE := date_trunc('month', v_today)::DATE;
  v_last DATE;
  v_restored INT;
  v_user1 UUID;
  v_day RECORD;
BEGIN
  SELECT user1_id INTO v_user1 FROM public.couples WHERE id = v_couple_id;
  IF v_user1 IS NULL THEN
    RETURN;
  END IF;

  -- Ensure any missing days in the recent window are recorded as recovered so the chain is unbroken
  FOR v_day IN
    SELECT day::DATE AS d
    FROM generate_series(GREATEST(v_start, v_today - 14), v_today - 1, INTERVAL '1 day') AS days(day)
  LOOP
    IF (
      SELECT count(DISTINCT user_id) FROM public.streak_photos
      WHERE couple_id = v_couple_id AND photo_date = v_day.d
    ) < 2 AND NOT EXISTS (
      SELECT 1 FROM public.streak_recoveries
      WHERE couple_id = v_couple_id AND recovered_date = v_day.d
    ) THEN
      INSERT INTO public.streak_recoveries (couple_id, recovered_date, used_by)
      VALUES (v_couple_id, v_day.d, v_user1)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Active streak ends today if complete, else yesterday
  v_last := v_today;
  IF NOT EXISTS (
    SELECT 1 FROM public.streak_recoveries
    WHERE couple_id = v_couple_id AND recovered_date = v_last
  ) AND (
    SELECT count(DISTINCT user_id) FROM public.streak_photos
    WHERE couple_id = v_couple_id AND photo_date = v_last
  ) < 2 THEN
    v_last := v_today - 1;
  END IF;

  v_restored := v_last - v_start + 1;

  -- Restore full streak, start date and reset monthly recoveries to 0 used (10 available)
  UPDATE public.couples
  SET current_streak = v_restored,
      max_streak = GREATEST(max_streak, v_restored),
      streak_start_date = v_start,
      recoveries_used = 0,
      recoveries_reset_month = v_current_month
  WHERE id = v_couple_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
