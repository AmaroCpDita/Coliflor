-- ============================================================
-- Coliflor — Database Migration v010
-- Adds hero_image_path to couples table
-- ============================================================

ALTER TABLE couples ADD COLUMN IF NOT EXISTS hero_image_path TEXT;
