const IMAGE_TIMEOUT_MS = 15000;
const decodedImages = new Map<string, Promise<HTMLImageElement>>();

// A URL is ready for the album only after the browser can display its pixels.
export function loadHeroAlbumImage(url: string): Promise<HTMLImageElement> {
  const cached = decodedImages.get(url);
  if (cached) return cached;
  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    let finished = false;
    const timer = window.setTimeout(() => finish(new Error('Image timed out')), IMAGE_TIMEOUT_MS);
    const finish = (error?: Error, image?: HTMLImageElement) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      if (error) reject(error);
      else resolve(image!);
    };
    const start = (forCanvas: boolean) => {
      const image = new Image();
      if (forCanvas) image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (finished) return;
        if (image.decode)
          void image.decode().then(
            () => finish(undefined, image),
            () =>
              image.naturalWidth > 0
                ? finish(undefined, image)
                : finish(new Error('Image decode failed')),
          );
        else finish(undefined, image);
      };
      image.onerror = () => {
        if (finished) return;
        // An image can still be displayed when its host blocks canvas access.
        if (forCanvas) start(false);
        else finish(new Error('Image failed to load'));
      };
      image.src = url;
    };
    start(true);
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
