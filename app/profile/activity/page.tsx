// app/profile/activity/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getAuthClient,
  completeAuthRedirect,
  signInWithGoogle,
} from '@/lib/firebase';
import { getWatchEvents, clearWatchEvents, type WatchEvent } from '@/lib/watch';
import { getFavorites, type FavItem } from '@/lib/favorites';
import { getWatchlist } from '@/lib/watchlist'; // no type import
import { Button } from '@/components/ui/button';
import { Clock, Film, Heart, Bookmark, PlayCircle } from 'lucide-react';

// ✅ Replace direct `auth` import with this
const auth = getAuthClient();

function useAuthGuard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await completeAuthRedirect().catch(() => {});
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      });
    })();
    return () => unsub();
  }, []);
  return { ready, user };
}

function hrefFor(media_type: 'movie' | 'tvs', id: number) {
  return media_type === 'movie' ? `/movie/${id}` : `/tvs/${id}`;
}

function displayTitle(item: { media_type: 'movie' | 'tvs' } & Record<string, any>) {
  if (item.media_type === 'movie') return item.title ?? item.name ?? 'Untitled';
  return item.name ?? item.title ?? 'Untitled';
}

export default function ActivityPage() {
  const { ready, user } = useAuthGuard();

  const [watches, setWatches] = useState<WatchEvent[]>([]);
  const [favorites, setFavorites] = useState<FavItem[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setWatches([]);
      setFavorites([]);
      setWatchlist([]);
      return;
    }
    setWatches(getWatchEvents(user.uid));
    setFavorites(getFavorites(user.uid));
    setWatchlist(getWatchlist(user.uid));

    const onWatch = (e: Event) => {
      const ce = e as CustomEvent<{ userId: string }>;
      if (ce.detail?.userId === user.uid) setWatches(getWatchEvents(user.uid));
    };
    const onFav = (e: Event) => {
      const ce = e as CustomEvent<{ userId: string }>;
      if (ce.detail?.userId === user.uid) setFavorites(getFavorites(user.uid));
    };
    const onWL = (e: Event) => {
      const ce = e as CustomEvent<{ userId: string }>;
      if (ce.detail?.userId === user.uid) setWatchlist(getWatchlist(user.uid));
    };

    window.addEventListener('watch:updated', onWatch as EventListener);
    window.addEventListener('favorites:updated', onFav as EventListener);
    window.addEventListener('watchlist:updated', onWL as EventListener);

    const onStorage = (ev: StorageEvent) => {
      if (!ev.key || !user) return;
      if (ev.key.includes(`tf_watch_events_${user.uid}`)) setWatches(getWatchEvents(user.uid));
      if (ev.key.includes(`tf_favorites_${user.uid}`)) setFavorites(getFavorites(user.uid));
      if (ev.key.includes(`tf_watchlist_${user.uid}`)) setWatchlist(getWatchlist(user.uid));
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('watch:updated', onWatch as EventListener);
      window.removeEventListener('favorites:updated', onFav as EventListener);
      window.removeEventListener('watchlist:updated', onWL as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [user]);

  const counts = useMemo(
    () => ({
      watches: watches.length,
      favorites: favorites.length,
      watchlist: watchlist.length,
    }),
    [watches.length, favorites.length, watchlist.length]
  );

  if (!ready) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 w-40 rounded bg-white/10 animate-pulse mb-6" />
        <div className="h-32 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <Clock className="h-7 w-7 text-white/90" />
          </div>
          <h1 className="text-xl font-bold text-white">See your recent activity</h1>
          <p className="mt-2 text-white/70">
            Sign in to view your trailer watches, favorites and watchlist.
          </p>
          <div className="mt-5">
            <Button onClick={() => signInWithGoogle()} className="bg-sky-600 hover:bg-sky-700">
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity</h1>
          <p className="text-white/70 text-sm">
            Watches: {counts.watches} • Favorites: {counts.favorites} • Watchlist: {counts.watchlist}
          </p>
        </div>
        {counts.watches > 0 && (
          <Button
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white"
            onClick={() => clearWatchEvents(user.uid)}
          >
            Clear watch history
          </Button>
        )}
      </header>

      {/* Recent Trailer Watches */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <PlayCircle className="h-5 w-5 text-sky-300" />
          Recent Trailer Watches
        </h2>
        {watches.length === 0 ? (
          <EmptyBox label="No trailer watches yet" hint="Watch any trailer and it’ll appear here." />
        ) : (
          <ul className="space-y-3">
            {watches.map((w) => {
              const title = displayTitle(w as any);
              const href = hrefFor(w.media_type, w.id);
              const when = new Date(w.watchedAt).toLocaleString();
              return (
                <li key={`${w.media_type}-${w.id}-${w.watchedAt}`}>
                  <Link
                    href={href}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/[0.08]"
                  >
                    <Thumb poster_path={w.poster_path} title={title} />
                    <div className="min-w-0">
                      <div className="truncate text-white">{title}</div>
                      <div className="text-xs text-white/60">
                        {w.media_type === 'movie' ? 'Movie' : 'TV'} • {when}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Quick Favorites */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <Heart className="h-5 w-5 text-rose-300" />
          Favorites
        </h2>
        {favorites.length === 0 ? (
          <EmptyBox label="No favorites yet" hint="Mark titles as favorite to see them here." />
        ) : (
          <CardGrid
            items={favorites.map((f) => ({
              id: f.id,
              media_type: f.media_type,
              title: displayTitle(f as any),
              poster_path: f.poster_path ?? null,
              href: hrefFor(f.media_type, f.id),
            }))}
          />
        )}
      </section>

      {/* Quick Watchlist */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
          <Bookmark className="h-5 w-5 text-emerald-300" />
          Watchlist
        </h2>
        {watchlist.length === 0 ? (
          <EmptyBox label="Your watchlist is empty" hint="Add titles to your watchlist from any detail page." />
        ) : (
          <CardGrid
            items={watchlist.map((it) => ({
              id: it.id,
              media_type: it.media_type,
              title: displayTitle(it as any),
              poster_path: it.poster_path ?? null,
              href: hrefFor(it.media_type, it.id),
            }))}
          />
        )}
      </section>
    </div>
  );
}

function EmptyBox({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
      <div className="text-white/90">{label}</div>
      {hint && <div className="mt-1 text-sm text-white/60">{hint}</div>}
    </div>
  );
}

function Thumb({ poster_path, title }: { poster_path: string | null | undefined; title: string }) {
  const src = poster_path ? `https://image.tmdb.org/t/p/w185${poster_path}` : null;
  return (
    <div className="relative h-14 w-10 overflow-hidden rounded-md bg-white/10 ring-1 ring-white/10 shrink-0">
      {src ? (
        <Image src={src} alt={title} fill sizes="40px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Film className="h-4 w-4 text-white/60" />
        </div>
      )}
    </div>
  );
}

function CardGrid({
  items,
}: {
  items: { id: number; media_type: 'movie' | 'tvs'; title: string; poster_path: string | null; href: string }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <Link
          key={`${it.media_type}-${it.id}`}
          href={it.href}
          className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.07]"
        >
          <div className="relative aspect-[2/3]">
            {it.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w342${it.poster_path}`}
                alt={it.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Film className="h-6 w-6 text-white/60" />
              </div>
            )}
          </div>
          <div className="truncate px-2 py-2 text-xs text-white/90">{it.title}</div>
        </Link>
      ))}
    </div>
  );
}
