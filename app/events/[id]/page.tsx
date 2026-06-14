'use client';

export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import NextDynamic from 'next/dynamic';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Film,
  Info,
  MapPin,
  Ticket,
  UserRound,
  WalletCards,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MovieEvent } from '@/lib/events';
import { useEventDetails } from '@/lib/swr';

const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });

function formatEventDate(event: MovieEvent) {
  const raw = event.startsAt || event.localDate;
  if (!raw) return 'Date TBA';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return event.localDate || 'Date TBA';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
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

function formatFullAddress(event: MovieEvent) {
  const venue = event.venue;
  if (!venue) return 'Venue TBA';
  return [venue.name, venue.address, venue.city, venue.state, venue.postalCode, venue.country]
    .filter(Boolean)
    .join(', ');
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

function formatDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventQuery = useEventDetails(id);
  const event = eventQuery.data?.event ?? null;
  const configured = eventQuery.data?.configured ?? true;
  const message = eventQuery.data?.message || (eventQuery.error ? 'Unable to load this event right now.' : null);

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
          <Skeleton className="h-80 rounded-lg bg-white/10" />
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
            <Skeleton className="h-96 rounded-lg bg-white/10" />
            <Skeleton className="h-96 rounded-lg bg-white/10" />
          </div>
        </main>
      </div>
    );
  }

  if (!configured || !event) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-32 text-center sm:px-6 lg:px-8">
          <Film className="mx-auto h-14 w-14 text-pink-200" />
          <h1 className="mt-4 text-3xl font-bold">Event details unavailable</h1>
          <p className="mt-3 text-gray-400">
            {message || 'This event could not be loaded right now.'}
          </p>
          <Button asChild className="mt-6 bg-pink-600 hover:bg-pink-700">
            <Link href="/events">Back to Events</Link>
          </Button>
        </main>
      </div>
    );
  }

  const saleStart = formatDateTime(event.sales?.startsAt);
  const saleEnd = formatDateTime(event.sales?.endsAt);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        {event.imageUrl && (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-neutral-950/50" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/events"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-pink-100 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Events
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {event.genre && <Badge className="bg-pink-500/20 text-pink-100 hover:bg-pink-500/20">{event.genre}</Badge>}
                {event.subGenre && <Badge variant="outline" className="border-white/10 text-gray-200">{event.subGenre}</Badge>}
                {event.status && <Badge variant="outline" className="border-white/10 text-gray-200">{event.status.replace(/_/g, ' ')}</Badge>}
              </div>
              <h1 className="max-w-4xl text-4xl font-extrabold tracking-normal sm:text-5xl">
                {event.title}
              </h1>
              {event.description && (
                <p className="mt-5 max-w-3xl text-base leading-7 text-gray-200 sm:text-lg">
                  {event.description}
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-2xl">
              <div className="relative aspect-[16/9] bg-neutral-900">
                {event.imageUrl ? (
                  <Image src={event.imageUrl} alt={event.title} fill sizes="420px" className="object-cover" priority />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-900 to-pink-950/60">
                    <Film className="h-16 w-16 text-pink-200" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-8">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold">About This Event</h2>
            <div className="mt-4 space-y-4 text-gray-300">
              {event.info ? <p className="leading-7">{event.info}</p> : null}
              {event.pleaseNote ? (
                <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="leading-7">{event.pleaseNote}</p>
                  </div>
                </div>
              ) : null}
              {!event.info && !event.pleaseNote && (
                <p className="text-gray-400">More event information will appear here when the provider publishes it.</p>
              )}
            </div>
          </section>

          {event.attraction && (
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold">Featured Attraction</h2>
              <div className="mt-5 flex gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
                  {event.attraction.imageUrl ? (
                    <Image src={event.attraction.imageUrl} alt={event.attraction.name || event.title} fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <UserRound className="h-9 w-9 text-pink-200" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{event.attraction.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {[event.attraction.genre, event.attraction.subGenre].filter(Boolean).join(' / ') || 'Film event attraction'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {event.seatmapUrl && (
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold">Venue Seat Map</h2>
              <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-lg bg-white">
                <Image src={event.seatmapUrl} alt={`${event.title} seat map`} fill sizes="(max-width: 1024px) 100vw, 760px" className="object-contain p-2" />
              </div>
            </section>
          )}

          {(event.venue?.parkingDetail || event.venue?.accessibleSeatingDetail || event.venue?.generalRule || event.venue?.childRule) && (
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold">Venue Information</h2>
              <div className="mt-5 space-y-5 text-sm leading-6 text-gray-300">
                {event.venue.parkingDetail && <InfoBlock title="Parking" text={event.venue.parkingDetail} />}
                {event.venue.accessibleSeatingDetail && <InfoBlock title="Accessible Seating" text={event.venue.accessibleSeatingDetail} />}
                {event.venue.generalRule && <InfoBlock title="General Rules" text={event.venue.generalRule} />}
                {event.venue.childRule && <InfoBlock title="Child Rules" text={event.venue.childRule} />}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-bold">Event Details</h2>
            <div className="mt-5 space-y-4 text-sm text-gray-300">
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatEventDate(event)} />
              <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatEventTime(event)} />
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Venue" value={formatFullAddress(event)} />
              <DetailRow icon={<WalletCards className="h-4 w-4" />} label="Price" value={formatPrice(event)} />
              {event.promoter && <DetailRow icon={<UserRound className="h-4 w-4" />} label="Promoter" value={event.promoter} />}
            </div>
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
              >
                <Ticket className="h-4 w-4" />
                Get Tickets
              </a>
            )}
          </section>

          {(saleStart || saleEnd) && (
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-bold">Ticket Sales</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                {saleStart && <DetailRow label="Sales Start" value={saleStart} />}
                {saleEnd && <DetailRow label="Sales End" value={saleEnd} />}
              </div>
            </section>
          )}
        </aside>
      </main>

      <Footer />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      {icon && <span className="mt-0.5 text-pink-200">{icon}</span>}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 leading-6 text-gray-200">{value}</p>
      </div>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-gray-300">{text}</p>
    </div>
  );
}
