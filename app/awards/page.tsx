'use client';

import Image from 'next/image';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import { useState } from 'react';
import { Award, CalendarDays, Trophy } from 'lucide-react';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAwards } from '@/lib/swr';

const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });

export const dynamic = 'force-dynamic';

export default function AwardsPage() {
  const { data, isLoading, error } = useAwards();
  const awards = data?.results ?? [];
  const [visibleCount, setVisibleCount] = useState(24);
  const visibleAwards = awards.slice(0, visibleCount);
  const canShowMore = visibleCount < awards.length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.28),transparent_36%),linear-gradient(135deg,#050505,#111827_48%,#020617)] px-4 pt-28 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex max-w-3xl flex-col gap-5">
            <div className="flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200">
              <Trophy className="h-4 w-4" />
              Prestigious Awards
            </div>
            <h1 className="text-4xl font-extrabold tracking-normal text-white sm:text-5xl">
              Movie and TV Awards
            </h1>
            <p className="max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
              Browse major ceremonies, award categories, nomination histories and the honors that shape film and television culture.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Popular Awards</h2>
            <p className="mt-1 text-sm text-gray-400">
              Browse the full awards here in Trailer Fie.
            </p>
          </div>
          <span className="hidden rounded-full border border-white/10 px-3 py-1 text-sm text-gray-300 sm:inline-flex">
            {awards.length || 0} awards
          </span>
        </div>

        {isLoading ? (
          <AwardsSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-6 text-red-100">
            Awards could not be loaded right now.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {visibleAwards.map((award) => (
                <Link
                  key={award.slug}
                  href={`/awards/${award.slug}`}
                  className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-white/[0.07]"
                >
                  <div className="relative aspect-square bg-neutral-900">
                    {award.imageUrl ? (
                      <Image
                        src={award.imageUrl}
                        alt={award.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-contain p-5 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-neutral-950">
                        <Award className="h-14 w-14 text-cyan-300" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">
                      {award.name}
                    </h3>
                    {award.date && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {award.date}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {canShowMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + 24)}
                  className="bg-sky-600 px-8 hover:bg-sky-700"
                >
                  See More Awards
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

function AwardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          <Skeleton className="aspect-square w-full bg-white/10" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-4/5 bg-white/10" />
            <Skeleton className="h-3 w-2/3 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
