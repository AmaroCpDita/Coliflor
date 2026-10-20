import assert from 'node:assert/strict';
import { readyHeroAlbumImages } from '../src/lib/heroAlbumImages.ts';

globalThis.window = globalThis;
let finishDecode;
globalThis.Image = class {
  set src(url) {
    setTimeout(() => {
      if (url === 'broken') this.onerror?.();
      else this.onload?.();
    }, 0);
  }
  decode() {
    return new Promise((resolve) => {
      finishDecode = resolve;
    });
  }
};

let settled = false;
const loading = readyHeroAlbumImages(['ready']);
void loading.then(() => { settled = true; });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(settled, false, 'The album must wait for decoding, not only downloading');
finishDecode();
assert.deepEqual(await loading, ['ready']);

assert.deepEqual(await readyHeroAlbumImages(['broken']), [], 'Broken photos cannot enter playback');
console.log('Hero album image readiness checks passed.');
