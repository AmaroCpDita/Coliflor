import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage, parseHeroAlbumPaths, serializeHeroAlbumPaths } from '../lib/utils';
import { saveCachedHeroImages } from '../lib/heroAlbumCache';
import type { Couple } from '../lib/types';
import type { FilmRollItem } from '../components/PhotoFilmRoll';

const MAX_PHOTOS = 20;

async function removeFiles(paths: string[]) {
  if (!paths.length) return;
  try {
    const { error } = await supabase.storage.from('photos').remove(paths);
    if (error) console.warn('Album storage cleanup:', error);
  } catch (error) {
    console.warn('Album storage cleanup:', error);
  }
}

async function removeUnpublishedFiles(id: string, paths: string[]) {
  if (!paths.length) return;
  try {
    const { data, error } = await supabase
      .from('couples')
      .select('hero_image_path')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return;
    const referenced = new Set(parseHeroAlbumPaths(data.hero_image_path));
    await removeFiles(paths.filter((path) => !referenced.has(path)));
  } catch {
    // An uncertain save must never delete photographs the server may have kept.
  }
}

async function signedItems(paths: string[]): Promise<FilmRollItem[]> {
  if (!paths.length) return [];
  const { data } = await supabase.storage.from('photos').createSignedUrls(paths, 3600);
  // Keep unavailable frames in the roll, so reordering never drops their paths.
  return Promise.all(
    paths.map(async (path) => {
      const match = data?.find((item) => item.path === path);
      if (match?.signedUrl) return { path, url: match.signedUrl };
      try {
        const { data: single } = await supabase.storage.from('photos').createSignedUrl(path, 3600);
        return { path, url: single?.signedUrl || '' };
      } catch {
        return { path, url: '' };
      }
    }),
  );
}

