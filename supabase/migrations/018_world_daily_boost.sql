-- Daily XP uses today's shared activity, never the length of an old streak.
-- Apply after 017, or run supabase/forest-rollout.sql for 016–018 together.
BEGIN;
CREATE OR REPLACE FUNCTION public.world_daily_xp_multiplier(p_couple_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_couple couples;
BEGIN
  SELECT * INTO v_couple FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid());
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN CASE WHEN EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id AND user_id=v_couple.user1_id AND photo_date=get_today_santiago())
    AND EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id AND user_id=v_couple.user2_id AND photo_date=get_today_santiago()) THEN 2 ELSE 1 END;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_world_xp(
  p_couple_id UUID, p_activity_type TEXT, p_activity_key TEXT,
  p_xp INT, p_items JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_state world_states;
  v_xp INT;
  v_level INT;
  v_needed INT;
  v_items JSONB;
  v_item JSONB;
  v_object_id UUID;
  v_item_id TEXT;
  v_spent INT;
  v_today DATE := get_today_santiago();
  v_multiplier INT;
  v_budget INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  v_multiplier := public.world_daily_xp_multiplier(p_couple_id);
  -- Decorative actions cannot speed up progress by repeating placements or copies.
  IF p_activity_type IN ('placement', 'interaction') THEN
    BEGIN v_object_id := split_part(p_activity_key, ':', 2)::UUID;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid object interaction'; END;
    SELECT item_id INTO v_item_id FROM world_placed_objects WHERE id = v_object_id AND couple_id = p_couple_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Object not found'; END IF;
    IF p_activity_type = 'placement' THEN p_activity_key := 'placement:first:' || v_item_id;
    ELSE p_activity_key := 'interaction:' || v_item_id || ':' || v_today; END IF;
    SELECT COALESCE(SUM(xp_granted),0) INTO v_spent FROM world_activity_log
      WHERE couple_id = p_couple_id AND activity_type = p_activity_type
        AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today;
    v_budget := CASE p_activity_type WHEN 'interaction' THEN 10 ELSE 15 END * v_multiplier;
    p_xp := LEAST(5 * v_multiplier, GREATEST(0, v_budget - v_spent));
    p_items := '[]'::JSONB;
  END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id = p_couple_id AND activity_key = p_activity_key) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'level', v_state.level, 'xp', v_state.xp);
  END IF;
  p_xp := LEAST(5000, GREATEST(0, COALESCE(p_xp, 0)));
  v_xp := v_state.xp + p_xp;
  v_level := v_state.level;
  WHILE v_level < 100 LOOP
    v_needed := public.world_xp_to_next(v_level);
    EXIT WHEN v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  END LOOP;
  UPDATE world_states SET xp = v_xp, level = v_level,
    unlocked_biomes = ARRAY(SELECT DISTINCT biome FROM unnest(v_state.unlocked_biomes || ARRAY['forest'] ||
      CASE WHEN v_level >= 21 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 31 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 41 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 51 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome), updated_at = NOW() WHERE couple_id = p_couple_id;
  v_items := world_normalize_items(p_items);
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
    IF (v_item->>'quantity')::INT <= 0 THEN RAISE EXCEPTION 'Invalid reward quantity'; END IF;
    INSERT INTO world_inventory (couple_id, item_type, item_id, quantity)
    VALUES (p_couple_id, v_item->>'item_type', v_item->>'item_id', (v_item->>'quantity')::INT)
    ON CONFLICT (couple_id, item_type, item_id) DO UPDATE SET quantity = world_inventory.quantity + EXCLUDED.quantity;
  END LOOP;
  INSERT INTO world_activity_log (couple_id, activity_type, activity_key, xp_granted, items_granted, granted_by)
  VALUES (p_couple_id, p_activity_type, p_activity_key, p_xp, v_items, auth.uid());
  RETURN jsonb_build_object('success', true, 'xp_granted', p_xp, 'level', v_level, 'xp', v_xp,
    'xp_to_next', public.world_xp_to_next(v_level),
    'leveled_up', v_level > v_state.level, 'old_level', v_state.level, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_daily(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_completed BOOLEAN;
  v_xp INT := 15;
  v_today DATE := get_today_santiago();
  v_key TEXT := 'daily:couple:' || v_today::TEXT;
  v_object world_object_catalog;
  v_items JSONB;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level,(forest_completed_at IS NOT NULL OR 'garden'=ANY(unlocked_biomes)) INTO v_level,v_completed FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_type='daily'
    AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;
  SELECT * INTO v_object FROM world_object_catalog WHERE required_level <= v_level AND reward_kind='level' AND (required_level<21 OR v_completed) ORDER BY random() LIMIT 1;
  v_items := jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  v_xp := v_xp * public.world_daily_xp_multiplier(p_couple_id);
  v_result := grant_world_xp(p_couple_id, 'daily', v_key, v_xp, v_items);
  UPDATE world_states SET last_daily_date = v_today WHERE couple_id = p_couple_id;
  RETURN v_result;
END;
$$;

-- Kept as a harmless compatibility endpoint for older clients.
CREATE OR REPLACE FUNCTION public.claim_streak_milestones(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  RETURN jsonb_build_object('success',true,'claimed_any',false,'xp_granted',0,'level',v_state.level,'xp',v_state.xp,'items_granted','[]'::JSONB);
END;
$$;
UPDATE world_streak_milestones SET xp_reward=0;

-- The client chooses an object, never an XP amount or arbitrary reward items.
CREATE OR REPLACE FUNCTION public.interact_world_object(p_couple_id UUID,p_object_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT EXISTS(SELECT 1 FROM world_placed_objects o JOIN world_states s ON s.couple_id=o.couple_id
    WHERE o.id=p_object_id AND o.couple_id=p_couple_id AND o.biome_id=s.current_biome) THEN RAISE EXCEPTION 'Object not found in current biome'; END IF;
  RETURN grant_world_xp(p_couple_id,'interaction','interact:' || p_object_id,5,'[]'::JSONB);
END;
$$;
REVOKE ALL ON FUNCTION public.grant_world_xp(UUID,TEXT,TEXT,INT,JSONB) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.world_daily_xp_multiplier(UUID),public.interact_world_object(UUID,UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.world_daily_xp_multiplier(UUID),public.interact_world_object(UUID,UUID) TO authenticated;
UPDATE world_states SET progression_version=4 WHERE progression_version<4;
ALTER TABLE world_states ALTER COLUMN progression_version SET DEFAULT 4;
NOTIFY pgrst, 'reload schema';
COMMIT;
