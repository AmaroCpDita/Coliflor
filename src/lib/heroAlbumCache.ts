const CACHE_LIFETIME_MS = 50 * 60 * 1000;

interface CachedHeroAlbum {
  entries: Array<{ path: string; url: string; expiresAt: number }>;
}

function cacheKey(coupleId: string): string {
  return `coliflor_hero_images:${coupleId}`;
}

export function readCachedHeroImages(coupleId: string, paths: string[]): string[] {
  if (!paths.length) return [];
  try {
    const cached = JSON.parse(
      localStorage.getItem(cacheKey(coupleId)) || 'null',
    ) as CachedHeroAlbum | null;
    if (
      !cached ||
      !Array.isArray(cached.entries) ||
      cached.entries.length !== paths.length ||
      !paths.every(
        (path, index) =>
          cached.entries[index]?.path === path &&
          typeof cached.entries[index]?.url === 'string' &&
          cached.entries[index].url.length > 0 &&
          cached.entries[index].expiresAt > Date.now(),
      )
    )
      return [];
    return cached.entries.map((entry) => entry.url);
  } catch {
    return [];
  }
}

export function saveCachedHeroImages(coupleId: string, paths: string[], urls: string[]): void {
  try {
    if (!paths.length || paths.length !== urls.length || urls.some((url) => !url)) {
      localStorage.removeItem(cacheKey(coupleId));
      return;
    }
    const previous = JSON.parse(
      localStorage.getItem(cacheKey(coupleId)) || 'null',
    ) as CachedHeroAlbum | null;
    const previousEntries = Array.isArray(previous?.entries) ? previous.entries : [];
    const entries = paths.map((path, index) => {
      const old = previousEntries.find((entry) => entry.path === path && entry.url === urls[index]);
      return {
        path,
        url: urls[index],
        expiresAt: old?.expiresAt ?? Date.now() + CACHE_LIFETIME_MS,
      };
    });
    localStorage.setItem(cacheKey(coupleId), JSON.stringify({ entries } satisfies CachedHeroAlbum));
  } catch {
    // Album playback also works without local storage.
  }
}
