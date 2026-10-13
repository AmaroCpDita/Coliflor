interface HeroAlbumPlayback {
  key: string;
  order: string[];
  index: number;
}

// Signed URL tokens renew; the storage object is still the same photograph.
export function heroPhotoIdentity(url: string): string {
  return url.split('?')[0];
}

export function heroPlaybackKey(images: string[], albumId?: string): string {
  const identities = [...new Set(images.map(heroPhotoIdentity))].sort();
  return `coliflor_hero_playback:${JSON.stringify([albumId || 'local', identities])}`;
}

export function loadHeroPlayback(key: string, images: string[]): HeroAlbumPlayback {
  const identities = [...new Set(images.map(heroPhotoIdentity))];
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (
      Array.isArray(saved?.order) &&
      saved.order.length === identities.length &&
      new Set(saved.order).size === identities.length &&
      saved.order.every(
        (identity: unknown) => typeof identity === 'string' && identities.includes(identity),
      ) &&
      saved.order.includes(saved.current)
    ) {
      return { key, order: saved.order, index: saved.order.indexOf(saved.current) };
    }
  } catch {
    // Private browsing or unavailable storage must not stop the album.
  }

  // Shuffle a complete round so every photo appears before one repeats.
  for (let index = identities.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [identities[index], identities[other]] = [identities[other], identities[index]];
  }
  return { key, order: identities, index: 0 };
}

export function saveHeroPlayback(playback: HeroAlbumPlayback, index: number): void {
  if (!playback.order[index]) return;
  try {
    sessionStorage.setItem(
      playback.key,
      JSON.stringify({ order: playback.order, current: playback.order[index] }),
    );
  } catch {
    // Playback still works when the browser does not allow session storage.
  }
}
