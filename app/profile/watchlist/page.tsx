'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, Trash2 } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

import { auth, completeAuthRedirect, signInWithGoogle } from '@/lib/firebase';
import { getWatchlist, removeFromWatchlist } from '@/lib/watchlist';
import { getImageUrl } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';

/** Local shape (mirrors favorites/watchlist/lists item shape) */
type StoreItem = {
  id: number;
  media_type: 'movie' | 'tvs';
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

function useAuthGuard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await completeAuthRedirect().catch(() => {});
      unsub = onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
    })();
    return () => unsub();
  }, []);
  return { ready, user };
}

export default function WatchlistPage() {
  // const { toast } = useToast();
  const { ready, user } = useAuthGuard();
  const [items, setItems] = useState<StoreItem[]>([]);

  const load = useCallback(() => {
    if (!user) return;
    const data = getWatchlist(user.uid) as StoreItem[];
    setItems(data);
  }, [user]);

  // Initial load + listen for cross/same-tab updates
  useEffect(() => {
    if (!user) return;
    load();
    const onUpdated = () => load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.includes('tf_watchlist_')) load();
    };
    window.addEventListener('watchlist:updated' as any, onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('watchlist:updated' as any, onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [user, load]);

  if (!ready) return <div className="p-6 text-white/70">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-white/80 mb-4">Sign in to see your watchlist.</p>
        <Button onClick={() => signInWithGoogle()} className="bg-sky-600 hover:bg-sky-700">
          Sign in
        </Button>
      </div>
    );
  }

  const handleRemove = (id: number) => {
    removeFromWatchlist(user.uid, id);
    setItems((prev) => prev.filter((m) => m.id !== id));
    notify({ title: 'Removed', description: 'Title removed from your watchlist.' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-emerald-400" /> Watchlist
        </h1>
        <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white">
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-white/80 mb-2">Your watchlist is empty.</p>
          <p className="text-sm text-white/60">Add titles from any movie/TV page.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((it) => {
            const href = it.media_type === 'movie' ? `/movie/${it.id}` : `/tvs/${it.id}`;
            const title = it.title || it.name || 'Untitled';
            const year = (it.release_date || it.first_air_date || '').slice(0, 4);
            return (
              <li key={`${it.media_type}-${it.id}`} className="group relative rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <Link href={href} className="block">
                  <div className="relative aspect-[2/3]">
                    {it.poster_path ? (
                      <Image
                        src={getImageUrl(it.poster_path, 'w342')}
                        alt={title}
                        fill
                        sizes="(max-width:768px) 50vw, 20vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/60">No Image</div>
                    )}
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(it.id)}
                  className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 p-2"
                  title="Remove from watchlist"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>

                <div className="p-2">
                  <Link href={href} className="block text-sm font-medium text-white/90 line-clamp-2">
                    {title}
                  </Link>
                  <div className="text-xs text-white/60">{year || '—'}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
