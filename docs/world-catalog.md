# Garden catalog rollout

Current pacing update: migration 016 supersedes the level/quantity distribution from 015. See `docs/world-pacing.md` for gradual unlocks, shared daily rewards, bounded decorative XP and rollout instructions.

The frontend includes adult-tree compatibility, 22 new illustrations, inventory previews, a collection with level requirements, night fireflies and one-time level claims. All 27 placeable catalog objects now resolve to individual image assets. The natural plot remains empty until the couple places its inventory objects.

Apply the entire `supabase/migrations/015_world_catalog.sql` in the linked project's Supabase SQL Editor after migrations 013 and 014, then reload the app. This migration was tested locally; it has **not** been applied to the remote project from this session. No remote database connector or authenticated SQL session was available. A public, unauthenticated diagnostic confirmed that `claim_world_catalog` is missing (HTTP 404 / PGRST202). Existing seed records still display and place as adult objects on the frontend while the migration is pending. The inventory distinguishes an unavailable catalog from transient failures: missing-function responses show a pending-availability notice without a futile retry button; network/permission/server errors remain retryable. No client-side substitute grants items.

Migration 015 converts legacy quantities and placed-object identifiers, preserves object UUIDs/coordinates, normalizes future daily/streak rewards, grants catalog items once per couple and eligible level, and serializes reward/stock operations. Welcome items are granted only when a new world is created. Existing empty inventories are never replenished by initialization. Objects stay in inventory until placed; removing one returns exactly one copy.

Validation:

- `npm run build`
- `node scripts/check-world-editor.mjs`: server-rendered world, canonical inventory totals, catalog/SQL agreement, projection/drag math, bounds, asset availability and day/night lighting. This is not a real browser interaction test.
- `node scripts/check-world-catalog-sql.mjs`: actual PostgreSQL via an isolated in-memory PGlite database, applying 013, 014 and 015. Covers stock conversion, progressive and repeated claims, both members sharing claims, unauthorized callers, XP preservation, placement/return quantities, daily/streak idempotency and empty-world initialization.

The optional SQL-test dependency was installed outside the app dependency graph:

```powershell
npm install --no-save --package-lock=false --ignore-scripts --prefix tmp.local/sql-check --cache tmp.local/npm-cache @electric-sql/pglite
node scripts/check-world-catalog-sql.mjs
```

No app package manifest or lockfile was changed for the SQL test. Real browser interaction and remote database behavior still need a check after rollout. Artwork paths and exact generation prompts are recorded in `docs/world-artwork.md`.

## Facing direction

Rollout update: the user reported applying migration 015. A follow-up anonymous diagnostic now reaches the RPC and receives the expected permission rejection (42501), rather than a missing-function response. Authenticated reward delivery has not been tested from this session.

The hammer toolbar now includes **Voltear**, a horizontal mirror around the object's ground anchor. Pressing it again restores the original direction. The sprite remains upright, and night lights/fireflies follow the mirrored sprite coordinates. Facing is saved in the existing `world_placed_objects.state.flipped` field, using the existing couple-scoped update policy; no additional migration is required. Existing metadata is retained. Ordinary flips change only state; an asymmetric object at a world edge can also be nudged just enough to keep its mirrored footprint inside the frame. Moves use the mirrored footprint for bounds. Failed saves revert the preview and show an error.

The editor checks cover sprite mirroring, light alignment, legacy null state, edge bounds, metadata preservation, scoped persistence and missing/failed updates. Browser interaction remains unverified in this session.
