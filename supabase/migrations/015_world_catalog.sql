-- Adult trees, illustrated garden collection and one-time level rewards.
-- Keeps all existing stock, placed-object IDs, positions and historical claims.
BEGIN;

CREATE TABLE IF NOT EXISTS public.world_object_catalog (
  item_id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type <> 'seed'),
  required_level INT NOT NULL CHECK (required_level >= 1),
  reward_quantity INT NOT NULL CHECK (reward_quantity > 0)
);
ALTER TABLE public.world_object_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY world_catalog_read ON public.world_object_catalog FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.world_object_catalog TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.world_object_catalog FROM anon, authenticated;

-- Matches the item rewards in data/progression.ts. Level 1 is the welcome pack.
INSERT INTO public.world_object_catalog VALUES
  ('oak_tree','tree',1,3), ('basic_flower','flower',1,5),
  ('wild_grass','plant',1,2), ('stone_small','rock',1,4), ('mushroom_red','plant',1,2),
  ('pine_tree','tree',2,2), ('bush','plant',2,2), ('daisy','flower',2,3), ('fern','plant',2,2),
  ('wooden_bench','decoration',3,1), ('lantern','decoration',3,2),
  ('firefly_bush','plant',4,2), ('birch_tree','tree',5,2), ('tulip','flower',5,3),
  ('flower_bed','flower',6,2), ('sunflower','flower',7,2), ('rose','flower',7,2),
  ('garden_arch','decoration',7,1), ('glowing_mushrooms','plant',8,2),
  ('picnic_table','decoration',9,1), ('willow_tree','tree',10,1),
  ('fountain','building',10,1), ('rare_orchid','flower',10,1),
  ('pond_bridge','decoration',12,1), ('wishing_well','building',16,1),
  ('garden_swing','decoration',18,1), ('treehouse','building',20,1)
ON CONFLICT (item_id) DO UPDATE SET item_type = EXCLUDED.item_type,
  required_level = EXCLUDED.required_level, reward_quantity = EXCLUDED.reward_quantity;

CREATE OR REPLACE FUNCTION public.world_object_id(p_id TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_id
    WHEN 'oak_seed' THEN 'oak_tree' WHEN 'pine_seed' THEN 'pine_tree'
    WHEN 'birch_seed' THEN 'birch_tree' WHEN 'willow_seed' THEN 'willow_tree'
    WHEN 'palm_seed' THEN 'willow_tree' WHEN 'stone_bench' THEN 'wooden_bench'
    WHEN 'golden_seed' THEN 'firefly_bush' ELSE p_id END;
$$;

CREATE OR REPLACE FUNCTION public.world_normalize_items(p_items JSONB)
RETURNS JSONB LANGUAGE SQL STABLE SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'item_id', world_object_id(entry->>'item_id'),
    'item_type', COALESCE(c.item_type, entry->>'item_type'),
    'quantity', COALESCE((entry->>'quantity')::INT, 1)
  ) ORDER BY ordinal), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) WITH ORDINALITY AS entries(entry, ordinal)
  LEFT JOIN world_object_catalog c ON c.item_id = world_object_id(entry->>'item_id');
$$;

-- Delete only legacy rows, then merge their quantities into the canonical stock.
WITH legacy AS (
  DELETE FROM public.world_inventory i USING public.world_object_catalog c
  WHERE c.item_id = world_object_id(i.item_id)
    AND (i.item_id <> c.item_id OR i.item_type <> c.item_type)
  RETURNING i.couple_id, i.item_id, i.quantity, i.acquired_at
), totals AS (
  SELECT l.couple_id, c.item_id, c.item_type, SUM(l.quantity)::INT quantity, MIN(l.acquired_at) acquired_at
  FROM legacy l JOIN public.world_object_catalog c ON c.item_id = world_object_id(l.item_id)
  GROUP BY l.couple_id, c.item_id, c.item_type
)
INSERT INTO public.world_inventory (couple_id, item_type, item_id, quantity, acquired_at)
SELECT couple_id, item_type, item_id, quantity, acquired_at FROM totals
ON CONFLICT (couple_id, item_type, item_id) DO UPDATE
SET quantity = world_inventory.quantity + EXCLUDED.quantity,
    acquired_at = LEAST(world_inventory.acquired_at, EXCLUDED.acquired_at);

UPDATE public.world_placed_objects o SET item_id = c.item_id, item_type = c.item_type
FROM public.world_object_catalog c WHERE c.item_id = world_object_id(o.item_id)
  AND (o.item_id <> c.item_id OR o.item_type <> c.item_type);
UPDATE public.world_streak_milestones SET items_reward = world_normalize_items(items_reward);

