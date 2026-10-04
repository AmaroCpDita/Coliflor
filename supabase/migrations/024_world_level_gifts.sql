-- Apply after 023. Gifts contain all earned level rewards, claimed on demand.
BEGIN;
-- Retain the original, validated transaction; only reduce the daily quiz incentive.
DO $$
DECLARE v_definition TEXT;
BEGIN
  SELECT pg_get_functiondef('public.submit_daily_quiz(uuid,text,jsonb)'::regprocedure) INTO v_definition;
  v_definition := replace(v_definition,'v_today::TEXT,20,','v_today::TEXT,5,');
  EXECUTE v_definition;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_world_level_rewards(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states; v_levels JSONB;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND auth.uid() IN(user1_id,user2_id)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT COALESCE(jsonb_agg(n ORDER BY n),'[]'::JSONB) INTO v_levels
    FROM generate_series(1,v_state.level) n
    WHERE (n<21 OR v_state.forest_completed_at IS NOT NULL OR 'garden'=ANY(v_state.unlocked_biomes))
      AND NOT EXISTS(SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id
        AND activity_key='catalog:v5:level:' || n::TEXT);
  RETURN jsonb_build_object('success',true,'levels',v_levels);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_level_rewards(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states; v_status JSONB; v_result JSONB; v_level INT;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND auth.uid() IN(user1_id,user2_id)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  v_status := get_world_level_rewards(p_couple_id);
  IF jsonb_array_length(v_status->'levels')=0 THEN
    RETURN jsonb_build_object('success',true,'already_claimed',true,'level',v_state.level,'xp',v_state.xp);
  END IF;
  -- All objects from all pending levels in one atomic transaction, never random.
  v_result := claim_world_catalog(p_couple_id);
  FOR v_level IN SELECT value::INT FROM jsonb_array_elements_text(v_status->'levels') LOOP
    PERFORM grant_world_xp(p_couple_id,'level_reward','catalog:v5:level:' || v_level::TEXT,0,'[]'::JSONB);
  END LOOP;
  RETURN v_result || jsonb_build_object('xp',v_state.xp,'reward_levels',v_status->'levels');
END;
$$;

-- Preserve gifts already obtained before this change. Missing packs remain claimable.
INSERT INTO world_activity_log(couple_id,activity_type,activity_key,xp_granted,items_granted,granted_by)
SELECT s.couple_id,'level_reward','catalog:v5:level:' || n::TEXT,0,'[]'::JSONB,c.user1_id
FROM world_states s JOIN couples c ON c.id=s.couple_id CROSS JOIN LATERAL generate_series(1,s.level) n
WHERE (n<21 OR s.forest_completed_at IS NOT NULL OR 'garden'=ANY(s.unlocked_biomes))
  AND NOT EXISTS(SELECT 1 FROM world_object_catalog o WHERE o.required_level=n AND o.reward_kind='level'
    AND NOT EXISTS(SELECT 1 FROM world_activity_log a WHERE a.couple_id=s.couple_id
      AND a.activity_key='catalog:v4:item:' || o.item_id))
ON CONFLICT(couple_id,activity_key) DO NOTHING;
REVOKE ALL ON FUNCTION public.get_world_level_rewards(UUID),public.claim_world_level_rewards(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_world_level_rewards(UUID),public.claim_world_level_rewards(UUID) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
