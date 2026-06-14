'use client';

export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Search, Ticket, Film, AlertCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });

interface MovieEvent {
  id: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  startsAt?: string;
  localDate?: string;
  localTime?: string;
  status?: string;
  segment?: string;
  genre?: string;
  subGenre?: string;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  priceRange?: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;
}

interface EventsResponse {
  configured: boolean;
  source: string;
  message?: string;
  events: MovieEvent[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'IE', label: 'Ireland' },
  { value: 'MX', label: 'Mexico' },
];

function formatEventDate(event: MovieEvent) {
  const raw = event.startsAt || event.localDate;
  if (!raw) return 'Date TBA';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return event.localDate || 'Date TBA';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatEventTime(event: MovieEvent) {
  if (event.localTime) {
    const [hour = '00', minute = '00'] = event.localTime.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  if (!event.startsAt) return 'Time TBA';
  const date = new Date(event.startsAt);
  if (Number.isNaN(date.getTime())) return 'Time TBA';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatLocation(event: MovieEvent) {
  const venue = event.venue;
  if (!venue) return 'Venue TBA';
  return [venue.name, venue.city, venue.state || venue.country].filter(Boolean).join(', ') || 'Venue TBA';
}

function formatPrice(event: MovieEvent) {
  const price = event.priceRange;
  if (!price || (price.min === undefined && price.max === undefined)) return 'Price varies';
  const currency = price.currency || 'USD';
  const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  if (price.min !== undefined && price.max !== undefined && price.min !== price.max) {
    return `${fmt.format(price.min)} - ${fmt.format(price.max)}`;
  }
  return fmt.format(price.min ?? price.max ?? 0);
}

export default function EventsPage() {
  const [events, setEvents] = useState<MovieEvent[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [cityInput, setCityInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [filters, setFilters] = useState({ city: '', keyword: '', countryCode: 'US' });

  const eventCountLabel = useMemo(() => {
    if (!totalEvents) return 'Upcoming film events';
    return `${totalEvents.toLocaleString()} upcoming film events`;
  }, [totalEvents]);

  useEffect(() => {
    let ignore = false;

    async function loadEvents() {
      setIsLoading(true);
      setMessage(null);

      const params = new URLSearchParams({
        page: '0',
        size: '24',
        countryCode: filters.countryCode,
      });
      if (filters.city.trim()) params.set('city', filters.city.trim());
      if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());

      try {
        const response = await fetch(`/api/events?${params.toString()}`);
        const data = (await response.json()) as EventsResponse;
        if (ignore) return;

        setConfigured(data.configured);
        setEvents(data.events ?? []);
        setPage(data.page?.number ?? 0);
        setTotalPages(data.page?.totalPages ?? 0);
        setTotalEvents(data.page?.totalElements ?? 0);
        setMessage(data.message ?? null);
      } catch {
        if (!ignore) setMessage('Unable to load movie theatre events right now.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadEvents();
    return () => {
      ignore = true;
    };
  }, [filters]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters({
      city: cityInput,
      keyword: keywordInput,
      countryCode,
    });
  };

  const loadMore = async () => {
    if (isLoadingMore || page + 1 >= totalPages) return;
    setIsLoadingMore(true);

    const params = new URLSearchParams({
      page: String(page + 1),
      size: '24',
      countryCode: filters.countryCode,
    });
    if (filters.city.trim()) params.set('city', filters.city.trim());
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());

    try {
      const response = await fetch(`/api/events?${params.toString()}`);
      const data = (await response.json()) as EventsResponse;
      setEvents((current) => [...current, ...(data.events ?? [])]);
      setPage(data.page?.number ?? page + 1);
      setTotalPages(data.page?.totalPages ?? totalPages);
      setTotalEvents(data.page?.totalElements ?? totalEvents);
      setMessage(data.message ?? null);
    } catch {
      setMessage('Unable to load more events right now.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.24),transparent_34%),linear-gradient(135deg,#050505,#1f1020_48%,#020617)] px-4 pt-28 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-pink-300/30 bg-pink-300/10 px-3 py-1 text-sm font-semibold text-pink-100">
              <Film className="h-4 w-4" />
              Live Film Events
            </div>
            <h1 className="text-4xl font-extrabold tracking-normal sm:text-5xl">
              Movie Theatre Events
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
              Find upcoming film screenings, premieres, cinema specials and movie festivals that fans can attend.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 backdrop-blur md:grid-cols-[1fr_1fr_220px_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="Festival, screening, premiere..."
                className="h-11 border-white/10 bg-neutral-950/70 pl-10 text-base text-white placeholder:text-gray-500 focus-visible:ring-pink-300/40"
              />
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                placeholder="City"
                className="h-11 border-white/10 bg-neutral-950/70 pl-10 text-base text-white placeholder:text-gray-500 focus-visible:ring-pink-300/40"
              />
            </div>
            <select
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="h-11 rounded-md border border-white/10 bg-neutral-950/70 px-3 text-base text-white outline-none focus:ring-2 focus:ring-pink-300/40"
              aria-label="Country"
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
            <Button type="submit" className="h-11 bg-pink-600 px-7 hover:bg-pink-700">
              Search
            </Button>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{eventCountLabel}</h2>
            <p className="mt-1 text-sm text-gray-400">
              {filters.city ? `Showing events around ${filters.city}.` : 'Search a city to narrow the results.'}
            </p>
          </div>
          {/* <Badge variant="outline" className="w-fit border-white/10 bg-white/[0.04] text-gray-200">
            Source: Ticketmaster Film events
          </Badge> */}
        </div>

        {!configured && (
          <div className="mb-8 rounded-lg border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h3 className="font-semibold">Events API key needed</h3>
                <p className="mt-1 text-sm text-amber-100/85">
                  Add `TICKETMASTER_API_KEY` to `.env.local` to enable live movie theatre events.
                </p>
              </div>
            </div>
          </div>
        )}

        {message && configured && (
          <div className="mb-8 rounded-lg border border-red-300/20 bg-red-500/10 p-5 text-red-100">
            {message}
          </div>
        )}

        {isLoading ? (
          <EventsSkeleton />
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-10 text-center">
            <Ticket className="mx-auto h-12 w-12 text-pink-200" />
            <h3 className="mt-4 text-xl font-semibold">No events found</h3>
            <p className="mt-2 text-gray-400">
              Try another city, country, or a broader keyword like “film” or “cinema”.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event, index) => (
                <EventCard key={event.id} event={event} eagerImage={index === 0} />
              ))}
            </div>

            {page + 1 < totalPages && (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="bg-pink-600 px-8 hover:bg-pink-700"
                >
                  {isLoadingMore ? 'Loading...' : 'See More Events'}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function EventCard({ event, eagerImage }: { event: MovieEvent; eagerImage?: boolean }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-pink-300/50 hover:bg-white/[0.07]">
      <Link href={`/events/${event.id}`} className="block">
        <div className="relative aspect-[16/9] bg-neutral-900">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              loading={eagerImage ? 'eager' : 'lazy'}
              fetchPriority={eagerImage ? 'high' : 'auto'}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-900 to-pink-950/60">
              <Film className="h-14 w-14 text-pink-200" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {event.genre && (
            <Badge className="bg-pink-500/20 text-pink-100 hover:bg-pink-500/20">{event.genre}</Badge>
          )}
          {event.status && (
            <Badge variant="outline" className="border-white/10 text-gray-200">
              {event.status.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        <div>
          <Link href={`/events/${event.id}`} className="block hover:text-pink-100">
            <h3 className="line-clamp-2 min-h-14 text-xl font-bold leading-7 text-white">{event.title}</h3>
          </Link>
          {event.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-400">{event.description}</p>}
        </div>

        <div className="space-y-2 text-sm text-gray-300">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-pink-200" />
            {formatEventDate(event)}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-pink-200" />
            {formatEventTime(event)}
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-200" />
            <span>{formatLocation(event)}</span>
          </p>
        </div>

        <div className="mt-auto space-y-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-gray-200">{formatPrice(event)}</span>
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
              >
                <Ticket className="h-4 w-4" />
                Tickets
              </a>
            )}
          </div>
          <Button asChild variant="outline" className="w-full border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
            <Link href={`/events/${event.id}`}>Read Event Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function EventsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          <Skeleton className="aspect-[16/9] w-full bg-white/10" />
          <div className="space-y-4 p-5">
            <Skeleton className="h-5 w-24 bg-white/10" />
            <Skeleton className="h-7 w-4/5 bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-3/4 bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
