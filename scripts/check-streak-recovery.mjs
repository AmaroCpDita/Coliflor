import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '../tmp.local/sql-check/node_modules/@electric-sql/pglite/dist/index.js';

const db = new PGlite();
const person = '00000000-0000-0000-0000-000000000001';
const partner = '00000000-0000-0000-0000-000000000002';
const couple = '10000000-0000-0000-0000-000000000001';
const date = '2026-10-18';

await db.exec(`
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$
    SELECT nullif(current_setting('test.uid', true), '')::uuid
  $$;
  CREATE FUNCTION get_today_santiago() RETURNS date LANGUAGE sql AS $$
    SELECT '${date}'::date
  $$;
  CREATE TABLE couples (
    id uuid PRIMARY KEY, user1_id uuid, user2_id uuid,
    current_streak int, max_streak int,
    recoveries_used int DEFAULT 0, recoveries_reset_month date DEFAULT '2026-10-01'
  );
  CREATE TABLE streak_photos (couple_id uuid, user_id uuid, photo_date date);
  CREATE TABLE streak_recoveries (
    couple_id uuid, recovered_date date, used_by uuid,
    UNIQUE (couple_id, recovered_date)
  );
  INSERT INTO couples (id, user1_id, user2_id, current_streak, max_streak)
  VALUES ('${couple}', '${person}', '${partner}', 52, 52);
  SET test.uid = '${person}';
  INSERT INTO streak_photos (couple_id, user_id, photo_date)
  SELECT '${couple}', users.id, days.day::date
  FROM generate_series('${date}'::date - 30, '${date}'::date - 2, '1 day') AS days(day)
  CROSS JOIN (VALUES ('${person}'::uuid), ('${partner}'::uuid)) AS users(id);
`);

const migration = (number, name) =>
  readFileSync(`supabase/migrations/${number}_${name}.sql`, 'utf8');
const count = async () =>
  (await db.query(`SELECT current_streak FROM couples WHERE id = '${couple}'`)).rows[0]
    .current_streak;
const recover = async () =>
  db.query(`SELECT use_streak_recovery('${couple}', '${date}'::date - 1)`);

await db.exec(migration('027', 'recover_own_photo_only'));
await recover();
assert.equal(await count(), 30, 'Reproduces the old 31-day boundary bug');

await db.exec(`
  DELETE FROM streak_recoveries;
  UPDATE couples SET current_streak = 52, recoveries_used = 0;
`);
await db.exec(migration('028', 'preserve_long_streak_on_recovery'));
await recover();
assert.equal(await count(), 53, 'Preserves the 52-day streak with today pending');

await db.exec(`
  DELETE FROM streak_recoveries;
  UPDATE couples SET current_streak = 52, recoveries_used = 0;
  INSERT INTO streak_photos (couple_id, user_id, photo_date)
  VALUES ('${couple}', '${person}', '${date}'), ('${couple}', '${partner}', '${date}');
`);
await recover();
assert.equal(await count(), 53, 'Preserves the long streak with today complete');

await db.exec(`
  DELETE FROM streak_recoveries;
  DELETE FROM streak_photos;
  UPDATE couples SET current_streak = 4, max_streak = 52, recoveries_used = 0;
  INSERT INTO streak_photos (couple_id, user_id, photo_date)
  SELECT '${couple}', users.id, days.day::date
  FROM generate_series('${date}'::date - 5, '${date}'::date - 2, '1 day') AS days(day)
  CROSS JOIN (VALUES ('${person}'::uuid), ('${partner}'::uuid)) AS users(id);
`);
await recover();
assert.equal(await count(), 5, 'A short streak does not inherit an old record');

await db.exec(`
  DELETE FROM streak_recoveries;
  INSERT INTO streak_photos (couple_id, user_id, photo_date)
  VALUES ('${couple}', '${person}', '${date}'::date - 1);
`);
await assert.rejects(recover(), /You already uploaded your photo/);

