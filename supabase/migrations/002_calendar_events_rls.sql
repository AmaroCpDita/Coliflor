-- ============================================================
-- Coliflor — Database Migration v002
-- ============================================================
-- Fix RLS (Row Level Security) para calendar_events para permitir que ambos eliminen
-- las notas del otro (siempre que pertenezcan a su pareja).

-- Asegurarnos de que el RLS esté activo
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Eliminar posibles políticas de DELETE anteriores para reemplazarlas
DROP POLICY IF EXISTS "calendar_events_delete" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete_policy" ON calendar_events;

-- Crear una nueva política de eliminación que permita a CUALQUIERA de la pareja
-- eliminar cualquier nota que pertenezca a la relación (couple_id).
CREATE POLICY "calendar_events_delete_policy" ON calendar_events
  FOR DELETE TO authenticated
  USING (
    couple_id IN (
      SELECT c.id FROM couples c
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  );
