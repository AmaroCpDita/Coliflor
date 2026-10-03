-- Installs an admin-only, one-time repair. Does not recalculate any world by itself.
-- Apply after 018. Run supabase/recalculate-my-world.sql to repair a selected world.
BEGIN;
CREATE TABLE IF NOT EXISTS public.world_progress_repairs (
  couple_id UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  before_state JSONB NOT NULL,
  after_state JSONB NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.world_progress_repairs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.world_progress_repairs FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.admin_recalculate_world_progress(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_before world_states;
  v_after world_states;
  v_couple couples;
  v_log RECORD;
  v_day DATE;
  v_multiplier INT;
  v_type TEXT;
  v_key TEXT;
  v_budget_key TEXT;
  v_amount INT;
  v_spent INT;
  v_total BIGINT := 0;
  v_remaining BIGINT;
  v_level INT := 1;
  v_daily DATE[] := ARRAY[]::DATE[];
  v_placements TEXT[] := ARRAY[]::TEXT[];
  v_interactions TEXT[] := ARRAY[]::TEXT[];
  v_budgets JSONB := '{}'::JSONB;
BEGIN
  SELECT * INTO v_before FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No se encontró el mundo de esa pareja'; END IF;
  IF v_before.progression_version<4 OR to_regprocedure('public.interact_world_object(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'Ejecuta primero supabase/forest-rollout.sql para activar el nuevo cálculo de XP';
  END IF;
  IF EXISTS(SELECT 1 FROM world_progress_repairs WHERE couple_id=p_couple_id) THEN
    RETURN jsonb_build_object('success',true,'already_recalculated',true,'level',v_before.level,'xp',v_before.xp);
  END IF;
  IF v_before.forest_completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Este mundo ya completó el bosque; esta reparación es para desbloqueos prematuros';
  END IF;
  SELECT * INTO v_couple FROM couples WHERE id=p_couple_id;
  -- Replay only actual world activity. Streak, welcome, catalog and goal XP do not count.
  FOR v_log IN SELECT * FROM world_activity_log WHERE couple_id=p_couple_id
    AND activity_type IN ('daily','placement','interaction') AND xp_granted>0
    ORDER BY created_at,id
  LOOP
    v_day := (v_log.created_at AT TIME ZONE 'America/Santiago')::DATE;
    -- Historical x2 needs proof that BOTH photos were already uploaded that day.
    v_multiplier := CASE WHEN EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id
      AND user_id=v_couple.user1_id AND photo_date=v_day AND uploaded_at<=v_log.created_at)
      AND EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id
      AND user_id=v_couple.user2_id AND photo_date=v_day AND uploaded_at<=v_log.created_at) THEN 2 ELSE 1 END;
    IF v_log.activity_type='daily' THEN
      IF v_day=ANY(v_daily) THEN CONTINUE; END IF;
      v_daily := array_append(v_daily,v_day);
      v_total := v_total + LEAST(v_log.xp_granted,15*v_multiplier);
      CONTINUE;
    END IF;
    v_type := NULL;
    IF v_log.activity_key LIKE 'placement:first:%' THEN
      v_type := world_object_id(split_part(v_log.activity_key,':',3));
    ELSIF v_log.activity_key LIKE 'interaction:%' THEN
      v_type := world_object_id(split_part(v_log.activity_key,':',2));
    ELSE
      SELECT world_object_id(item_id) INTO v_type FROM world_placed_objects
        WHERE couple_id=p_couple_id AND id::TEXT=split_part(v_log.activity_key,':',2);
      -- Removed old objects have no surviving type; retain bounded credit by their logged ID.
      IF v_type IS NULL THEN v_type := 'legacy:' || split_part(v_log.activity_key,':',2); END IF;
    END IF;
    IF v_log.activity_type='placement' THEN
      v_key := v_type;
      IF v_key=ANY(v_placements) THEN CONTINUE; END IF;
      v_placements := array_append(v_placements,v_key);
    ELSE
      v_key := v_type || ':' || v_day;
      IF v_key=ANY(v_interactions) THEN CONTINUE; END IF;
      v_interactions := array_append(v_interactions,v_key);
    END IF;
    v_budget_key := v_log.activity_type || ':' || v_day;
    v_spent := COALESCE((v_budgets->>v_budget_key)::INT,0);
    v_amount := LEAST(v_log.xp_granted,5*v_multiplier,
      GREATEST(0,(CASE v_log.activity_type WHEN 'interaction' THEN 10 ELSE 15 END)*v_multiplier-v_spent));
    v_budgets := jsonb_set(v_budgets,ARRAY[v_budget_key],to_jsonb(v_spent+v_amount));
    v_total := v_total+v_amount;
  END LOOP;
  v_remaining := v_total;
  WHILE v_level<100 AND v_remaining>=world_xp_to_next(v_level) LOOP
    v_remaining := v_remaining-world_xp_to_next(v_level);
    v_level := v_level+1;
  END LOOP;
  -- Inventory, placements, claimed rewards, visits and streak records stay untouched.
  UPDATE world_states SET level=v_level,xp=LEAST(v_remaining,2147483647)::INT,
    current_biome='forest',unlocked_biomes=ARRAY['forest']::TEXT[],updated_at=NOW()
    WHERE couple_id=p_couple_id RETURNING * INTO v_after;
  INSERT INTO world_progress_repairs(couple_id,before_state,after_state)
    VALUES(p_couple_id,to_jsonb(v_before),to_jsonb(v_after));
  RETURN jsonb_build_object('success',true,'old_level',v_before.level,'old_xp',v_before.xp,
    'level',v_after.level,'xp',v_after.xp,'total_xp',v_total,'current_biome','forest');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_recalculate_world_progress(UUID) FROM PUBLIC,anon,authenticated;
COMMIT;
