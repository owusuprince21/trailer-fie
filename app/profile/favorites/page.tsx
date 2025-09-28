'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, completeAuthRedirect, signInWithGoogle } from '@/lib/firebase';
import { notify } from '@/lib/notify';
import { addFavorite, clearFavorites, getFavorites, removeFavorite, type FavItem } from '@/lib/favorites';
import { getImageUrl } from '@/lib/tmdb';

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

export default function FavoritesPage() {
  const { ready, user } = useAuthGuard();
  // const { toast } = useToast();

  const [items, setItems] = useState<FavItem[]>([]);

  // Load once when auth is ready
  useEffect(() => {
    if (!ready || !user) return;
    setItems(getFavorites(user.uid));
  }, [ready, user]);

  // Listen to cross-tab updates and same-tab custom event
  useEffect(() => {
    if (!user) return;

    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.includes(`tf_favorites_${user.uid}`)) return;
      setItems(getFavorites(user.uid));
    };
    const onCustom = () => setItems(getFavorites(user.uid));

    window.addEventListener('storage', onStorage);
    window.addEventListener('favorites:updated', onCustom as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('favorites:updated', onCustom as EventListener);
    };
  }, [user]);

  const count = items.length;

  // UI helpers
  const removeOne = (id: number) => {
    if (!user) return;
    const ok = removeFavorite(user.uid, id);
    if (ok) {
      setItems((prev) => prev.filter((m) => m.id !== id));
      notify({ once:true, title: 'Removed', description: 'Movie removed from favorites.' });
    } else {
      notify({ once:true, title: 'Not found', description: 'That movie was not in your favorites.', variant: 'error' });
    }
  };

  const clearAll = () => {
    if (!user) return;
    clearFavorites(user.uid);
    setItems([]);
    notify({ once:true, title: 'Cleared', description: 'All favorites cleared.' });
  };

  if (!ready) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white/70">
          Loading…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto p-6 text-center">
          <p className="text-white/80 mb-4">Sign in to see your favorites.</p>
          <Button onClick={() => signInWithGoogle()} className="bg-sky-600 hover:bg-sky-700">Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" /> Favorites
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
              {count}
            </span>
          </h1>

          <div className="flex items-center gap-2">
            {count > 0 && (
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white" onClick={clearAll}>
                Clear All
              </Button>
            )}
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white">
              <Link href="/profile">Back to Profile</Link>
            </Button>
          </div>
        </header>

        {count === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-white/80 mb-2">No favorites yet.</p>
            <p className="text-sm text-white/60">Mark titles as favorite to see them here.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {items.map((m) => {
              const title = m.media_type === 'movie' ? m.title : (m.name ?? m.title);
              const href = `/${m.media_type === 'tvs' ? 'tvs' : 'movie'}/${m.id}`.replace('/tvs', '/tvs'); // route fix if your tv route is /tv/[id]
              return (
                <li key={`${m.media_type}-${m.id}`} className="group relative">
                  {/* Poster */}
                  <Link href={href} className="block rounded-lg overflow-hidden bg-white/5">
                    <div className="relative aspect-[2/3]">
                      {m.poster_path ? (
                        <Image
                          src={getImageUrl(m.poster_path, 'w342')}
                          alt={title || 'Poster'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-sm text-white/60">No Image</div>
                      )}
                    </div>
                  </Link>

                  {/* Title + remove */}
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={href} className="block text-sm font-medium text-white line-clamp-2">
                        {title}
                      </Link>
                    </div>
                    <button
                      aria-label="Remove from favorites"
                      onClick={() => removeOne(m.id)}
                      className="shrink-0 inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 p-1.5 text-white/90 hover:bg-white/20"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
