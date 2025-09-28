// lib/watch.ts

/** The media values you may pass into APIs. */
export type WatchMedia = 'movie' | 'tvs' | 'tv';

/** Normalized, persisted event describing something the user watched. */
export type WatchEvent = {
  id: number;
  /** Always normalized to 'movie' | 'tvs' for your UI/routing. */
  media_type: 'movie' | 'tvs';

  /** Movie title (if media_type === 'movie') */
  title?: string;
  /** TV name (if media_type === 'tvs') */
  name?: string;

  poster_path?: string | null;

  /** Optional fields used by preview mappers / year helpers */
  release_date?: string;     // movies
  first_air_date?: string;   // tv
  vote_average?: number;

  /** When the watch happened – ms epoch */
  watchedAt: number;
};

/**
 * Looser input you can pass to `logWatchEvent`. Only id + media_type are required;
 * the rest will be merged/updated if an event already exists.
 */
export type WatchItemLoose = {
  id: number;
  media_type: WatchMedia;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export const WATCH_UPDATED_EVENT = 'watch:updated' as const;

type WatchUpdatedDetail = {
  userId: string;
  count: number;
  /** last written/updated event, if any (useful for live UIs) */
  last?: WatchEvent | null;
};

const KEY = (uid: string) => `tf_watch_events_${uid}`;
const MAX_EVENTS = 300;

/* ----------------------------------------------------------------------------
   Storage helpers
----------------------------------------------------------------------------- */

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function dispatchUpdate(detail: WatchUpdatedDetail) {
  try {
    // No generic parameter to avoid DOM lib typing differences
    window.dispatchEvent(new CustomEvent(WATCH_UPDATED_EVENT, { detail } as any));
  } catch {}
}

function writeList(uid: string, list: WatchEvent[], last?: WatchEvent | null) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY(uid), JSON.stringify(list));
  } catch {}
  dispatchUpdate({ userId: uid, count: list.length, last });
}

/* ----------------------------------------------------------------------------
   Public API
----------------------------------------------------------------------------- */

/** Return normalized, newest-first events. */
export function getWatchEvents(uid: string): WatchEvent[] {
  const raw = read<unknown>(KEY(uid), []);
  const migrated = migrate(Array.isArray(raw) ? raw : []);
  // newest first
  return migrated.sort((a, b) => b.watchedAt - a.watchedAt);
}

/** Lightweight count helper. */
export function getWatchCount(uid: string): number {
  return getWatchEvents(uid).length;
}

/** Remove everything. */
export function clearWatchEvents(uid: string) {
  writeList(uid, [], null);
}

/**
 * Upsert a watch event. If an item with the same (id, media_type) exists,
 * it is updated and moved to the top; otherwise it is inserted at the top.
 */
export function logWatchEvent(
  uid: string,
  item: WatchItemLoose
): { status: 'added' | 'updated' } {
  if (!uid || typeof window === 'undefined') return { status: 'updated' };

  const now = Date.now();
  const list = getWatchEvents(uid); // already migrated + sorted
  const media = normalizeMedia(item.media_type);

  const idx = list.findIndex((e) => e.id === item.id && e.media_type === media);

  if (idx >= 0) {
    const updated: WatchEvent = {
      ...list[idx],
      title: item.title ?? list[idx].title,
      name: item.name ?? list[idx].name,
      poster_path: item.poster_path ?? list[idx].poster_path ?? null,
      release_date: item.release_date ?? list[idx].release_date,
      first_air_date: item.first_air_date ?? list[idx].first_air_date,
      vote_average: item.vote_average ?? list[idx].vote_average,
      watchedAt: now,
    };
    const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)].slice(0, MAX_EVENTS);
    writeList(uid, next, updated);
    return { status: 'updated' };
  }

  const created: WatchEvent = {
    id: item.id,
    media_type: media,
    title: item.title,
    name: item.name,
    poster_path: item.poster_path ?? null,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: item.vote_average,
    watchedAt: now,
  };

  const next = [created, ...list].slice(0, MAX_EVENTS);
  writeList(uid, next, created);
  return { status: 'added' };
}

/** Remove a single watch event by (id, media). Returns true if removed. */
export function removeWatchEvent(uid: string, id: number, media: WatchMedia): boolean {
  const norm = normalizeMedia(media);
  const list = getWatchEvents(uid);
  const next = list.filter((e) => !(e.id === id && e.media_type === norm));
  if (next.length === list.length) return false;
  writeList(uid, next, null);
  return true;
}

/* ----------------------------------------------------------------------------
   Internals
----------------------------------------------------------------------------- */

function normalizeMedia(m: WatchMedia): 'movie' | 'tvs' {
  return m === 'tvs' || m === 'tv' ? 'tvs' : 'movie';
}

/** Best-effort migration + normalization of previously stored records. */
function migrate(arr: any[]): WatchEvent[] {
  const out: WatchEvent[] = [];
  for (const x of arr) {
    if (!x || typeof x.id !== 'number') continue;

    const media = normalizeMedia(x.media_type as WatchMedia);

    out.push({
      id: x.id,
      media_type: media,
      title: typeof x.title === 'string' ? x.title : undefined,
      name: typeof x.name === 'string' ? x.name : undefined,
      poster_path: x.poster_path ?? null,
      release_date: typeof x.release_date === 'string' ? x.release_date : undefined,
      first_air_date: typeof x.first_air_date === 'string' ? x.first_air_date : undefined,
      vote_average: typeof x.vote_average === 'number' ? x.vote_average : undefined,
      watchedAt: typeof x.watchedAt === 'number' ? x.watchedAt : Date.now(),
    });
  }
  return out;
}
