-- ============================================================
-- Coliflor — Migration v004: Note Timestamps
-- ============================================================
-- Adds timestamp tracking for when each user updates their note.
-- ============================================================

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS user1_note_updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS user2_note_updated_at TIMESTAMPTZ DEFAULT NOW();
