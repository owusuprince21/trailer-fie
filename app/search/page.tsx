// app/search/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
// If you already have helpers like getImageUrl, import them:
// import { getImageUrl } from '@/lib/tmdb';

export const revalidate = 0;            // no cache; or remove if you want SSG
export const dynamic = 'force-dynamic'; // optional: ensures fully dynamic

type SearchPageProps = {
  searchParams: { q?: string; page?: string };
};

type BaseItem = {
  id: number;
  media_type: 'movie' | 'tvs';
  title: string;
  year?: string;
  poster_path?: string | null;
};

type SearchResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: BaseItem[];
};

function safeInt(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function buildHref(q: string, page: number) {
  const usp = new URLSearchParams();
  if (q) usp.set('q', q);
  usp.set('page', String(page));
  return `/search?${usp.toString()}`;
}

/**
 * Replace this with your real data source.
 * If you already have /api/search, this will work out of the box.
 */
async function fetchSearch(q: string, page: number): Promise<SearchResponse> {
  if (!q) {
    return { page: 1, total_pages: 1, total_results: 0, results: [] };
  }

  // Try your internal API route first (recommended)
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/search?q=${encodeURIComponent(q)}&page=${page}`, {
    // If your API is same-origin in App Router, omit the base URL:
    // fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`, { ... })
    cache: 'no-store',
  });

  if (!res.ok) {
    // Return an empty shape on failure so the page still renders
    return { page, total_pages: 1, total_results: 0, results: [] };
  }

  const json = await res.json();

  // 🔧 Map your API shape into BaseItem[] if needed.
  // Below is a lenient mapper; adjust fields to your API.
  const results: BaseItem[] = (json.results ?? []).map((r: any) => ({
    id: Number(r.id),
    media_type: r.media_type === 'tvs' ? 'tvs' : 'movie',
    title: r.title ?? r.name ?? 'Untitled',
    year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4),
    poster_path: r.poster_path ?? null,
  }));

  return {
    page: Number(json.page ?? page),
    total_pages: Number(json.total_pages ?? 1),
    total_results: Number(json.total_results ?? results.length),
    results,
  };
}

export default async function Page({ searchParams }: SearchPageProps) {
  const q = String(searchParams.q ?? '').trim();
  const page = safeInt(searchParams.page, 1);

  const data = await fetchSearch(q, page);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Search</h1>
          <p className="text-sm text-white/70">
            {q ? (
              <>
                Showing results for <span className="text-white">{q}</span>
                {data.total_results ? (
                  <> — {data.total_results.toLocaleString()} found</>
                ) : null}
              </>
            ) : (
              <>Type a query to begin.</>
            )}
          </p>
        </div>

        {/* Simple pagination (Prev / Next) */}
        {q && data.total_pages > 1 ? (
          <nav className="flex items-center gap-2">
            <Link
              href={buildHref(q, Math.max(1, page - 1))}
              className={cn(
                'px-3 py-1.5 rounded border border-white/15 text-sm',
                page <= 1
                  ? 'pointer-events-none opacity-40'
                  : 'hover:bg-white/10'
              )}
              aria-disabled={page <= 1}
            >
              Prev
            </Link>
            <span className="text-sm text-white/70">
              Page <span className="text-white">{page}</span> of{' '}
              <span className="text-white">{data.total_pages}</span>
            </span>
            <Link
              href={buildHref(q, Math.min(data.total_pages, page + 1))}
              className={cn(
                'px-3 py-1.5 rounded border border-white/15 text-sm hover:bg-white/10',
                page >= data.total_pages
                  ? 'pointer-events-none opacity-40'
                  : 'hover:bg-white/10'
              )}
              aria-disabled={page >= data.total_pages}
            >
              Next
            </Link>
          </nav>
        ) : null}
      </header>

      {/* Empty state */}
      {!q ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          Try searching for a movie or series.
        </div>
      ) : data.results.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
          No results for “{q}”.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data.results.map((it) => {
            const href = it.media_type === 'movie' ? `/movie/${it.id}` : `/tvs/${it.id}`;
            // If you have getImageUrl, use it. Otherwise use TMDB raw path or placeholder.
            const poster =
              // getImageUrl?.(it.poster_path, 'w342') ??
              (it.poster_path ? `https://image.tmdb.org/t/p/w342${it.poster_path}` : null);

            return (
              <li key={`${it.media_type}-${it.id}`} className="group overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <Link href={href} className="block">
                  <div className="relative aspect-[2/3]">
                    {poster ? (
                      <Image
                        src={poster}
                        alt={it.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 15vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/60 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="line-clamp-2 text-sm text-white">{it.title}</div>
                    {it.year ? (
                      <div className="text-xs text-white/60">{it.year}</div>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bottom pagination (duplicates header controls for convenience) */}
      {q && data.total_pages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={buildHref(q, Math.max(1, page - 1))}
            className={cn(
              'px-3 py-1.5 rounded border border-white/15 text-sm',
              page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-white/10'
            )}
            aria-disabled={page <= 1}
          >
            Prev
          </Link>
          <span className="text-sm text-white/70">
            Page <span className="text-white">{page}</span> of{' '}
            <span className="text-white">{data.total_pages}</span>
          </span>
          <Link
            href={buildHref(q, Math.min(data.total_pages, page + 1))}
            className={cn(
              'px-3 py-1.5 rounded border border-white/15 text-sm',
              page >= data.total_pages
                ? 'pointer-events-none opacity-40'
                : 'hover:bg-white/10'
            )}
            aria-disabled={page >= data.total_pages}
          >
            Next
          </Link>
        </div>
      ) : null}
    </section>
  );
}