-- Serialize all grants for a couple before checking the unique claim key.
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
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id = p_couple_id AND activity_key = p_activity_key) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'level', v_state.level, 'xp', v_state.xp);
  END IF;
  p_xp := LEAST(5000, GREATEST(0, COALESCE(p_xp, 0)));
  v_xp := v_state.xp + p_xp;
  v_level := v_state.level;
  WHILE v_level < 100 LOOP
    v_needed := FLOOR(100 * POWER(1.15, v_level - 1))::INT;
    EXIT WHEN v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  END LOOP;
  UPDATE world_states SET xp = v_xp, level = v_level, updated_at = NOW() WHERE couple_id = p_couple_id;
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
    'xp_to_next', FLOOR(100 * POWER(1.15, v_level - 1))::INT,
    'leveled_up', v_level > v_state.level, 'old_level', v_state.level, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.init_world(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_state world_states;
  v_items JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO world_states (couple_id) VALUES (p_couple_id) ON CONFLICT (couple_id) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object('item_type', item_type, 'item_id', item_id, 'quantity', reward_quantity))
    INTO v_items FROM world_object_catalog WHERE required_level = 1;
    PERFORM grant_world_xp(p_couple_id, 'welcome', 'catalog:v3:welcome', 0, v_items);
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id;
  RETURN to_jsonb(v_state);
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
    SELECT required_level, jsonb_agg(jsonb_build_object('item_type', item_type, 'item_id', item_id, 'quantity', reward_quantity) ORDER BY item_id) AS items
    FROM world_object_catalog WHERE required_level BETWEEN 2 AND v_level GROUP BY required_level ORDER BY required_level
  LOOP
    v_result := grant_world_xp(p_couple_id, 'catalog_unlock', 'catalog:v3:level:' || v_reward.required_level, 0, v_reward.items);
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN, false) THEN v_items := v_items || (v_result->'items_granted'); END IF;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'claimed_any', jsonb_array_length(v_items) > 0,
    'level', v_level, 'xp_granted', 0, 'items_granted', v_items);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_world_catalog(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_world_catalog(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_world_daily(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_streak INT;
  v_xp INT := 25;
  v_today DATE := get_today_santiago();
  v_key TEXT := 'daily:' || auth.uid()::TEXT || ':' || v_today::TEXT;
  v_object world_object_catalog;
  v_items JSONB;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level INTO v_level FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT * INTO v_object FROM world_object_catalog WHERE required_level <= v_level ORDER BY random() LIMIT 1;
  v_items := jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  SELECT current_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  IF v_streak >= 7 THEN
    v_xp := v_xp * 2;
    v_items := v_items || jsonb_build_array(jsonb_build_object('item_type', 'flower', 'item_id', 'rare_orchid', 'quantity', 1));
  ELSIF v_streak >= 3 THEN v_xp := FLOOR(v_xp * 1.5); END IF;
  v_result := grant_world_xp(p_couple_id, 'daily', v_key, v_xp, v_items);
  UPDATE world_states SET last_daily_date = v_today WHERE couple_id = p_couple_id;
  RETURN v_result;
END;
$$;

-- Claim and grant in the same locked loop; avoid time-window based reclaims.
CREATE OR REPLACE FUNCTION public.claim_streak_milestones(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_streak INT;
  v_milestone RECORD;
  v_result JSONB;
  v_xp INT := 0;
  v_level INT;
  v_old_level INT;
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
    v_result := grant_world_xp(p_couple_id, 'streak_milestone', 'streak_' || v_milestone.day, v_milestone.xp_reward, v_milestone.items_reward);
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

-- Keep stock operations in the same lock order as reward grants.
CREATE OR REPLACE FUNCTION public.place_world_object(
  p_couple_id UUID, p_biome_id TEXT, p_item_type TEXT, p_item_id TEXT,
  p_x DOUBLE PRECISION, p_y DOUBLE PRECISION,
  p_scale DOUBLE PRECISION DEFAULT 1, p_rotation DOUBLE PRECISION DEFAULT 0
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_catalog world_object_catalog;
  v_inventory_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  PERFORM 1 FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT * INTO v_catalog FROM world_object_catalog WHERE item_id = world_object_id(p_item_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown world object'; END IF;
  UPDATE world_inventory SET quantity = quantity - 1
  WHERE couple_id = p_couple_id AND item_type = v_catalog.item_type AND item_id = v_catalog.item_id AND quantity > 0
  RETURNING id INTO v_inventory_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not in inventory'; END IF;
  DELETE FROM world_inventory WHERE id = v_inventory_id AND quantity = 0;
  INSERT INTO world_placed_objects (couple_id, biome_id, item_type, item_id, position_x, position_y, scale, rotation, placed_by)
  VALUES (p_couple_id, p_biome_id, v_catalog.item_type, v_catalog.item_id, p_x, p_y, p_scale, p_rotation, auth.uid()) RETURNING id INTO v_id;
  PERFORM grant_world_xp(p_couple_id, 'placement', 'place:' || v_id::TEXT, 10, '[]'::jsonb);
  RETURN jsonb_build_object('success', true, 'object_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_world_object(p_object_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_object world_placed_objects;
  v_couple_id UUID;
BEGIN
  SELECT couple_id INTO v_couple_id FROM world_placed_objects WHERE id = p_object_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Object not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = v_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  PERFORM 1 FROM world_states WHERE couple_id = v_couple_id FOR UPDATE;
  DELETE FROM world_placed_objects WHERE id = p_object_id RETURNING * INTO v_object;
  IF NOT FOUND THEN RAISE EXCEPTION 'Object not found'; END IF;
  INSERT INTO world_inventory (couple_id, item_type, item_id, quantity)
  VALUES (v_object.couple_id, v_object.item_type, v_object.item_id, 1)
  ON CONFLICT (couple_id, item_type, item_id) DO UPDATE SET quantity = world_inventory.quantity + 1;
  RETURN jsonb_build_object('success', true);
END;
$$;

COMMIT;
