-- Per-member first-entry card and an admin-only, scoped launch reset.
BEGIN;
ALTER TABLE public.world_states ADD COLUMN IF NOT EXISTS onboarding_epoch UUID;
-- Existing worlds keep NULL; only new worlds and explicit resets get a welcome.
ALTER TABLE public.world_states ALTER COLUMN onboarding_epoch SET DEFAULT gen_random_uuid();
CREATE TABLE IF NOT EXISTS public.world_welcome_seen (
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  epoch UUID NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(couple_id,user_id,epoch)
);
ALTER TABLE public.world_welcome_seen ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.world_welcome_seen FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_world_welcome(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_epoch UUID;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT onboarding_epoch INTO v_epoch FROM world_states WHERE couple_id=p_couple_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  RETURN jsonb_build_object('epoch',v_epoch,'pending',v_epoch IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM world_welcome_seen WHERE couple_id=p_couple_id AND user_id=auth.uid() AND epoch=v_epoch));
END;
$$;
CREATE OR REPLACE FUNCTION public.acknowledge_world_welcome(p_couple_id UUID,p_epoch UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_epoch UUID;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT onboarding_epoch INTO v_epoch FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF v_epoch IS NULL OR p_epoch IS DISTINCT FROM v_epoch THEN RAISE EXCEPTION 'El mundo se reinició. Vuelve a abrirlo.'; END IF;
  INSERT INTO world_welcome_seen(couple_id,user_id,epoch) VALUES(p_couple_id,auth.uid(),v_epoch) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('success',true,'epoch',v_epoch,'pending',false);
END;
$$;

CREATE OR REPLACE FUNCTION public.init_world(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO world_states(couple_id) VALUES(p_couple_id) ON CONFLICT(couple_id) DO NOTHING;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id;
  RETURN to_jsonb(v_state);
END;
$$;

CREATE TABLE IF NOT EXISTS public.world_fresh_start_backups (
  reset_key TEXT PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  before_data JSONB NOT NULL,
  reset_epoch UUID NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.world_fresh_start_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.world_fresh_start_backups FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_world_for_launch(p_couple_id UUID,p_reset_key TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states; v_epoch UUID := gen_random_uuid(); v_before JSONB;
BEGIN
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No se encontró el mundo indicado'; END IF;
  IF EXISTS(SELECT 1 FROM world_fresh_start_backups WHERE reset_key=p_reset_key AND couple_id<>p_couple_id) THEN RAISE EXCEPTION 'Ese reinicio pertenece a otro mundo'; END IF;
  IF EXISTS(SELECT 1 FROM world_fresh_start_backups WHERE reset_key=p_reset_key) THEN
    RETURN jsonb_build_object('success',true,'already_reset',true,'level',v_state.level,'xp',v_state.xp);
  END IF;
  v_before := jsonb_build_object('state',to_jsonb(v_state),
    'inventory',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_inventory t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'placed_objects',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_placed_objects t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'activity',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_activity_log t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'achievements',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_achievements t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'milestones',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_claimed_milestones t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'visits',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_forest_visits t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'welcome',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_welcome_seen t WHERE couple_id=p_couple_id),'[]'::JSONB));
  INSERT INTO world_fresh_start_backups(reset_key,couple_id,before_data,reset_epoch) VALUES(p_reset_key,p_couple_id,v_before,v_epoch);
  DELETE FROM world_placed_objects WHERE couple_id=p_couple_id;
  DELETE FROM world_inventory WHERE couple_id=p_couple_id;
  DELETE FROM world_activity_log WHERE couple_id=p_couple_id;
  DELETE FROM world_achievements WHERE couple_id=p_couple_id;
  DELETE FROM world_claimed_milestones WHERE couple_id=p_couple_id;
  DELETE FROM world_forest_visits WHERE couple_id=p_couple_id;
  DELETE FROM world_welcome_seen WHERE couple_id=p_couple_id;
  UPDATE world_states SET level=1,xp=0,energy=100,max_energy=100,current_biome='forest',
    unlocked_biomes=ARRAY['forest']::TEXT[],last_daily_date=NULL,forest_completed_at=NULL,
    progression_version=4,onboarding_epoch=v_epoch,created_at=NOW(),updated_at=NOW()
    WHERE couple_id=p_couple_id;
  RETURN jsonb_build_object('success',true,'level',1,'xp',0,'inventory_count',0,'placed_count',0,'epoch',v_epoch);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_world_for_launch(UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.get_world_welcome(UUID),public.acknowledge_world_welcome(UUID,UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_world_welcome(UUID),public.acknowledge_world_welcome(UUID,UUID) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
