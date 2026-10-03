-- Source for migration 021. Activation preserves old XP; no historical backfill.
ALTER TABLE public.world_states ADD COLUMN IF NOT EXISTS calendar_xp_started_on DATE NOT NULL DEFAULT get_today_santiago();
ALTER TABLE public.world_states ADD COLUMN IF NOT EXISTS calendar_xp_started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp();
CREATE TABLE IF NOT EXISTS public.world_date_xp (
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  epoch TEXT NOT NULL,
  reward_date DATE NOT NULL,
  calendar_xp INT NOT NULL DEFAULT 0 CHECK(calendar_xp>=0),
  streak_xp INT NOT NULL DEFAULT 0 CHECK(streak_xp IN (0,15)),
  PRIMARY KEY(couple_id,epoch,reward_date)
);
ALTER TABLE public.world_date_xp ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.world_date_xp FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.world_date_xp TO authenticated;
DROP POLICY IF EXISTS world_date_xp_read ON public.world_date_xp;
CREATE POLICY world_date_xp_read ON public.world_date_xp FOR SELECT TO authenticated USING(
  EXISTS(SELECT 1 FROM couples WHERE id=couple_id AND auth.uid() IN (user1_id,user2_id))
);

CREATE OR REPLACE FUNCTION public.sync_world_date_xp(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_state world_states; v_couple couples; v_epoch TEXT; v_start DATE;
  v_before BIGINT; v_after BIGINT; v_total BIGINT; v_level INT:=1; v_needed INT;
BEGIN
  SELECT * INTO v_couple FROM couples WHERE id=p_couple_id AND auth.uid() IN (user1_id,user2_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success',true,'xp_delta',0); END IF;
  v_epoch := COALESCE(v_state.onboarding_epoch::TEXT,'legacy');
  v_start := GREATEST(v_state.calendar_xp_started_on,(v_state.created_at AT TIME ZONE 'America/Santiago')::DATE);
  SELECT COALESCE(SUM(calendar_xp+streak_xp),0) INTO v_before FROM world_date_xp WHERE couple_id=p_couple_id AND epoch=v_epoch;
  -- Rebuild from source records, including dates emptied by deletes. Future dates earn nothing.
  WITH special_days AS (
    SELECT date_trunc('month',event_date)::DATE AS month, MIN(event_date) AS reward_date
    FROM calendar_events WHERE couple_id=p_couple_id AND category='aniversario'
      AND event_date BETWEEN v_start AND get_today_santiago()
      AND (event_date>(v_state.calendar_xp_started_at AT TIME ZONE 'America/Santiago')::DATE OR created_at>=v_state.calendar_xp_started_at) GROUP BY 1
  ), dates AS (
    SELECT event_date AS day FROM calendar_events WHERE couple_id=p_couple_id
    UNION SELECT photo_date FROM streak_photos WHERE couple_id=p_couple_id
    UNION SELECT reward_date FROM world_date_xp WHERE couple_id=p_couple_id AND epoch=v_epoch
  ), rewards AS (
    SELECT d.day,
      CASE WHEN d.day BETWEEN v_start AND get_today_santiago() THEN
        COALESCE((SELECT MAX(CASE e.category WHEN 'nos_vimos' THEN 70 WHEN 'cita' THEN 100
          WHEN 'viaje' THEN 150 WHEN 'aniversario' THEN CASE WHEN EXISTS(
            SELECT 1 FROM special_days s WHERE s.reward_date=d.day) THEN 150 ELSE 70 END ELSE 0 END)
          FROM calendar_events e WHERE e.couple_id=p_couple_id AND e.event_date=d.day
            AND (e.event_date>(v_state.calendar_xp_started_at AT TIME ZONE 'America/Santiago')::DATE OR e.created_at>=v_state.calendar_xp_started_at)),0) ELSE 0 END AS calendar_xp,
      CASE WHEN d.day BETWEEN v_start AND get_today_santiago()
        AND EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id AND photo_date=d.day AND user_id=v_couple.user1_id
          AND (photo_date>(v_state.calendar_xp_started_at AT TIME ZONE 'America/Santiago')::DATE OR uploaded_at>=v_state.calendar_xp_started_at))
        AND EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id AND photo_date=d.day AND user_id=v_couple.user2_id
          AND (photo_date>(v_state.calendar_xp_started_at AT TIME ZONE 'America/Santiago')::DATE OR uploaded_at>=v_state.calendar_xp_started_at))
        THEN 15 ELSE 0 END AS streak_xp FROM dates d
  )
  INSERT INTO world_date_xp(couple_id,epoch,reward_date,calendar_xp,streak_xp)
    SELECT p_couple_id,v_epoch,day,calendar_xp,streak_xp FROM rewards
    ON CONFLICT(couple_id,epoch,reward_date) DO UPDATE SET calendar_xp=EXCLUDED.calendar_xp,streak_xp=EXCLUDED.streak_xp;
  SELECT COALESCE(SUM(calendar_xp+streak_xp),0) INTO v_after FROM world_date_xp WHERE couple_id=p_couple_id AND epoch=v_epoch;
  v_total := v_state.xp;
  IF v_state.level>1 THEN
    SELECT v_total+COALESCE(SUM(world_xp_to_next(n)),0) INTO v_total FROM generate_series(1,v_state.level-1) n;
  END IF;
  v_total := GREATEST(0,v_total+v_after-v_before);
  WHILE v_level<100 LOOP
    v_needed := world_xp_to_next(v_level);
    EXIT WHEN v_total<v_needed;
    v_total:=v_total-v_needed; v_level:=v_level+1;
  END LOOP;
  IF v_before<>v_after THEN
    -- Earned objects and opened biomes remain; level rewards retain their existing claim keys.
    UPDATE world_states SET level=v_level,xp=LEAST(v_total,2147483647)::INT,updated_at=now() WHERE couple_id=p_couple_id;
  END IF;
  RETURN jsonb_build_object('success',true,'xp_delta',v_after-v_before,'level',v_level,'xp',v_total);
