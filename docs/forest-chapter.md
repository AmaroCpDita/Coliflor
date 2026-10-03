# Complete first forest chapter

The first chapter now has a full progression and completion flow. Its playable content consists of 23 regular object types, an exclusive completion landmark, and six illustrated visitors unlocked during the chapter. All forest visitors, including the later deer, resolve to real transparent artwork rather than a fallback renderer.

## Rollout

The query no longer uses `forest_legacy_worlds` or any temporary table. Legacy eligibility is read from `world_states.progression_version`, and the version is advanced only after preserving earned rewards and historical visiting dates. If an interrupted older rollout prematurely marked worlds as version 3 without installing the progress RPC, the retry restores that migration eligibility before completing the rollout. Local SQL checks cover both the earlier version and the interrupted version, as well as replay after completion.

Remote check on 2026-10-03: the API returned HTTP 404 / `PGRST202` for `get_forest_progress`, `record_forest_visit` and `switch_world_biome`; `place_world_object` was present and rejected the unauthenticated test call. This explains the unavailable journal and failed biome switching. The check used no session and changed no couple data.

The rollout also preserves use of already earned garden-only rewards: legacy worlds with such inventory or placements keep access to the garden, even below the new level threshold. New worlds still follow chapter completion. A local PostgreSQL check exercises a level-9 legacy world with a fountain, opens the garden and places that fountain successfully.

The combined query ends with a schema-cache reload notification, following the [Supabase schema refresh documentation](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema).

Run the entire `supabase/forest-rollout.sql` in the Supabase SQL Editor after migration 015 and reload the app. It combines migrations 016 and 017 in one atomic transaction, so it works whether 016 has already been applied or not. It was executed in isolated PostgreSQL locally, including replay; it has not been executed against the remote project in this session. Missing forest RPCs leave the existing world usable and show a pending-availability message in the journal.

## Content and pacing

The welcome inventory has seven common items across four types; nothing is automatically placed. Levels 2–20 introduce one new forest object type each. Seven new regular objects are stepping stones, an ivy-covered fence, a birdhouse, a log planter, a birdbath, a wooden forest sign and a small campfire. The well and house finish the regular collection at 19 and 20. New interactions include birdhouse feedback, water bubbles, leaves and the sign's message. The campfire illuminates a limited patch of ground at night; the final landmark also has a local lantern light.

With migration 018, frequent complete daily use is approximately ten to twelve weeks. New worlds must reach level 21, visit on 56 distinct Santiago dates, and claim all five goals before completing the forest and opening the garden. Visits need not be consecutive and missing a day never erases them. A shared date counts once toward the 56 days, while each member's personal visiting days are tracked separately. The XP curve from 016 remains, while 018 replaces historical streak XP with a boost for both photos today. Occasional use or less interaction can take longer than twelve weeks; this is an estimate and a minimum visiting-day requirement, not a guaranteed calendar duration.

The later biome thresholds move to garden 21, beach 31, magical 41 and mountain 51. Previously opened biomes remain accessible. Later chapters still need their own collections and completion designs; this work completes the first chapter.

## Journal and finale

The forest scene has a discreet book icon beside the gift, hammer, inventory and map in the top action row. It is hidden while editing. The journal shows visiting days, level progress, the exclusive landmark and five server-verified goals:

- Place three different object types in the forest.
- Have three trees and four plants placed there.
- Place a bench, a light source and a birdhouse, birdbath or log planter.
- Have each member visit on seven different days.
- Obtain all 23 regular forest types; stored, placed and historically granted items count.

Claimed goals remain credited when the couple rearranges or removes objects. Goal rewards give common decoration copies and no extra XP. Completion percentage remains below 100 until the completion transaction succeeds. The final **Corazón del bosque** is awarded once and cannot appear in normal level/daily rewards. Completing the chapter opens the garden; the journal offers an **Explorar el jardín** action. Biome switching now persists on the server, and returning to the forest retains every placement and orientation. Objects incompatible with the current biome are labeled and disabled in inventory, with the same check enforced during placement on the server.

New garden objects remain behind the chapter completion condition even if the couple's level is high. Completing the forest triggers catalog claims without requiring another level-up. Existing possessions and open biomes are grandfathered. Previous daily-world claims credit earlier visiting dates once during rollout; visits in the garden do not add new forest days. Partner visits update the journal through a couple-filtered realtime subscription; inventory changes also refresh goal status. Placement, interaction and reward limits remain shared and idempotent for the couple.

## Artwork and verification

Fourteen transparent PNGs were created with the built-in imagegen tool and saved under `public/assets/world`. The bench served only as a style reference. Exact prompts and saved filenames are in `docs/forest-artwork.md`. Artwork was inspected on a contact sheet; registry heights use each PNG's native proportions.

Verification:

- `npm run build`
- `node scripts/check-world-editor.mjs`: catalog/SQL agreement, all sprite files/proportions, progressive empty scenes, editor orientation and lights, journal goals/loading/failure/completion states, percentages and map gating.
- `node scripts/check-world-catalog-sql.mjs`: actual isolated PostgreSQL applying migrations 013–018 and the combined rollout. Checks preserved stock/levels/visits, permissions, bounded XP, daily/goal/finale idempotency, unique day and partner tracking, all 23 collection types, premature completion rejection, chapter-gated objects/biomes, real switching and retained forest placements.

No authenticated remote or live browser interaction was available in this session. The SQL rollout and a check with the couple's account are still required to verify deployment.
