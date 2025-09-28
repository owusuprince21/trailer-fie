// lib/favorites.ts

export type FavMedia = 'movie' | 'tvs';

export interface FavItem {
  id: number;
  /** Always normalized to 'movie' | 'tvs' */
  media_type: FavMedia;
  /** Always present after normalization (falls back to "name") */
  title: string;
  name?: string; // for legacy items
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

/** Loose/legacy item shape (can include 'tv' and missing fields) */
type FavItemLoose = {
  id: number;
  media_type?: 'movie' | 'tv' | 'tvs';
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type AddFavoriteInput =
  | FavItemLoose
  | (FavItem & { media_type: FavMedia }) // already normalized
  | {
      id: number;
      media_type: FavMedia | 'tv';
      title?: string;
      name?: string;
      poster_path?: string | null;
      release_date?: string;
      first_air_date?: string;
      vote_average?: number;
    };

const KEY = (uid: string) => `tf_favorites_${uid}`;

/* --------------------------------
   Safe JSON helpers (SSR friendly)
----------------------------------*/
function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Notify same-tab listeners
    window.dispatchEvent(
      new CustomEvent('favorites:updated', {
        detail: {
          key,
          count: Array.isArray(value) ? value.length : 0,
        },
      })
    );
    // Cross-tab listeners will get the native "storage" event
  } catch {
    // swallow
  }
}

/* -------------------------
   Normalization / Migration
--------------------------*/
function normalizeMediaType(mt: string | undefined): FavMedia {
  if (mt === 'tv') return 'tvs';
  return mt === 'tvs' ? 'tvs' : 'movie';
}

function normalizeItem(item: FavItemLoose | FavItem): FavItem {
  const media_type = normalizeMediaType((item as FavItemLoose).media_type);
  const title =
    (item as FavItemLoose).title ??
    (item as FavItemLoose).name ??
    (item as FavItem).title ??
    'Untitled';

  return {
    id: item.id,
    media_type,
    title,
    poster_path: (item as FavItemLoose).poster_path ?? null,
    release_date: (item as FavItemLoose).release_date,
    first_air_date: (item as FavItemLoose).first_air_date,
    vote_average: (item as FavItemLoose).vote_average,
  };
}

/** Read, normalize (migrate 'tv' -> 'tvs' and ensure title), and re-write if changed */
function readNormalized(uid: string): FavItem[] {
  const k = KEY(uid);
  // Be resilient to any prior format:
  const raw = read<unknown>(k, []);

  const arr = Array.isArray(raw) ? (raw as Array<FavItemLoose | FavItem>) : [];
  let changed = false;

  const normalized: FavItem[] = arr
    .filter((it) => it && typeof (it as any).id === 'number')
    .map((it) => {
      const n = normalizeItem(it);
      // detect changes vs loose input
      const wasTv = (it as FavItemLoose).media_type === 'tv';
      const hadNameFallback =
        (it as FavItemLoose).title === undefined &&
        (it as FavItemLoose).name !== undefined;
      if (wasTv || hadNameFallback) changed = true;
      return n;
    });

  if (changed) write(k, normalized);
  return normalized;
}

/* ---------------
   Public API
--------------- */

/** Get all favorites (normalized) */
export function getFavorites(uid: string): FavItem[] {
  return readNormalized(uid);
}

/** Save a list (re-normalized just in case) */
export function setFavorites(uid: string, items: FavItem[]) {
  const k = KEY(uid);
  const normalized = items.map((it) => normalizeItem(it));
  write(k, normalized);
}

/** Count favorites quickly */
export function getFavoritesCount(uid: string): number {
  return getFavorites(uid).length;
}

/** Check favorite by id, optionally by media type (normalized) */
export function hasFavorite(
  uid: string,
  id: number,
  mediaType?: FavMedia | 'tv'
): boolean {
  const mt = mediaType ? normalizeMediaType(mediaType) : undefined;
  const list = getFavorites(uid);
  return list.some((m) => m.id === id && (mt ? m.media_type === mt : true));
}

/**
 * Add one favorite.
 * - Accepts movie or tv(s) and normalizes to 'movie' | 'tvs'
 * - Dedupe by (id + media_type)
 * Returns { added: boolean } => false when already exists.
 */
export function addFavorite(uid: string, item: AddFavoriteInput): { added: boolean } {
  const k = KEY(uid);
  const list = readNormalized(uid);

  const incoming = normalizeItem(item as FavItemLoose);
  const exists = list.some(
    (m) => m.id === incoming.id && m.media_type === incoming.media_type
  );
  if (exists) return { added: false };

  // prepend newest
  write(k, [incoming, ...list]);
  return { added: true };
}

/**
 * Remove a favorite
 * - If mediaType given -> remove only that type
 * - Else remove any item with matching id
 * Returns true if something was removed.
 */
export function removeFavorite(
  uid: string,
  id: number,
  mediaType?: FavMedia | 'tv'
): boolean {
  const k = KEY(uid);
  const list = readNormalized(uid);
  const mt = mediaType ? normalizeMediaType(mediaType) : undefined;

  const next = list.filter((m) => {
    if (m.id !== id) return true;
    // If no mediaType provided, remove any with this id
    if (!mt) return false;
    // If provided, only remove when both id and type match
    return m.media_type !== mt;
  });

  if (next.length === list.length) return false;
  write(k, next);
  return true;
}

/** Clear all favorites */
export function clearFavorites(uid: string) {
  write(KEY(uid), []);
}