END;
$$;
REVOKE ALL ON FUNCTION public.sync_world_date_xp(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sync_world_date_xp(UUID) TO authenticated;

-- BEFORE locks serialize both partners' source writes before AFTER reads the shared date.
CREATE OR REPLACE FUNCTION public.lock_world_date_xp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.couple_id<>OLD.couple_id THEN RAISE EXCEPTION 'Cannot move a record between couples'; END IF;
  PERFORM 1 FROM world_states WHERE couple_id=CASE WHEN TG_OP='DELETE' THEN OLD.couple_id ELSE NEW.couple_id END FOR UPDATE;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.refresh_world_date_xp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
  v_id:=CASE WHEN TG_OP='DELETE' THEN OLD.couple_id ELSE NEW.couple_id END;
  -- Administrative cascades have no member identity; the next authorized sync reconciles them.
  IF EXISTS(SELECT 1 FROM couples WHERE id=v_id AND auth.uid() IN (user1_id,user2_id)) THEN
    PERFORM sync_world_date_xp(v_id);
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.lock_world_date_xp(),public.refresh_world_date_xp() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS calendar_xp_lock ON public.calendar_events;
CREATE TRIGGER calendar_xp_lock BEFORE INSERT OR UPDATE OR DELETE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION lock_world_date_xp();
DROP TRIGGER IF EXISTS calendar_xp_refresh ON public.calendar_events;
CREATE TRIGGER calendar_xp_refresh AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION refresh_world_date_xp();
DROP TRIGGER IF EXISTS streak_xp_lock ON public.streak_photos;
CREATE TRIGGER streak_xp_lock BEFORE INSERT OR UPDATE OR DELETE ON public.streak_photos FOR EACH ROW EXECUTE FUNCTION lock_world_date_xp();
DROP TRIGGER IF EXISTS streak_xp_refresh ON public.streak_photos;
CREATE TRIGGER streak_xp_refresh AFTER INSERT OR UPDATE OR DELETE ON public.streak_photos FOR EACH ROW EXECUTE FUNCTION refresh_world_date_xp();
