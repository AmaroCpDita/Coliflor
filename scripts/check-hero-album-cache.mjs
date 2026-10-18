import assert from 'node:assert/strict';
import { readCachedHeroImages, saveCachedHeroImages } from '../src/lib/heroAlbumCache.ts';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};

const key = 'coliflor_hero_images:couple-a';
storage.set(key, JSON.stringify(['expired-old-url']));
assert.deepEqual(readCachedHeroImages('couple-a', ['a.jpg']), []);

saveCachedHeroImages('couple-a', ['a.jpg', 'b.jpg'], ['url-a', 'url-b']);
assert.deepEqual(readCachedHeroImages('couple-a', ['a.jpg', 'b.jpg']), ['url-a', 'url-b']);
assert.deepEqual(readCachedHeroImages('couple-b', ['a.jpg', 'b.jpg']), []);
assert.deepEqual(readCachedHeroImages('couple-a', ['b.jpg', 'a.jpg']), []);

const cached = JSON.parse(storage.get(key));
cached.entries[0].expiresAt = Date.now() - 1;
storage.set(key, JSON.stringify(cached));
assert.deepEqual(readCachedHeroImages('couple-a', ['a.jpg', 'b.jpg']), []);

saveCachedHeroImages('couple-a', [], []);
assert.equal(storage.has(key), false);
console.log('Hero album cache checks passed.');
