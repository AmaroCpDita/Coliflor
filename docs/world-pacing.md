# Longer biome progression

Current forest chapter supersedes this initial balance: use `supabase/forest-rollout.sql` and see `docs/forest-chapter.md` for the eight-to-ten-week target, level-21 finale, journal, new artwork and completion requirements.

Apply the complete `supabase/migrations/016_world_pacing.sql` in the Supabase SQL Editor after migration 015, then reload the app. This session prepared and tested the migration locally; it has not applied it remotely. Until rollout, the HUD uses the legacy XP curve when `progression_version` is absent or 1. Migration 016 sets version 2 atomically with the server functions.

## Unlocks

New worlds receive seven common items across four types, all in inventory. The scene remains empty until they place them. Every level from 2 through 24 introduces one object type, with one to three copies rather than large bundles. Level 9 reveals twelve catalog types instead of twenty. The forest finishes with the well at 12 and treehouse at 13; garden flowers and structures are spread across levels 14–24.

Biome thresholds are forest 1, garden 14, beach 24, magical 34 and mountain 44. Creature thresholds and level-reward descriptions agree with their registries. Object unlock levels/quantities live in `data/pacing.ts`; the reward list is built from the actual registries, and the editor checks verify agreement with the SQL catalog.

## XP and repeat rewards

The first six thresholds keep the existing curve; later thresholds cap at 220 XP. Wider chapters and bounded XP create longer stays without exponentially increasing waits in later chapters. A daily grant is shared by the couple and gives 25, 37 or 50 XP according to streak. Its extra item is an eligible catalog object, rather than a locked orchid. Unclaimed streak milestones award at most 50 XP each; locked catalog items are replaced with common flowers. Already-claimed milestones and unknown special milestone items are retained.

Placement XP is five per object type, once for the couple, with a daily budget of fifteen. Removing and replacing a type cannot generate more XP. Interactions are five per type per Santiago day, with a shared fifteen-XP daily budget; extra copies and replaced object UUIDs do not bypass it. These limits are enforced by the server under the existing couple lock. The server derives type and date from a real owned placement rather than trusting the submitted key.

The design target is roughly four to six weeks for active biome chapters. An illustrative calculation using 50–65 XP each day plus the capped streak milestones reaches the garden in 34–43 days; subsequent ten-level chapters take roughly 32–43 days. This excludes placement bonuses and assumes consistent usage; actual timing varies with streak, interactions and other XP grants. It is a balancing estimate, not a measured player cohort or a guaranteed time gate.

## Existing worlds

Levels never decrease. Progress within the current level is retained proportionally when its threshold changes. Previously available biomes, the current biome, inventory, placements and their orientation are preserved. Historical item grants and owned types get zero-value per-item claim markers, so reorganizing level groups does not hand out duplicates. Reapplying the SQL is safe and does not scale XP again.

The current art catalog mainly serves forest and garden. Later biomes still need their own object collections; changing level thresholds alone does not fill those chapters with new content. The existing biome-selection callback also remains a placeholder. This migration changes progression and reward delivery, not that navigation feature.

## Validation

- `npm run build`
- `node scripts/check-world-editor.mjs`: catalog/SQL quantities and levels, all biome/creature reward thresholds, gradual unlocks, XP version compatibility and curve round trips, plus existing editor checks.
- `node scripts/check-world-catalog-sql.mjs`: actual isolated PostgreSQL via PGlite, applying 013–016, preserving levels/stock/biomes/progress, historical claims, safe replay, small welcome inventory, streak/daily eligibility, shared daily claim, repeat-placement prevention, interaction/placement budgets and authorization.

No authenticated remote database or live browser test was available.
