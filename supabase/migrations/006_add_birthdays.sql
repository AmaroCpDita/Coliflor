-- ============================================================
-- Coliflor — Database Migration v006
-- Adds birthday column to profiles and updates Amaro's data
-- ============================================================

-- 1. Agregar la columna a la tabla perfiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;

-- 2. Actualizar los cumpleaños
-- Amaro
UPDATE profiles SET birthday = '2005-03-14' WHERE display_name ILIKE '%amaro%';

-- Javiera
UPDATE profiles SET birthday = '2007-06-28' WHERE display_name ILIKE '%javiera%';

