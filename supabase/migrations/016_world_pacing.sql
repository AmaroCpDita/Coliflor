-- Longer biome chapters, gradual catalog rewards and bounded decorative XP.
-- Apply after 015. Keeps earned objects, levels, progress fraction and open biomes.
BEGIN;
CREATE OR REPLACE FUNCTION public.world_xp_to_next(p_level INT) RETURNS INT
LANGUAGE SQL IMMUTABLE SET search_path=public AS $$
  SELECT LEAST(220, FLOOR(100 * POWER(1.15, GREATEST(1,p_level) - 1))::INT);
$$;
ALTER TABLE public.world_states ADD COLUMN IF NOT EXISTS progression_version INT NOT NULL DEFAULT 1;

-- Only convert each existing world once. Never recalculate or reduce its level.
UPDATE public.world_states SET
  xp = LEAST(world_xp_to_next(level)-1, FLOOR(xp::NUMERIC / GREATEST(1,FLOOR(100 * POWER(1.15,level-1))) * world_xp_to_next(level))::INT),
  unlocked_biomes = ARRAY(SELECT DISTINCT biome FROM unnest(unlocked_biomes || ARRAY[current_biome,'forest'] ||
    CASE WHEN level >= 10 THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
    CASE WHEN level >= 15 THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
    CASE WHEN level >= 25 THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
    CASE WHEN level >= 30 THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome),
  progression_version=2
WHERE progression_version < 2;
ALTER TABLE public.world_states ALTER COLUMN progression_version SET DEFAULT 2;

-- Historical grants and current possessions consume the new per-item unlock key.
-- Markers grant nothing and preserve stock, placements and historical claim rows.
INSERT INTO world_activity_log(couple_id,activity_type,activity_key,xp_granted,items_granted,granted_by)
SELECT s.couple_id,'catalog_unlock','catalog:v4:item:' || c.item_id,0,'[]'::JSONB,p.user1_id
FROM world_states s JOIN couples p ON p.id=s.couple_id CROSS JOIN world_object_catalog c
WHERE EXISTS (SELECT 1 FROM world_inventory i WHERE i.couple_id=s.couple_id AND world_object_id(i.item_id)=c.item_id)
   OR EXISTS (SELECT 1 FROM world_placed_objects o WHERE o.couple_id=s.couple_id AND world_object_id(o.item_id)=c.item_id)
   OR EXISTS (SELECT 1 FROM world_activity_log a CROSS JOIN LATERAL jsonb_array_elements(a.items_granted) e
      WHERE a.couple_id=s.couple_id AND world_object_id(e->>'item_id')=c.item_id)
ON CONFLICT(couple_id,activity_key) DO NOTHING;

INSERT INTO world_activity_log(couple_id,activity_type,activity_key,xp_granted,items_granted,granted_by)
SELECT DISTINCT o.couple_id,'placement','placement:first:' || o.item_id,0,'[]'::JSONB,p.user1_id
FROM world_placed_objects o JOIN couples p ON p.id=o.couple_id
ON CONFLICT(couple_id,activity_key) DO NOTHING;

INSERT INTO public.world_object_catalog(item_id,item_type,required_level,reward_quantity) VALUES
  ('oak_tree','tree',1,1),
  ('basic_flower','flower',1,3),
  ('wild_grass','plant',1,1),
  ('stone_small','rock',1,2),
  ('mushroom_red','plant',2,2),
  ('bush','plant',3,2),
  ('wooden_bench','decoration',4,1),
  ('fern','plant',5,2),
  ('pine_tree','tree',6,2),
  ('lantern','decoration',7,1),
  ('firefly_bush','plant',8,1),
  ('birch_tree','tree',9,1),
  ('glowing_mushrooms','plant',10,1),
  ('picnic_table','decoration',11,1),
  ('wishing_well','building',12,1),
  ('treehouse','building',13,1),
  ('willow_tree','tree',14,1),
  ('daisy','flower',15,3),
  ('tulip','flower',16,2),
  ('sunflower','flower',17,2),
  ('rose','flower',18,2),
  ('flower_bed','flower',19,1),
  ('fountain','building',20,1),
  ('garden_arch','decoration',21,1),
  ('pond_bridge','decoration',22,1),
  ('garden_swing','decoration',23,1),
  ('rare_orchid','flower',24,1)
ON CONFLICT(item_id) DO UPDATE SET required_level=EXCLUDED.required_level, reward_quantity=EXCLUDED.reward_quantity;

UPDATE world_streak_milestones SET xp_reward=LEAST(xp_reward,50);

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
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
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
    p_xp := LEAST(5, GREATEST(0, p_xp), GREATEST(0, 15 - v_spent));
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
      CASE WHEN v_level >= 14 THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 24 THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 34 THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 44 THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome), updated_at = NOW() WHERE couple_id = p_couple_id;
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

