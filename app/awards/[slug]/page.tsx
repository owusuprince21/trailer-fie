'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import NextDynamic from 'next/dynamic';
import { ArrowLeft, Award, CalendarDays, Trophy } from 'lucide-react';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AwardHighlight, useAwardDetails } from '@/lib/swr';

const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });

export const dynamic = 'force-dynamic';

export default function AwardDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: award, isLoading, error } = useAwardDetails(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
          <Skeleton className="h-72 rounded-lg bg-white/10" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-lg bg-white/10" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !award) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-32 text-center sm:px-6 lg:px-8">
          <Trophy className="mx-auto h-14 w-14 text-cyan-300" />
          <h1 className="mt-4 text-3xl font-bold">Award not found</h1>
          <p className="mt-3 text-gray-400">This award page could not be loaded right now.</p>
          <Button asChild className="mt-6 bg-sky-600 hover:bg-sky-700">
            <Link href="/awards">Back to Awards</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        {award.backdropUrl && (
          <Image
            src={award.backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/45" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white p-5 shadow-2xl">
            {award.logoUrl || award.imageUrl ? (
              <Image
                src={award.logoUrl || award.imageUrl || ''}
                alt={award.name}
                width={180}
                height={180}
                className="max-h-full max-w-full object-contain"
                priority
              />
            ) : (
              <Award className="h-20 w-20 text-cyan-500" />
            )}
          </div>

          <div className="max-w-3xl">
            <Link
              href="/awards"
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Awards
            </Link>
            <h1 className="text-4xl font-extrabold tracking-normal sm:text-5xl">{award.name}</h1>
            {award.description && (
              <p className="mt-5 max-w-3xl text-base leading-7 text-gray-200 sm:text-lg">
                {award.description}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {award.date && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-gray-100">
                  <CalendarDays className="h-4 w-4" />
                  Next ceremony: {award.date}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <AwardHighlightSection title="Most Awarded Movies" items={award.mostAwardedMovies} />
        <AwardHighlightSection title="Most Awarded People" items={award.mostAwardedPeople} />
        <AwardHighlightSection title="Most Nominated Movies" items={award.mostNominatedMovies} />
        <AwardHighlightSection title="Most Nominated People" items={award.mostNominatedPeople} />

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Recent Ceremonies</h2>
              <p className="mt-1 text-sm text-gray-400">A quick view of recent ceremony years for this award.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-300">
              {award.ceremonies.length}
            </span>
          </div>

          {award.ceremonies.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {award.ceremonies.slice(0, 12).map((ceremony) => (
                <div
                  key={ceremony.id}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{ceremony.name}</p>
                      {ceremony.year && <p className="mt-1 text-sm text-gray-400">{ceremony.year}</p>}
                    </div>
                    <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                      Ceremony
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel label="Ceremonies are not available yet." />
          )}
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Award Categories</h2>
              <p className="mt-1 text-sm text-gray-400">Core competition categories attached to this award.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-300">
              {award.categories.length}
            </span>
          </div>

          {award.categories.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {award.categories.slice(0, 30).map((category) => (
                <div
                  key={category.slug}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <span className="font-medium text-gray-100">{category.name}</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-gray-300">Category</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel label="Categories are not available yet." />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function AwardHighlightSection({ title, items }: { title: string; items: AwardHighlight[] }) {
  if (!items.length) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-gray-400">Ranked summary cards from this award history.</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-color:rgba(148,163,184,0.5)_transparent]">
        {items.map((item) => (
          <Link
            key={`${item.mediaType}-${item.id}-${item.name}`}
            href={item.href}
            className="group w-36 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-white/[0.07] sm:w-40"
          >
            <div className="relative aspect-[2/3] bg-neutral-900">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="160px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : item.mediaType === 'person' ? (
                <Image
                  src="/person-placeholder.svg"
                  alt={item.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-neutral-950">
                  <Award className="h-12 w-12 text-cyan-300" />
                </div>
              )}
            </div>
            <div className="space-y-1.5 p-3">
              <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">
                {item.name}
              </h3>
              <div className="space-y-0.5 text-xs text-gray-400">
                {item.nominations && <p>{item.nominations}</p>}
                {item.wins && <p>{item.wins}</p>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-gray-400">
      {label}
    </div>
  );
}
