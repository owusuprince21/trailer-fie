'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Carousel from '@/components/Carousel';
import { Button } from '@/components/ui/button';
import {
  usePersonDetails,
  usePersonCombinedCredits,
  usePersonExternalIds,
} from '@/lib/swr';
import { getImageUrl, formatDate } from '@/lib/tmdb';
import { Twitter, Instagram, Facebook, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

/* ---------------- Skeleton atoms ---------------- */
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}
function SkelLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse h-4 rounded bg-white/10 ${className}`} />;
}
/* ----------------------------------------------- */

/* ---------------- Types (minimal TMDB shapes we actually use) ---------------- */

type PersonDetails = {
  id: number;
  name: string;
  profile_path?: string | null;
  homepage?: string | null;
  biography?: string;
  known_for_department?: string;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  also_known_as?: string[];
  gender?: number; // 0 unknown, 1 female, 2 male, 3 non-binary (TMDB)
};

type CastCredit = {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;            // movie
  name?: string;             // tv
  character?: string;
  poster_path?: string | null;
  release_date?: string;     // movie
  first_air_date?: string;   // tv
  vote_count?: number;
  popularity?: number;
};

type CrewCredit = {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  job?: string;
  department?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_count?: number;
  popularity?: number;
};

type CombinedCredits = {
  cast: CastCredit[];
  crew: CrewCredit[];
};

type ExternalIds = {
  imdb_id?: string | null;
  twitter_id?: string | null;
  instagram_id?: string | null;
  facebook_id?: string | null;
};

/* ---------------- Helpers ---------------- */

function getYear(credit: { release_date?: string; first_air_date?: string }) {
  const date = credit.release_date || credit.first_air_date;
  if (!date) return '—';
  const y = new Date(date).getFullYear();
  return Number.isFinite(y) ? String(y) : '—';
}

function calcAge(birthday?: string, deathday?: string | null) {
  if (!birthday) return '';
  const b = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  let age = end.getFullYear() - b.getFullYear();
  const m = end.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < b.getDate())) age--;
  return deathday ? `(${age} years, died)` : `(${age} years old)`;
}

/* ---------------- Page ---------------- */

export default function PersonDetailPage() {
  const params = useParams();
  const id = Number.parseInt(params.id as string, 10);

  // Cast SWR results to typed shapes so TS knows the properties
  const personRes = usePersonDetails(id);
  const person = personRes.data as PersonDetails | undefined;

  const creditsRes = usePersonCombinedCredits(id);
  const credits = creditsRes.data as CombinedCredits | undefined;

  const externalIdsRes = usePersonExternalIds(id);
  const externalIds = externalIdsRes.data as ExternalIds | undefined;

  const isLoading = personRes.isLoading || creditsRes.isLoading;

  // Build Known For (cast + crew), prefer highest vote_count/popularity, posters only, top 10
  const knownFor = useMemo(() => {
    const all = [...(credits?.cast ?? []), ...(credits?.crew ?? [])];
    return all
      .filter((c) => c.poster_path)
      .sort((a, b) => {
        const byVotes = (b.vote_count ?? 0) - (a.vote_count ?? 0);
        if (byVotes !== 0) return byVotes;
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      })
      .slice(0, 10);
  }, [credits]);

  // Acting filmography (cast) sorted by year desc, then title
  const actingCredits = useMemo(() => {
    const cast = credits?.cast ?? [];
    return cast.slice().sort((a, b) => {
      const yb = Number.parseInt(getYear(b), 10);
      const ya = Number.parseInt(getYear(a), 10);
      if (Number.isFinite(yb) && Number.isFinite(ya) && yb !== ya) return yb - ya;
      return (a.title || a.name || '').localeCompare(b.title || b.name || '');
    });
  }, [credits]);

  /* ---------------- Skeleton state ---------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-[25px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* LEFT: Profile + Social + Personal Info (skeleton) */}
            <aside className="lg:col-span-1">
              <Skel className="relative aspect-[2/3] w-full max-w-sm mx-auto rounded-xl shadow-2xl" />
              <div className="flex items-center gap-4 mt-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skel key={i} className="h-9 w-9 rounded-full" />
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
                <SkelLine className="w-40 h-5 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <SkelLine className="w-24 mb-2" />
                      <SkelLine className="w-40" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* RIGHT: Name, Bio, Known For, Acting (skeleton) */}
            <main className="lg:col-span-2">
              <SkelLine className="w-72 h-7" />

              <div className="mt-6 space-y-2">
                <SkelLine className="w-full" />
                <SkelLine className="w-5/6" />
                <SkelLine className="w-3/4" />
              </div>

              <div className="mt-8">
                <SkelLine className="w-48 h-5 mb-3" />
                <div className="flex gap-3 md:gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-[130px] sm:w-[150px]">
                      <Skel className="w-full aspect-[2/3] rounded-lg" />
                      <SkelLine className="w-24 mt-2" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between">
                  <SkelLine className="w-28 h-5" />
                </div>
                <div className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <SkelLine className="w-12 h-4 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <SkelLine className="w-1/2" />
                          <SkelLine className="w-1/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </section>
        <Footer />
      </div>
    );
  }
  /* ------------------------------------------------ */

  if (!person) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">Person not found</div>
        <Footer />
      </div>
    );
  }

  const knownCreditsCount = (credits?.cast?.length ?? 0) + (credits?.crew?.length ?? 0);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: Profile + Social + Personal Info */}
          <aside className="lg:col-span-1">
            {/* Profile */}
            <div className="relative aspect-[2/3] w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-2xl bg-white/5">
              {person.profile_path ? (
                <Image
                  src={getImageUrl(person.profile_path, 'w500')}
                  alt={person.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-4 mt-5 text-white">
              {externalIds?.twitter_id && (
                <Button variant="ghost" size="icon" asChild className="text-white/90">
                  <a
                    aria-label="Twitter / X"
                    href={`https://twitter.com/${externalIds.twitter_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {externalIds?.instagram_id && (
                <Button variant="ghost" size="icon" asChild className="text-white/90">
                  <a
                    aria-label="Instagram"
                    href={`https://instagram.com/${externalIds.instagram_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {externalIds?.facebook_id && (
                <Button variant="ghost" size="icon" asChild className="text-white/90">
                  <a
                    aria-label="Facebook"
                    href={`https://facebook.com/${externalIds.facebook_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {externalIds?.imdb_id && (
                <Button variant="ghost" size="icon" asChild className="text-white/90">
                  <a
                    aria-label="IMDb"
                    href={`https://www.imdb.com/name/${externalIds.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {person.homepage && (
                <Button variant="ghost" size="icon" asChild className="text-white/90">
                  <a
                    aria-label="Homepage"
                    href={person.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>

            {/* Personal Info */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Personal Info</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-white">Known For</p>
                  <p className="text-gray-300">{person.known_for_department || '-'}</p>
                </div>

                <div>
                  <p className="font-medium text-white">Known Credits</p>
                  <p className="text-gray-300">{knownCreditsCount}</p>
                </div>

                {typeof person.gender === 'number' && (
                  <div>
                    <p className="font-medium text-white">Gender</p>
                    <p className="text-gray-300">
                      {person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : '—'}
                    </p>
                  </div>
                )}

                {person.birthday && (
                  <div>
                    <p className="font-medium text-white">Birthday</p>
                    <p className="text-gray-300">
                      {formatDate(person.birthday)} {calcAge(person.birthday, person.deathday)}
                    </p>
                  </div>
                )}

                {person.deathday && (
                  <div>
                    <p className="font-medium text-white">Day of Death</p>
                    <p className="text-gray-300">{formatDate(person.deathday)}</p>
                  </div>
                )}

                {person.place_of_birth && (
                  <div>
                    <p className="font-medium text-white">Place of Birth</p>
                    <p className="text-gray-300">{person.place_of_birth}</p>
                  </div>
                )}

                {Array.isArray(person.also_known_as) && person.also_known_as.length > 0 && (
                  <div>
                    <p className="font-medium text-white">Also Known As</p>
                    <ul className="text-gray-300 space-y-1">
                      {person.also_known_as.slice(0, 8).map((aka) => (
                        <li key={aka}>{aka}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT: Name, Bio, Known For, Acting */}
          <main className="lg:col-span-2">
            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{person.name}</h1>

            {/* Biography */}
            {person.biography && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-white mb-2">Biography</h2>
                <p className="text-gray-300 leading-7 whitespace-pre-line">
                  {person.biography}
                </p>
              </div>
            )}

            {/* Known For – mini carousel */}
            {knownFor.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white mb-3">Known For</h2>
                <Carousel className="w-full">
                  {knownFor.map((k) => {
                    const title = k.media_type === 'movie' ? k.title : k.name;
                    const href = `/${k.media_type}/${k.id}`;
                    return (
                      <Link key={`${k.media_type}-${k.id}`} href={href} className="block">
                        <div className="w-[130px] sm:w-[150px]">
                          <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg bg-white/10">
                            {k.poster_path ? (
                              <Image
                                src={getImageUrl(k.poster_path, 'w342')}
                                alt={title || 'Poster'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-gray-200 line-clamp-2">{title}</p>
                        </div>
                      </Link>
                    );
                  })}
                </Carousel>
              </div>
            )}

            {/* Acting / Filmography */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Acting</h2>
                {/* Placeholder for future filters */}
              </div>

              <div className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
                {actingCredits.length === 0 && (
                  <div className="p-4 text-gray-400">No acting credits found.</div>
                )}

                {actingCredits.map((c) => {
                  const title = c.media_type === 'movie' ? c.title : c.name;
                  const year = getYear(c);
                  const role = c.character ? `as ${c.character}` : '';
                  const href = `/${c.media_type}/${c.id}`;

                  return (
                    <div key={`${c.media_type}-${c.id}-${title}`} className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 shrink-0 text-sm text-gray-400">{year}</div>
                        <div className="flex-1">
                          <Link href={href} className="font-medium text-white hover:underline">
                            {title}
                          </Link>
                          <div className="text-sm text-gray-300">{role}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
}
