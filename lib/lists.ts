// lib/lists.ts
export type ListMedia = 'movie' | 'tvs';

export type ListItem = {
  id: number;
  media_type: ListMedia;      // 'tvs' (not 'tv') to match your routes
  title: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type AddListInput = Partial<ListItem> & {
  id: number;
  media_type: ListMedia | 'tv';
  title?: string;
  name?: string;              // accepted, becomes title
};

const KEY = (uid: string) => `tf_lists_${uid}`;

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
      new CustomEvent('lists:updated', {
        detail: { key, count: Array.isArray(value) ? value.length : 0 },
      })
    );
  } catch {}
}

export function getLists(uid: string): ListItem[] {
  return read<ListItem[]>(KEY(uid), []);
}

export function setLists(uid: string, items: ListItem[]) {
  write(KEY(uid), items);
}

export function hasInLists(uid: string, id: number) {
  return getLists(uid).some((m) => m.id === id);
}

export function addToLists(uid: string, item: AddListInput): { added: boolean } {
  const k = KEY(uid);
  const list = read<ListItem[]>(k, []);
  if (list.some((m) => m.id === item.id)) return { added: false };

  const normalized: ListItem = {
    id: item.id,
    media_type: (item.media_type === 'tvs' ? 'tvs' : item.media_type) as ListMedia,
    title: item.title ?? item.name ?? '',
    poster_path: item.poster_path ?? null,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: item.vote_average,
  };

  write(k, [normalized, ...list]);
  return { added: true };
}

export function removeFromLists(uid: string, id: number): boolean {
  const k = KEY(uid);
  const list = read<ListItem[]>(k, []);
  const next = list.filter((m) => m.id !== id);
  if (next.length === list.length) return false;
  write(k, next);
  return true;
}

export function clearLists(uid: string) {
  write(KEY(uid), []);
}
