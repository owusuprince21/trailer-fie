'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // ⬅️ removed useSearchParams
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/tmdb';
import { useSearchMulti } from '@/lib/swr';
import { Search as SearchIcon } from 'lucide-react';
import type { MultiResult, SearchMultiResponse } from '@/lib/swr';

/* --------- Suspense-free replacement for useSearchParams --------- */
function useUrlSearchParams(): URLSearchParams {
  const [sp, setSp] = useState<URLSearchParams>(() => new URLSearchParams());

useEffect(() => {
  const read = () => setSp(new URLSearchParams(window.location.search));

  const emit = () => window.dispatchEvent(new Event('locationchange'));

  const origPush = history.pushState;
  const origReplace = history.replaceState;

  // Patch with proper `this` typing and signatures
  history.pushState = function pushStatePatched(
    this: History,
    data: any,
    unused: string,
    url?: string | URL | null
  ) {
    const ret = origPush.call(this, data, unused, url);
    emit();
    return ret;
  } as History['pushState'];

  history.replaceState = function replaceStatePatched(
    this: History,
    data: any,
    unused: string,
    url?: string | URL | null
  ) {
    const ret = origReplace.call(this, data, unused, url);
    emit();
    return ret;
  } as History['replaceState'];

  // initial + listeners
  read();
  window.addEventListener('popstate', read);
  window.addEventListener('locationchange', read);

  return () => {
    window.removeEventListener('popstate', read);
    window.removeEventListener('locationchange', read);
    history.pushState = origPush;
    history.replaceState = origReplace;
  };
}, []);


  return sp;
}
/* ---------------------------------------------------------------- */

