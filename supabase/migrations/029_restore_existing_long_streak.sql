-- Migration 028 protects future recoveries, but cannot repair a count that
-- migration 027 already truncated. Rebuild this couple's active streak from
-- retained photos/recoveries, falling back to the old record only when all
-- available dates are continuous and older metadata has run out.
DO $$
DECLARE
  v_couple_id UUID := '7b8edae0-65da-44b7-a9b9-8073ecdd607e';
  v_today DATE := public.get_today_santiago();
  v_last DATE;
  v_first DATE;
  v_day DATE;
  v_current INT;
  v_record INT;
  v_streak INT := 0;
  v_restored INT;
BEGIN
  SELECT current_streak, max_streak INTO v_current, v_record
  FROM public.couples
  WHERE id = v_couple_id
  FOR UPDATE;

  IF NOT FOUND OR v_current NOT BETWEEN 30 AND 35 OR v_record < 52 THEN
    RETURN;
  END IF;

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

  SELECT min(day) INTO v_first FROM (
    SELECT min(photo_date) AS day FROM public.streak_photos WHERE couple_id = v_couple_id
    UNION ALL
    SELECT min(recovered_date) AS day FROM public.streak_recoveries WHERE couple_id = v_couple_id
  ) evidence;
  IF v_first IS NULL THEN RETURN; END IF;

  v_day := v_last;
  WHILE v_day >= v_first LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.streak_recoveries
      WHERE couple_id = v_couple_id AND recovered_date = v_day
    ) AND (
      SELECT count(DISTINCT user_id) FROM public.streak_photos
      WHERE couple_id = v_couple_id AND photo_date = v_day
    ) < 2 THEN
      EXIT;
    END IF;
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  END LOOP;

  IF v_streak < 30 THEN RETURN; END IF;
  v_restored := CASE
    WHEN v_day < v_first THEN greatest(v_streak, v_record)
    ELSE v_streak
  END;

  UPDATE public.couples
  SET current_streak = v_restored,
      max_streak = greatest(max_streak, v_restored)
  WHERE id = v_couple_id AND current_streak = v_current AND v_restored > v_current;
END;
$$;
