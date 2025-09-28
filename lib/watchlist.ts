// lib/watchlist.ts
export type WatchMedia = 'movie' | 'tvs';

export type WatchItem = {
  id: number;
  media_type: WatchMedia;     // use 'tvs' (not 'tv') to match your routes
  title: string;              // normalized title
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type AddWatchInput = Partial<WatchItem> & {
  id: number;
  media_type: WatchMedia | 'tv';   // accept 'tv' and normalize -> 'tvs'
  title?: string;
  name?: string;                    // accepted, becomes title
};

const KEY = (uid: string) => `tf_watchlist_${uid}`;

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
    window.dispatchEvent(
      new CustomEvent('watchlist:updated', {
        detail: { key, count: Array.isArray(value) ? value.length : 0 },
      })
    );
  } catch {}
}

export function getWatchlist(uid: string): WatchItem[] {
  return read<WatchItem[]>(KEY(uid), []);
}

export function setWatchlist(uid: string, items: WatchItem[]) {
  write(KEY(uid), items);
}

export function hasInWatchlist(uid: string, id: number) {
  return getWatchlist(uid).some((m) => m.id === id);
}

export function addToWatchlist(uid: string, item: AddWatchInput): { added: boolean } {
  const k = KEY(uid);
  const list = read<WatchItem[]>(k, []);
  if (list.some((m) => m.id === item.id)) return { added: false };

  const normalized: WatchItem = {
    id: item.id,
    media_type: (item.media_type === 'tvs' ? 'tvs' : item.media_type) as WatchMedia,
    title: item.title ?? item.name ?? '',
    poster_path: item.poster_path ?? null,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: item.vote_average,
  };

  write(k, [normalized, ...list]);
  return { added: true };
}

export function removeFromWatchlist(uid: string, id: number): boolean {
  const k = KEY(uid);
  const list = read<WatchItem[]>(k, []);
  const next = list.filter((m) => m.id !== id);
  if (next.length === list.length) return false;
  write(k, next);
  return true;
}

export function clearWatchlist(uid: string) {
  write(KEY(uid), []);
}