async function uploadFile(path: string, blob: Blob) {
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const request = supabase.storage.from('photos').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });
  // If a slow request completes after the timeout, clean its unused object up.
  void request
    .then((result) => {
      if (timedOut && !result.error) void removeFiles([path]);
    })
    .catch(() => {});
  try {
    const result = await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(new Error('La subida tardó demasiado. Revisa tu conexión e inténtalo de nuevo.'));
        }, 30000);
      }),
    ]);
    if (result.error) throw result.error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function useHeroAlbum(
  couple: Couple | null,
  enabled: boolean,
  refreshProfile: () => Promise<void>,
) {
  const [items, setItems] = useState<FilmRollItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<'upload' | 'save' | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const loadVersionRef = useRef(0);
  const rawRef = useRef(couple?.hero_image_path);
  const itemsRef = useRef(items);
  const scopeRef = useRef(couple?.id);
  const mountedRef = useRef(true);
  scopeRef.current = couple?.id;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      loadVersionRef.current += 1;
    };
  }, []);

  const publish = useCallback((id: string, next: FilmRollItem[]) => {
    saveCachedHeroImages(
      id,
      next.map((item) => item.path),
      next.map((item) => item.url),
    );
    if (scopeRef.current !== id || !mountedRef.current) return;
    itemsRef.current = next;
    setItems(next);
  }, []);

  const loadAlbum = useCallback(async () => {
    const id = couple?.id;
    const version = ++loadVersionRef.current;
    if (!id || !enabled) {
      setItems([]);
      itemsRef.current = [];
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await signedItems(parseHeroAlbumPaths(couple.hero_image_path));
      if (version !== loadVersionRef.current || scopeRef.current !== id || !mountedRef.current)
        return;
      publish(id, next);
      if (next.some((item) => !item.url))
        setError('Algunas fotos no cargaron. Actualiza el rollo para reintentarlo.');
    } catch {
      if (version === loadVersionRef.current && mountedRef.current)
        setError('No pudimos cargar el rollo. Inténtalo de nuevo.');
    } finally {
      if (version === loadVersionRef.current && mountedRef.current) setLoading(false);
    }
  }, [couple?.id, couple?.hero_image_path, enabled, publish]);

  useEffect(() => {
    rawRef.current = couple?.hero_image_path;
    void loadAlbum();
    return () => {
      loadVersionRef.current += 1;
    };
  }, [loadAlbum]);

  const savePaths = async (id: string, before: string | null | undefined, paths: string[]) => {
    const raw = serializeHeroAlbumPaths(paths);
    let query = supabase.from('couples').update({ hero_image_path: raw }).eq('id', id);
    query =
      before == null ? query.is('hero_image_path', null) : query.eq('hero_image_path', before);
    try {
      const { data, error: saveError } = await query.select('id');
      if (saveError) throw saveError;
      if (!data?.length)
        throw new Error('El rollo cambió en otro dispositivo. Actualízalo e inténtalo de nuevo.');
    } catch (cause) {
      // The write can succeed even when its response is lost. Confirm the exact
      // saved value before reporting failure or cleaning up newly uploaded files.
      const { data, error } = await supabase
        .from('couples')
        .select('hero_image_path')
        .eq('id', id)
        .maybeSingle();
      if (error || data?.hero_image_path !== raw) throw cause;
    }
    if (scopeRef.current === id) rawRef.current = raw;
  };

  const perform = async (kind: 'upload' | 'save', action: (id: string) => Promise<void>) => {
    if (!couple?.id || !enabled) throw new Error('Vincula tu pareja para guardar fotos.');
    if (busyRef.current) throw new Error('Espera a que termine el cambio anterior.');
    const id = couple.id;
    busyRef.current = true;
    loadVersionRef.current += 1;
    setLoading(false);
    setOperation(kind);
    setError('');
    try {
      await action(id);
    } catch (cause) {
      const message =
        cause && typeof cause === 'object' && 'message' in cause
          ? String(cause.message)
          : 'No pudimos guardar el cambio. Inténtalo de nuevo.';
      if (mountedRef.current && scopeRef.current === id) setError(message);
      await refreshProfile().catch(() => {});
      throw new Error(message);
    } finally {
      busyRef.current = false;
      if (mountedRef.current && scopeRef.current === id) {
        setOperation(null);
        setProgress('');
      }
    }
  };

  const addPhotos = (files: File[], replaceAll = false) =>
    perform('upload', async (id) => {
      const before = rawRef.current;
      const oldPaths = parseHeroAlbumPaths(before);
      const base = replaceAll ? [] : oldPaths;
      const selected = files.slice(0, MAX_PHOTOS - base.length);
      if (!selected.length)
        throw new Error('El rollo está completo. Puedes reemplazarlo o quitar una foto.');
      const uploaded: string[] = [];
      let committed = false;
      let attemptedSave = false;
      let firstFailure = '';
      try {
        for (const [index, file] of selected.entries()) {
          if (mountedRef.current) setProgress(`Foto ${index + 1} de ${selected.length}`);
          try {
            const blob = await compressImage(file, 1600, 0.82);
            const extension =
              blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
            const path = `${id}/hero_${crypto.randomUUID()}.${extension}`;
            await uploadFile(path, blob);
            uploaded.push(path);
          } catch (cause) {
            firstFailure ||=
              cause instanceof Error ? cause.message : 'Revisa el formato o la conexión.';
          }
        }
        if (!uploaded.length || (replaceAll && uploaded.length !== selected.length)) {
          throw new Error(
            replaceAll
              ? `No se pudo reemplazar el rollo. Tus fotos anteriores se conservaron. ${firstFailure}`
              : `No se pudieron subir las fotos. ${firstFailure}`,
          );
        }
        if (mountedRef.current) setProgress('Guardando fotos');
        const paths = [...base, ...uploaded];
        attemptedSave = true;
        await savePaths(id, before, paths);
        committed = true;
        const newItems = await signedItems(uploaded).catch(() =>
          uploaded.map((path) => ({ path, url: '' })),
        );
        const previous = itemsRef.current;
        publish(
          id,
          paths.map(
            (path) =>
              newItems.find((item) => item.path === path) ||
              previous.find((item) => item.path === path) || { path, url: '' },
          ),
        );
        if (replaceAll) await removeFiles(oldPaths.filter((path) => !paths.includes(path)));
        await refreshProfile().catch(() => {});
        if (uploaded.length < selected.length && mountedRef.current)
          setError(`Se guardaron ${uploaded.length} de ${selected.length} fotos. ${firstFailure}`);
      } finally {
        if (!committed) {
          if (attemptedSave) await removeUnpublishedFiles(id, uploaded);
          else await removeFiles(uploaded);
        }
      }
    });

  const reorder = (from: number, to: number) =>
    perform('save', async (id) => {
      const previous = itemsRef.current;
      if (
        JSON.stringify(previous.map((item) => item.path)) !==
        JSON.stringify(parseHeroAlbumPaths(rawRef.current))
      ) {
        throw new Error('El rollo cambió. Actualízalo antes de reordenar las fotos.');
      }
      if (from === to || from < 0 || to < 0 || from >= previous.length || to >= previous.length)
        return;
      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      await savePaths(
        id,
        rawRef.current,
        next.map((item) => item.path),
      );
      publish(id, next);
      await refreshProfile().catch(() => {});
    });

  const deletePhoto = (path: string) =>
    perform('save', async (id) => {
      const before = rawRef.current;
      if (!parseHeroAlbumPaths(before).includes(path)) return;
      const nextPaths = parseHeroAlbumPaths(before).filter((item) => item !== path);
      await savePaths(id, before, nextPaths);
      publish(
        id,
        itemsRef.current.filter((item) => item.path !== path),
      );
      await removeFiles([path]);
      await refreshProfile().catch(() => {});
    });

  const clear = () =>
    perform('save', async (id) => {
      const before = rawRef.current;
      await savePaths(id, before, []);
      publish(id, []);
      await removeFiles(parseHeroAlbumPaths(before));
      await refreshProfile().catch(() => {});
    });

  return {
    items,
    loading,
    saving: operation !== null,
    uploading: operation === 'upload',
    progress,
    error,
    clearError: () => setError(''),
    reload: () => {
      setError('');
      void loadAlbum();
    },
    addPhotos,
    reorder,
    deletePhoto,
    clear,
  };
}