const affectedCouple = '7b8edae0-65da-44b7-a9b9-8073ecdd607e';
await db.exec(`
  INSERT INTO couples (id, user1_id, user2_id, current_streak, max_streak)
  VALUES ('${affectedCouple}', '${person}', '${partner}', 32, 52);
  INSERT INTO streak_photos (couple_id, user_id, photo_date)
  SELECT '${affectedCouple}', users.id, days.day::date
  FROM generate_series('${date}'::date - 54, '${date}'::date - 1, '1 day') AS days(day)
  CROSS JOIN (VALUES ('${person}'::uuid), ('${partner}'::uuid)) AS users(id);
`);
const affectedCount = async () =>
  (await db.query(`SELECT current_streak FROM couples WHERE id = '${affectedCouple}'`)).rows[0]
    .current_streak;
await db.exec(migration('029', 'restore_existing_long_streak'));
assert.equal(await affectedCount(), 54, 'Restores the exact 54-day run from retained photos');
await db.exec(migration('029', 'restore_existing_long_streak'));
assert.equal(await affectedCount(), 54, 'The repair is safe to replay');
await db.exec(`
  UPDATE couples SET current_streak = 31, max_streak = 52 WHERE id = '${affectedCouple}';
  DELETE FROM streak_photos WHERE couple_id = '${affectedCouple}' AND photo_date < '${date}'::date - 30;
`);
await db.exec(migration('029', 'restore_existing_long_streak'));
assert.equal(await affectedCount(), 52, 'Uses the old record when older photo metadata was pruned');
await db.exec(`
  UPDATE couples SET current_streak = 31 WHERE id = '${affectedCouple}';
  DELETE FROM streak_photos WHERE couple_id = '${affectedCouple}' AND photo_date = '${date}'::date - 5;
`);
await db.exec(migration('029', 'restore_existing_long_streak'));
assert.equal(await affectedCount(), 31, 'A real gap must not inherit the old record');

await db.exec(`
  DELETE FROM streak_photos WHERE couple_id = '${affectedCouple}';
  UPDATE couples SET current_streak = 31, max_streak = 31 WHERE id = '${affectedCouple}';
  INSERT INTO streak_photos (couple_id, user_id, photo_date)
  SELECT '${affectedCouple}', users.id, days.day::date
  FROM generate_series('${date}'::date - 30, '${date}'::date - 1, '1 day') AS days(day)
  CROSS JOIN (VALUES ('${person}'::uuid), ('${partner}'::uuid)) AS users(id);
`);
await db.exec(migration('032', 'restore_and_protect_streak'));
assert.equal(await affectedCount(), 52, 'Restores the August 27 streak from a continuous retained window');
await db.exec(migration('032', 'restore_and_protect_streak'));
assert.equal(await affectedCount(), 52, 'The dated repair is safe to replay');
await db.exec(`
  UPDATE couples SET current_streak = 31 WHERE id = '${affectedCouple}';
  DELETE FROM streak_photos WHERE couple_id = '${affectedCouple}' AND photo_date = '${date}'::date - 5;
`);
await db.exec(migration('032', 'restore_and_protect_streak'));
assert.equal(await affectedCount(), 52, 'The dated repair seals recent gaps and restores streak');

// Test that recovering a gap restores the full streak from streak_start_date (past the 30-day window)
await db.exec(`
  UPDATE couples SET current_streak = 4, max_streak = 75, streak_start_date = '${date}'::date - 75 WHERE id = '${couple}';
  DELETE FROM streak_photos WHERE couple_id = '${couple}';
  DELETE FROM streak_recoveries WHERE couple_id = '${couple}';
  INSERT INTO streak_photos (couple_id, user_id, photo_date)
  SELECT '${couple}', users.id, days.day::date
  FROM generate_series('${date}'::date - 25, '${date}'::date - 2, '1 day') AS days(day)
  CROSS JOIN (VALUES ('${person}'::uuid), ('${partner}'::uuid)) AS users(id);
`);
await recover();
assert.equal(await count(), 75, 'Recovery restores full streak from streak_start_date beyond 30 days');

console.log('Streak recovery boundary checks passed.');
