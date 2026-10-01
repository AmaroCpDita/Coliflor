-- ============================================================
-- Coliflor — Database Migration v006
-- Adds birthday column to profiles
-- ============================================================

-- 1. Agregar la columna a la tabla perfiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;

-- 2. Actualizar los cumpleaños
-- Usuario 1
UPDATE profiles SET birthday = '2005-03-14' WHERE display_name ILIKE '%usuario 1%';

-- Usuario 2
UPDATE profiles SET birthday = '2007-06-28' WHERE display_name ILIKE '%usuario 2%';

