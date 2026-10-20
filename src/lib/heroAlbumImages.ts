const IMAGE_TIMEOUT_MS = 15000;
const decodedImages = new Map<string, Promise<HTMLImageElement>>();

// A URL is ready for the album only after the browser can display its pixels.
export function loadHeroAlbumImage(url: string): Promise<HTMLImageElement> {
  const cached = decodedImages.get(url);
  if (cached) return cached;
  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    let finished = false;
    const timer = window.setTimeout(() => finish(new Error('Image timed out')), IMAGE_TIMEOUT_MS);
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error);
      else resolve(image);
    };
    image.onload = () => {
      if (image.decode)
        void image.decode().then(
          () => finish(),
          () => finish(new Error('Image decode failed')),
        );
      else finish();
    };
    image.onerror = () => finish(new Error('Image failed to load'));
    image.src = url;
  });
  decodedImages.set(url, loading);
  void loading.catch(() => {
    if (decodedImages.get(url) === loading) decodedImages.delete(url);
  });
  // Keep decoded pixels alive through the first render and a few album rotations.
  if (decodedImages.size > 40) decodedImages.delete(decodedImages.keys().next().value!);
  return loading;
}

export async function readyHeroAlbumImages(urls: string[]): Promise<string[]> {
  const results = await Promise.allSettled(urls.map(loadHeroAlbumImage));
  return urls.filter((_, index) => results[index].status === 'fulfilled');
}