/* -------------------- tiny skeleton atoms -------------------- */
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}
function SkelLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse h-4 rounded bg-white/10 ${className}`} />;
}
function SidebarSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
      <div className="px-4 py-3 bg-white/10">
        <SkelLine className="w-32 h-4" />
      </div>
      <div className="p-2 space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between w-full rounded-md px-3 py-2"
          >
            <SkelLine className="w-28 h-3.5" />
            <Skel className="w-8 h-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
function ResultCardSkeleton() {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 shadow">
      <div className="flex gap-4 p-3 sm:p-4">
        <div className="relative w-[85px] h-[125px] shrink-0 overflow-hidden rounded">
          <Skel className="absolute inset-0" />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <SkelLine className="w-3/4 mb-2 h-4" />
          <SkelLine className="w-1/3 mb-3 h-3.5" />
          <SkelLine className="w-full mb-2" />
          <SkelLine className="w-5/6" />
        </div>
      </div>
    </article>
  );
}
/* ------------------------------------------------------------- */

function formatDateSafe(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  if (!Number.isFinite(y)) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SearchPage() {
  const router = useRouter();
  const sp = useUrlSearchParams(); // ⬅️ replaced useSearchParams()
  const qParam = (sp.get('q') || '').trim();
  const typeParam = (sp.get('type') || '').trim().toLowerCase() as 'movie' | 'tv' | 'person' | '';

  const [inputValue, setInputValue] = useState(qParam);
  useEffect(() => setInputValue(qParam), [qParam]);

  // typed usage of the multi-search hook
  const { data, isLoading } = useSearchMulti(qParam) as unknown as {
    data?: SearchMultiResponse;
    isLoading: boolean;
  };

  const all: MultiResult[] = data?.results ?? [];
  const movies = all.filter((r) => r.media_type === 'movie');
  const tv = all.filter((r) => r.media_type === 'tv');
  const people = all.filter((r) => r.media_type === 'person');

  const moviesCount = movies.length;
  const tvCount = tv.length;
  const peopleCount = people.length;

  const activeType: 'movie' | 'tv' | 'person' = useMemo(() => {
    if (typeParam === 'movie' || typeParam === 'tv' || typeParam === 'person') return typeParam;
    if (moviesCount > 0) return 'movie';
    if (tvCount > 0) return 'tv';
    if (peopleCount > 0) return 'person';
    return 'movie';
  }, [typeParam, moviesCount, tvCount, peopleCount]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = inputValue.trim();
    if (!next) return;
    router.push(`/search?q=${encodeURIComponent(next)}&type=${activeType}`);
  };

  const goType = (t: 'movie' | 'tv' | 'person') => {
    const nextQ = qParam || inputValue || '';
    router.push(`/search?q=${encodeURIComponent(nextQ)}&type=${t}`);
  };

  const showSkeleton = qParam && isLoading;

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-[65px]">
        <form onSubmit={onSubmit} className="flex items-center gap-3">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search movies, TV, people…"
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {showSkeleton ? (
              <SidebarSkeleton />
            ) : (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <div className="px-4 py-3 font-semibold text-white bg-white/10">
                  Search Results
                </div>
                <nav className="p-2">
                  <SidebarItem
                    label="TV Shows"
                    count={tvCount}
                    active={activeType === 'tv'}
                    onClick={() => goType('tv')}
                  />
                  <SidebarItem
                    label="Movies"
                    count={moviesCount}
                    active={activeType === 'movie'}
                    onClick={() => goType('movie')}
                  />
                  <SidebarItem
                    label="People"
                    count={peopleCount}
                    active={activeType === 'person'}
                    onClick={() => goType('person')}
                  />
                  {/* Optional placeholders */}
                  <SidebarItem label="Collections" count={0} disabled />
                  <SidebarItem label="Companies" count={0} disabled />
                  <SidebarItem label="Keywords" count={0} disabled />
                  <SidebarItem label="Networks" count={0} disabled />
                  <SidebarItem label="Awards" count={0} disabled />
                </nav>
              </div>
            )}
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {!qParam && <div className="text-gray-300">Start by searching for a title above.</div>}

            {showSkeleton && (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ResultCardSkeleton key={i} />
                ))}
              </div>
            )}

            {qParam && !isLoading && activeType === 'movie' && (
              <div className="space-y-4">
                {movies.map((m) => (
                  <ResultCard
                    key={`movie-${m.id}`}
                    href={`/movie/${m.id}`}
                    imagePath={m.poster_path}
                    title={m.title || 'Untitled'}
                    subtitle={formatDateSafe(m.release_date)}
                    overview={m.overview}
                  />
                ))}
                {moviesCount === 0 && <EmptyState query={qParam} typeLabel="movies" />}
              </div>
            )}

            {qParam && !isLoading && activeType === 'tv' && (
              <div className="space-y-4">
                {tv.map((t) => (
                  <ResultCard
                    key={`tv-${t.id}`}
                    href={`/tvs/${t.id}`}
                    imagePath={t.poster_path}
                    title={t.name || 'Untitled'}
                    subtitle={formatDateSafe(t.first_air_date)}
                    overview={t.overview}
                  />
                ))}
                {tvCount === 0 && <EmptyState query={qParam} typeLabel="TV shows" />}
              </div>
            )}

            {qParam && !isLoading && activeType === 'person' && (
              <div className="space-y-4">
                {people.map((p) => (
                  <ResultCard
                    key={`person-${p.id}`}
                    href={`/person/${p.id}`}
                    imagePath={p.profile_path}
                    title={p.name || 'Unknown'}
                    subtitle={p.known_for_department || ''}
                    overview={undefined}
                  />
                ))}
                {peopleCount === 0 && <EmptyState query={qParam} typeLabel="people" />}
              </div>
            )}
          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SidebarItem({
  label,
  count,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base = 'flex items-center justify-between w-full rounded-md px-3 py-2 text-sm';
  const state = disabled
    ? 'opacity-50 cursor-not-allowed'
    : active
    ? 'bg-white/20 text-white'
    : 'hover:bg-white/10 text-gray-200';
  return (
    <button type="button" className={`${base} ${state}`} disabled={disabled} onClick={onClick}>
      <span>{label}</span>
      <span className="inline-flex items-center justify-center min-w-6 h-6 text-xs rounded-full bg-white/20 px-2">
        {count}
      </span>
    </button>
  );
}

function ResultCard({
  href,
  imagePath,
  title,
  subtitle,
  overview,
}: {
  href: string;
  imagePath?: string | null;
  title: string;
  subtitle?: string;
  overview?: string;
}) {
  return (
    <Link href={href} className="block">
      <article className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition shadow">
        <div className="flex gap-4 p-3 sm:p-4">
          <div className="relative w-[85px] h-[125px] shrink-0 overflow-hidden rounded">
            {imagePath ? (
              <Image src={getImageUrl(imagePath, 'w185')} alt={title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-white/10">
                No Image
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-gray-300">{subtitle}</p>}
            {overview && <p className="mt-2 text-gray-200 line-clamp-2 sm:line-clamp-3">{overview}</p>}
          </div>
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ query, typeLabel }: { query: string; typeLabel: string }) {
  return (
    <div className="text-gray-300">
      No {typeLabel} found for <span className="text-white font-medium">“{query}”</span>.
    </div>
  );
}
