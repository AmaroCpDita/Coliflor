-- ============================================================
-- Migration 025: Hero images album support
-- ============================================================
-- Supports an array of up to 20 images in the couples table.
-- hero_image_path stores a JSON array string: '["couple_id/hero_1.jpg", "couple_id/hero_2.jpg"]'
-- Backwards compatible with legacy single path strings.

COMMENT ON COLUMN public.couples.hero_image_path IS 'JSON array of up to 20 storage paths for rotating hero album, or legacy single path';