CREATE OR REPLACE FUNCTION public.claim_world_catalog(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_reward RECORD;
  v_result JSONB;
  v_items JSONB := '[]'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level INTO v_level FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  FOR v_reward IN
    SELECT item_id, jsonb_build_array(jsonb_build_object('item_type', item_type, 'item_id', item_id, 'quantity', reward_quantity)) AS items
    FROM world_object_catalog WHERE required_level BETWEEN 2 AND v_level ORDER BY required_level, item_id
  LOOP
    v_result := grant_world_xp(p_couple_id, 'catalog_unlock', 'catalog:v4:item:' || v_reward.item_id, 0, v_reward.items);
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN, false) THEN v_items := v_items || (v_result->'items_granted'); END IF;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'claimed_any', jsonb_array_length(v_items) > 0,
    'level', v_level, 'xp_granted', 0, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_daily(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_streak INT;
  v_xp INT := 25;
  v_today DATE := get_today_santiago();
  v_key TEXT := 'daily:couple:' || v_today::TEXT;
  v_object world_object_catalog;
  v_items JSONB;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level INTO v_level FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_type='daily'
    AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;
  SELECT * INTO v_object FROM world_object_catalog WHERE required_level <= v_level ORDER BY random() LIMIT 1;
  v_items := jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  SELECT current_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  IF v_streak >= 7 THEN
    v_xp := v_xp * 2;
    v_items := v_items || jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  ELSIF v_streak >= 3 THEN v_xp := FLOOR(v_xp * 1.5); END IF;
  v_result := grant_world_xp(p_couple_id, 'daily', v_key, v_xp, v_items);
  UPDATE world_states SET last_daily_date = v_today WHERE couple_id = p_couple_id;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_streak_milestones(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_streak INT;
  v_milestone RECORD;
  v_result JSONB;
  v_xp INT := 0;
  v_level INT;
  v_old_level INT;
  v_safe_items JSONB;
  v_items JSONB := '[]'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT level INTO v_old_level FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT max_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  v_level := v_old_level;
  FOR v_milestone IN SELECT * FROM world_streak_milestones m WHERE day <= COALESCE(v_streak, 0)
    AND NOT EXISTS (SELECT 1 FROM world_claimed_milestones c WHERE c.couple_id = p_couple_id AND c.milestone_day = m.day) ORDER BY day
  LOOP
    SELECT COALESCE(jsonb_agg(CASE WHEN c.item_id IS NULL OR c.required_level <= v_level THEN entry
      ELSE jsonb_build_object('item_type','flower','item_id','basic_flower','quantity',COALESCE((entry->>'quantity')::INT,1)) END),'[]'::JSONB)
      INTO v_safe_items FROM jsonb_array_elements(v_milestone.items_reward) entry
      LEFT JOIN world_object_catalog c ON c.item_id=world_object_id(entry->>'item_id');
    v_result := grant_world_xp(p_couple_id, 'streak_milestone', 'streak_' || v_milestone.day, v_milestone.xp_reward, v_safe_items);
    INSERT INTO world_claimed_milestones (couple_id, milestone_day) VALUES (p_couple_id, v_milestone.day) ON CONFLICT DO NOTHING;
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN, false) THEN
      v_xp := v_xp + (v_result->>'xp_granted')::INT;
      v_items := v_items || (v_result->'items_granted');
    END IF;
    v_level := (v_result->>'level')::INT;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'claimed_any', v_xp > 0 OR jsonb_array_length(v_items) > 0,
    'xp_granted', v_xp, 'level', v_level, 'leveled_up', v_level > v_old_level, 'items_granted', v_items);
END;
$$;

COMMIT;
