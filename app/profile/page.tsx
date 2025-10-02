'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Film,
  Heart,
  Star,
  List as ListIcon,
  LogOut,
  Settings,
  PlayCircle,
  Eye,
} from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthClient, signInWithGoogle, logout, completeAuthRedirect } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


import { getFavorites, type FavItem as StoreItem } from '@/lib/favorites';
import { getWatchlist } from '@/lib/watchlist';
import { getLists } from '@/lib/lists';
import { getImageUrl } from '@/lib/tmdb';

import {
  getWatchEvents,
  WATCH_UPDATED_EVENT,
  type WatchEvent,
} from '@/lib/watch';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';

import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import 'keen-slider/keen-slider.min.css';
import { motion } from 'framer-motion';
import { useKeenSlider } from 'keen-slider/react';

// ✅ Instead of importing `auth`, get it here safely:
const auth = getAuthClient();

/* ---------------- Auth hook ---------------- */
function useAuthGuard() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await completeAuthRedirect().catch(() => {});
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthReady(true);
      });
    })();
    return () => unsub();
  }, []);

  return { authReady, user };
}

/* ---------------- Utils ---------------- */
function numberFmt(n: number) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

/* ---------------- Page ---------------- */
export default function ProfilePage() {
  const router = useRouter();
  const { authReady, user } = useAuthGuard();

  // Store snapshots
  const [favorites, setFavorites] = useState<StoreItem[]>([]);
  const [watchlist, setWatchlist] = useState<StoreItem[]>([]);
  const [lists, setLists] = useState<StoreItem[]>([]);
  const [watchEvents, setWatchEvents] = useState<WatchEvent[]>([]);

  const loadAll = useCallback(() => {
    if (!user) {
      setFavorites([]);
      setWatchlist([]);
      setLists([]);
      setWatchEvents([]);
      return;
    }
    setFavorites(getFavorites(user.uid));
    setWatchlist(getWatchlist(user.uid));
    setLists(getLists(user.uid));
    setWatchEvents(getWatchEvents(user.uid));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setWatchlist([]);
      setLists([]);
      setWatchEvents([]);
      return;
    }
    loadAll();
  }, [user, loadAll]);

  useEffect(() => {
    if (!user) return;

    const onFavs = () => setFavorites(getFavorites(user.uid));
    const onWatchlist = () => setWatchlist(getWatchlist(user.uid));
    const onLists = () => setLists(getLists(user.uid));
    const onWatch = () => setWatchEvents(getWatchEvents(user.uid));

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.includes(`tf_favorites_${user.uid}`)) onFavs();
      if (e.key.includes(`tf_watchlist_${user.uid}`)) onWatchlist();
      if (e.key.includes(`tf_lists_${user.uid}`)) onLists();
      if (e.key.includes(`tf_watch_events_${user.uid}`)) onWatch();
    };

    window.addEventListener('favorites:updated' as any, onFavs);
    window.addEventListener('watchlist:updated' as any, onWatchlist);
    window.addEventListener('lists:updated' as any, onLists);
    window.addEventListener(WATCH_UPDATED_EVENT as any, onWatch);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('favorites:updated' as any, onFavs);
      window.removeEventListener('watchlist:updated' as any, onWatchlist);
      window.removeEventListener('lists:updated' as any, onLists);
      window.removeEventListener(WATCH_UPDATED_EVENT as any, onWatch);
      window.removeEventListener('storage', onStorage);
    };
  }, [user]);

  const stats = useMemo(
    () => ({
      ratings: 0,
      watchlist: watchlist.length,
      favorites: favorites.length,
      lists: lists.length,
      watched: watchEvents.length,
    }),
    [watchlist.length, favorites.length, lists.length, watchEvents.length]
  );

  const handleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const handleSignOut = useCallback(async () => {
    await logout();
    router.refresh();
  }, [router]);

  if (!authReady) return <ProfileSkeleton />;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <UserIcon className="h-7 w-7 text-white/90" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in to view your profile</h1>
          <p className="mt-2 text-white/70">
            Track your watchlist, ratings, favorites, lists and trailers you watch.
          </p>
          <div className="mt-6">
            <Button onClick={handleSignIn} className="bg-sky-600 hover:bg-sky-700">
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ everything below is unchanged
  const avatar = user.photoURL || '';
  const name = user.displayName || 'User';
  const email = user.email || '';
  return (
    <>
      {/* Header */}
      <section className="relative isolate">
        <div
          className={cn(
            'absolute inset-0 -z-10',
            'bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(56,189,248,0.25),transparent),radial-gradient(1000px_500px_at_90%_-120px,rgba(232,121,249,0.15),transparent)]'
          )}
          aria-hidden
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/20">
                {avatar ? (
                  <Image src={avatar} alt={name} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/10">
                    <UserIcon className="h-8 w-8 text-white/80" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1>
                <p className="text-sm text-white/70">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                asChild
              >
                <Link href="/profile/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button onClick={handleSignOut} className="bg-rose-600 hover:bg-rose-700">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard icon={<Star className="h-4 w-4" />} label="Ratings"   value={numberFmt(stats.ratings)}   href="/profile" />
            <StatCard icon={<Film className="h-4 w-4" />} label="Watchlist" value={numberFmt(stats.watchlist)} href="/profile/watchlist" />
            <StatCard icon={<Heart className="h-4 w-4" />} label="Favorites" value={numberFmt(stats.favorites)} href="/profile/favorites" />
            <StatCard icon={<ListIcon className="h-4 w-4" />} label="Lists"  value={numberFmt(stats.lists)}    href="/profile/lists" />
            <StatCard icon={<PlayCircle className="h-4 w-4" />} label="Your Watch" value={numberFmt(stats.watched)} href="/profile/activity" />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Panel
            title="Recent Activity"
            action={
              <DialogPreviewAction
                title="Recent Activity"
                description="Latest trailers you've watched."
                items={watchEventsToItems(watchEvents)}
              />
            }
          >
            {watchEvents.length === 0 ? (
              <EmptyState
                label="No activity yet"
                hint="Trailers you watch will appear here."
                cta={{ href: '/movies/popular', label: 'Watch a trailer' }}
              />
            ) : (
              <PaginatedStrip items={watchEventsToItems(watchEvents)} perPage={5} />
            )}
          </Panel>

          {/* Watchlist */}
          <Panel
            title="Your Watchlist"
            action={
              <div className="flex items-center gap-2">
                <DialogPreviewAction
                  title="Your Watchlist"
                  description="Everything you've saved to watch later."
                  items={toPreviewItems(watchlist)}
                />
                <LinkAction href="/profile/watchlist">Manage</LinkAction>
              </div>
            }
            className="lg:col-span-2"
          >
            {watchlist.length === 0 ? (
              <EmptyState
                label="No titles added"
                hint="Add movies or TV shows to your watchlist to track them."
                cta={{ href: '/movies/popular', label: 'Browse popular' }}
              />
            ) : (
              <PaginatedStrip items={toPreviewItems(watchlist)} perPage={5} />
            )}
          </Panel>

          {/* Favorites */}
          <Panel
            title="Favorites"
            action={
              <div className="flex items-center gap-2">
                <DialogPreviewAction
                  title="Favorites"
                  description="Your favorited movies and TV shows."
                  items={toPreviewItems(favorites)}
                />
                <LinkAction href="/profile/favorites">Manage</LinkAction>
              </div>
            }
          >
            {favorites.length === 0 ? (
              <EmptyState
                label="No favorites yet"
                hint="Mark titles as favorite to see them here."
                cta={{ href: '/movies/top-rated', label: 'Explore top rated' }}
              />
            ) : (
              <PaginatedStrip items={toPreviewItems(favorites)} perPage={5} />
            )}
          </Panel>

          {/* Ratings (placeholder) */}
          <Panel
            title="Your Ratings"
            action={<LinkAction href="/profile">Manage</LinkAction>}
            className="lg:col-span-2"
          >
            <EmptyState
              label="You haven’t rated anything"
              hint="Rate titles to get better recommendations."
              cta={{ href: '/movies/airing-today', label: 'Find something to rate' }}
            />
          </Panel>

          {/* Lists */}
          <Panel
            title="Lists"
            action={
              <div className="flex items-center gap-2">
                <DialogPreviewAction
                  title="Lists"
                  description="Titles you've added to your lists."
                  items={toPreviewItems(lists)}
                />
                <LinkAction href="/profile/lists">Create</LinkAction>
              </div>
            }
          >
            {lists.length === 0 ? (
              <EmptyState
                label="No lists yet"
                hint="Curate collections of your favorite titles."
                cta={{ href: '/movies/on-tv', label: 'Start exploring' }}
              />
            ) : (
              <PaginatedStrip items={toPreviewItems(lists)} perPage={5} />
            )}
          </Panel>
        </div>
      </section>
    </>
  );
}

/* ---------- Transform helpers for previews ---------- */
type PreviewItem = {
  id: number;
  media_type: 'movie' | 'tvs';
  title: string;
  year: string;
  poster_path?: string | null;
};

function baseTitle(it: { title?: string; name?: string }) {
  return it.title || it.name || 'Untitled';
}
function baseYear(it: { release_date?: string; first_air_date?: string }) {
  const y = (it.release_date || it.first_air_date || '').slice(0, 4);
  return y || '—';
}
function toPreviewItems(items: StoreItem[]): PreviewItem[] {
  return items.map((it) => ({
    id: it.id,
    media_type: it.media_type === 'tvs' ? 'tvs' : 'movie',
    title: baseTitle(it),
    year: baseYear(it),
    poster_path: it.poster_path,
  }));
}
function watchEventsToItems(items: WatchEvent[]): PreviewItem[] {
  const sorted = [...items].sort((a, b) => b.watchedAt - a.watchedAt);
  return sorted.map((it) => ({
    id: it.id,
    media_type: it.media_type,
    title: baseTitle(it),
    year: baseYear(it),
    poster_path: it.poster_path,
  }));
}

/* ---------- Small UI helpers ---------- */
function ProfileSkeleton() {
  return (
    <div className="min-h-[70vh] px-4">
      <div className="max-w-7xl mx-auto pt-10">
        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-white/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-56 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <div className="h-10 w-28 rounded bg-white/10 animate-pulse" />
            <div className="h-10 w-28 rounded bg-white/10 animate-pulse" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 h-5 w-16 rounded bg-white/10 animate-pulse" />
              <div className="h-6 w-20 rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn('rounded-2xl border border-white/10 bg-white/5 p-5', i === 1 ? 'lg:col-span-2' : '')}>
              <div className="mb-4 h-5 w-40 rounded bg-white/10 animate-pulse" />
              <div className="h-24 rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-sky-400/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/90">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">{icon}</span>
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
    </Link>
  );
}

function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/5 p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function LinkAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-sky-300 hover:text-sky-200 underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

function EmptyState({
  label,
  hint,
  cta,
}: {
  label: string;
  hint?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
      <div className="mb-2 text-white/90">{label}</div>
      {hint && <div className="mb-4 text-sm text-white/60">{hint}</div>}
      {cta && (
        <Button asChild className="bg-gradient-to-r from-sky-500 to-fuchsia-500 hover:from-sky-400 hover:to-fuchsia-400">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}

/* ---------- Reusable Movie Card (grid) ---------- */
function MovieCard({ item }: { item: PreviewItem }) {
  const href = item.media_type === 'movie' ? `/movie/${item.id}` : `/tvs/${item.id}`;
  return (
    <Link href={href} className="block">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="relative aspect-[2/3]">
          {item.poster_path ? (
            <Image
              src={getImageUrl(item.poster_path, 'w342')}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 50vw, 15vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">No Image</div>
          )}
        </div>
        <div className="p-2">
          <div className="line-clamp-2 text-sm text-white">{item.title}</div>
          <div className="text-xs text-white/60">{item.year}</div>
        </div>
      </div>
    </Link>
  );
}

/* ---------- Paginated strip (5 per page; numbered pages) ---------- */
function PaginatedStrip({
  items,
  perPage = 5,
}: {
  items: PreviewItem[];
  perPage?: number;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  return (
    <div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {pageItems.map((it) => (
          <li key={`${it.media_type}-${it.id}`}>
            <MovieCard item={it} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const idx = i + 1;
            const active = idx === page;
            return (
              <button
                key={idx}
                onClick={() => setPage(idx)}
                className={cn(
                  'h-8 min-w-8 px-3 rounded-md text-sm transition border',
                  active
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {idx}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Dialog: View trigger + Embla carousel (no buttons inside) ---------- */
function DialogPreviewAction({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: PreviewItem[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-sky-300 hover:text-sky-200 hover:bg-white/5">
          <Eye className="mr-1 h-4 w-4" /> View
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-white/80">
                Nothing here yet.
              </div>
            ) : (
              <KeenTray items={items} />
            )}
      </DialogContent>
    </Dialog>
  );
}

// ---- SmallMovieCard (used by the modal carousel) ----
function SmallMovieCard({
  item,
  blockClick = false,
}: {
  item: PreviewItem;
  blockClick?: boolean;
}) {
  const href = item.media_type === 'movie' ? `/movie/${item.id}` : `/tvs/${item.id}`;

  const onClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (blockClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Link href={href} className="block" onClick={onClick}>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <div className="relative aspect-[2/3]">
          {item.poster_path ? (
            <Image
              src={getImageUrl(item.poster_path, 'w342')}
              alt={item.title}
              fill
              sizes="120px"
              className="object-cover pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60 text-xs">
              No Image
            </div>
          )}
        </div>
        <div className="p-2">
          <div className="line-clamp-2 text-xs text-white">{item.title}</div>
          <div className="text-[10px] text-white/60">{item.year}</div>
        </div>
      </div>
    </Link>
  );
}

/* ---------- Embla tray: trackpad swipe + loop + dots ---------- */
function KeenTray({ items }: { items: PreviewItem[] }) {
  // If there are very few slides, duplicate up to at least 3 so loop feels natural
  const slides = useMemo(() => {
    if (items.length >= 3) return items;
    const times = Math.ceil(3 / Math.max(1, items.length));
    return Array.from({ length: times }).flatMap(() => items);
  }, [items]);

  // Trackpad wheel plugin: convert horizontal wheel (two-finger) to slide movement
function wheelControlsSmooth(slider: any) {
  let accum = 0;              // accumulated wheel delta
  const SENSITIVITY = 90;     // higher = needs more swipe to trigger (smoother)
  const COOLDOWN = 260;       // ms delay between slide steps
  let cooling = false;

  function onWheel(e: WheelEvent) {
    // prefer horizontal movement on touchpad; fall back to vertical
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    // treat small deltas as touchpad swipes; ignore large (mouse wheel) to avoid big jumps
    const isTouchpadish = Math.abs(delta) < 120;
    if (!isTouchpadish) return;

    // prevent the page from scrolling while interacting with the slider
    e.preventDefault();

    // accumulate movement until threshold is crossed
    accum += delta;

    if (cooling) return;
    if (Math.abs(accum) < SENSITIVITY) return;

    const dir = accum > 0 ? 1 : -1; // + => right/next, - => left/prev
    accum = 0;
    cooling = true;

    // move exactly one slide; Keen animates this smoothly
    const nextIdx = slider.track.details.abs + dir;
    slider.moveToIdx(nextIdx);

    // cooldown so we don’t rapid-fire steps; lets the animation complete
    setTimeout(() => {
      cooling = false;
    }, COOLDOWN);
  }

  slider.on('created', () => {
    // need passive:false to call preventDefault()
    slider.container.addEventListener('wheel', onWheel, { passive: false });
  });

  slider.on('destroyed', () => {
    slider.container.removeEventListener('wheel', onWheel as any);
  });
}
  const [ref, slider] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,          // 🔁 native seamless loop
      mode: 'snap',
      rubberband: true,
      drag: true,          // mouse/touch drag
      slides: {
        origin: 'center',
        perView: 'auto',   // fixed card width, auto count per view
        spacing: 12,       // ≈ Tailwind gap-3
      },
    },
    [wheelControlsSmooth]
  );

  // Block <Link> clicks while dragging so swipes don’t navigate
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const s = slider.current;
    if (!s) return;

    const onDragStart = () => setDragging(true);
    const onDone = () => setTimeout(() => setDragging(false), 80);

    s.on('dragStarted', onDragStart);
    s.on('animationEnded', onDone);
    s.on('updated', onDone);

    // No s.off(...) here; Keen cleans up on destroy.
  }, [slider]);

  return (
    <div>
      {/* Make sure your <DialogContent> has className="... overflow-hidden" */}
      <div ref={ref} className="keen-slider px-2 overflow-hidden">
        {slides.map((it, i) => (
          <div key={`${it.media_type}-${it.id}-${i}`} className="keen-slider__slide !w-36 sm:!w-40">
            <SmallMovieCard item={it} blockClick={dragging} />
          </div>
        ))}
      </div>
    </div>
  );
}