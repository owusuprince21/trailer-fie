'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';

const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/tmdb';

type TMDBMovie = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string; // safety if TMDB ever mixes TV results
  vote_average?: number;
};

/* Reusable top/bottom pagination bar */
function PaginationBar({
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={loading || page <= 1} onClick={onPrev}>
          Prev
        </Button>
        <span className="text-white/80 text-sm">
          Page {page} / {totalPages}
        </span>
        <Button variant="outline" disabled={loading || page >= totalPages} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default function GenrePage() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const name = sp.get('name') || 'Movies';

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset to page 1 when the genre changes
  useEffect(() => {
    setPage(1);
  }, [id]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tmdb/discover?genre=${encodeURIComponent(String(id))}&page=${page}`
        );
        const json = await res.json();
        if (!alive) return;

        setItems(Array.isArray(json?.results) ? json.results : []);
        setTotalPages(Number(json?.total_pages || 1));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, page]);

  const title = useMemo(() => `${name}`, [name]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
        </div>

        {/* TOP pagination */}
        <PaginationBar page={page} totalPages={totalPages} loading={loading} onPrev={goPrev} onNext={goNext} />

        {/* GRID */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="block h-full">
                <div className="h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 flex flex-col">
                  <div className="relative aspect-[2/3]">
                    <div className="absolute inset-0 animate-pulse bg-white/10" />
                  </div>
                  <div className="p-2 mt-auto">
                    <div className="h-[2.75rem] w-full rounded bg-white/10 animate-pulse mb-2" />
                    <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((m) => {
              const t = m.title || m.name || 'Untitled';
              const year =
                (m.release_date || m.first_air_date || '').slice(0, 4) || '—';

              return (
                <Link key={m.id} href={`/movie/${m.id}`} className="block h-full">
                  <div className="h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex flex-col">
                    <div className="relative aspect-[2/3]">
                      {m.poster_path ? (
                        <Image
                          src={getImageUrl(m.poster_path, 'w342')}
                          alt={t}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/60 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-2 mt-auto">
                      {/* fixed space for two lines of title */}
                      <div className="text-sm text-white line-clamp-2 min-h-[2.75rem]">
                        {t}
                      </div>
                      <div className="text-xs text-white/70 mt-1">{year}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* BOTTOM pagination */}
        <div className="mt-6">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            loading={loading}
            onPrev={() => {
              goPrev();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNext={() => {
              goNext();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
