'use client';
export const dynamic = 'force-dynamic'
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import NextDynamic from 'next/dynamic';
const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  usePersonDetails,
  usePersonCombinedCredits,
  usePersonExternalIds,
  usePersonSummary,
} from '@/lib/swr';
import { getImageUrl, formatDate } from '@/lib/tmdb';
import {
  Award,
  BadgeCheck,
  Camera,
  ChevronDown,
  ExternalLink,
  Globe,
  Keyboard,
  MessageCircle,
  PencilLine,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
  credit_id?: string;
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
  credit_id?: string;
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

type PersonSummary = {
  knownCredits?: number;
  contentScore?: number;
  awards?: {
    wins?: number;
    nominations?: number;
  };
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

function getCreditTitle(credit: CastCredit | CrewCredit) {
  return credit.media_type === 'movie' ? credit.title : credit.name;
}

function getCreditHref(credit: CastCredit | CrewCredit) {
  return credit.media_type === 'movie' ? `/movie/${credit.id}` : `/tvs/${credit.id}`;
}

function KnownForScroller({ items }: { items: Array<CastCredit | CrewCredit> }) {
  if (!items.length) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold text-white">Known For</h2>
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4">
          {items.map((item, index) => {
            const title = getCreditTitle(item) || 'Untitled';
            return (
              <Link
                key={item.credit_id ?? `${item.media_type}-${item.id}-${title}-${index}`}
                href={getCreditHref(item)}
                className="group w-[140px] shrink-0"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/10 shadow-md">
                  {item.poster_path ? (
                    <Image
                      src={getImageUrl(item.poster_path, 'w342')}
                      alt={title}
                      fill
                      sizes="140px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-white/50">
                      No Image
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-center text-sm leading-snug text-white/90 group-hover:text-sky-300">
                  {title}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CareerBanner({
  knownCreditsCount,
  actingCount,
  crewCount,
  wins,
  nominations,
}: {
  knownCreditsCount: number;
  actingCount: number;
  crewCount: number;
  wins?: number;
  nominations?: number;
}) {
  const hasAwards = typeof wins === 'number' || typeof nominations === 'number';

  return (
    <section className="mt-8 overflow-hidden rounded-xl bg-gradient-to-r from-sky-950 via-cyan-900 to-sky-800 px-5 py-5 text-white shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Award className="h-7 w-7 text-cyan-200" />
          <div className="font-serif text-3xl tracking-wide sm:text-4xl">AWARDS</div>
        </div>
        <div className="hidden h-7 w-px bg-white/40 sm:block" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg">
          {hasAwards ? (
            <>
              <span>{wins ?? 0} Wins</span>
              <span>{nominations ?? 0} Nominations</span>
            </>
          ) : (
            <>
              <span>{knownCreditsCount} Credits</span>
              <span>{actingCount} Acting</span>
              <span>{crewCount} Crew</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ContentScore({
  person,
  knownCreditsCount,
  scoreOverride,
}: {
  person: PersonDetails;
  knownCreditsCount: number;
  scoreOverride?: number;
}) {
  const fallbackScore = Math.min(
    100,
    20 +
      (person.profile_path ? 20 : 0) +
      (person.biography ? 25 : 0) +
      (person.birthday ? 10 : 0) +
      (person.place_of_birth ? 10 : 0) +
      Math.min(15, knownCreditsCount)
  );
  const score = scoreOverride ?? fallbackScore;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-white">Content Score</p>
      <div className="overflow-hidden rounded-lg bg-white/15">
        <div className="bg-white/20 px-4 py-3 text-lg font-bold text-white">{score}</div>
        <div className="px-4 py-2 text-sm text-white/80">
          {score >= 80 ? 'Yes! Looking good!' : 'More details can help complete this profile.'}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function PersonDetailPage() {
  const params = useParams();
  const id = Number.parseInt(params.id as string, 10);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  // Cast SWR results to typed shapes so TS knows the properties
  const personRes = usePersonDetails(id);
  const person = personRes.data as PersonDetails | undefined;

  const creditsRes = usePersonCombinedCredits(id);
  const credits = creditsRes.data as CombinedCredits | undefined;

  const externalIdsRes = usePersonExternalIds(id);
  const externalIds = externalIdsRes.data as ExternalIds | undefined;

  const summaryRes = usePersonSummary(id);
  const summary = summaryRes.data as PersonSummary | undefined;

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
            <aside className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
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

  const localKnownCreditsCount = (credits?.cast?.length ?? 0) + (credits?.crew?.length ?? 0);
  const knownCreditsCount = summary?.knownCredits ?? localKnownCreditsCount;
  const crewCreditsCount = credits?.crew?.length ?? 0;
  const alsoKnownAs = Array.from(new Set(person.also_known_as ?? [])).slice(0, 8);

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: Profile + Social + Personal Info */}
          <aside className="lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
            {/* Profile */}
            <div className="relative aspect-[2/3] w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-2xl bg-white/5">
              <Image
                src={
                  !profileImageError && person.profile_path
                    ? getImageUrl(person.profile_path, 'w500')
                    : '/person-placeholder.svg'
                }
                alt={person.name}
                fill
                loading="eager"
                sizes="(max-width: 1024px) 384px, 33vw"
                className="object-cover"
                onError={() => setProfileImageError(true)}
              />
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
                    <MessageCircle className="h-5 w-5" />
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
                    <Camera className="h-5 w-5" />
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
                    <Globe className="h-5 w-5" />
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

                {alsoKnownAs.length > 0 && (
                  <div>
                    <p className="font-medium text-white">Also Known As</p>
                    <ul className="text-gray-300 space-y-1">
                      {alsoKnownAs.map((aka, index) => (
                        <li key={`${aka}-${index}`}>{aka}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <ContentScore
                  person={person}
                  knownCreditsCount={knownCreditsCount}
                  scoreOverride={summary?.contentScore}
                />

                <Button className="w-full rounded-full bg-sky-500 font-bold text-white hover:bg-sky-400">
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit Page
                </Button>

                <button
                  type="button"
                  className="flex items-center gap-2 text-left text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
                >
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </button>
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
                <div className="relative">
                  <p
                    className={`whitespace-pre-line text-gray-300 leading-7 ${
                      bioExpanded ? '' : 'max-h-44 overflow-hidden'
                    }`}
                  >
                    {person.biography}
                  </p>
                  {!bioExpanded && person.biography.length > 520 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent" />
                  )}
                </div>
                {person.biography.length > 520 && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded((open) => !open)}
                    className="mt-2 font-semibold text-sky-300 hover:text-sky-200"
                  >
                    {bioExpanded ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}

            <KnownForScroller items={knownFor} />

            <CareerBanner
              knownCreditsCount={knownCreditsCount}
              actingCount={actingCredits.length}
              crewCount={crewCreditsCount}
              wins={summary?.awards?.wins}
              nominations={summary?.awards?.nominations}
            />

            {/* Acting / Filmography */}
            <div className="mt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-white">Acting</h2>
                <div className="flex gap-3">
                  <Button variant="ghost" className="h-9 text-white hover:bg-white/10">
                    All
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="h-9 text-white hover:bg-white/10">
                    Department
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white text-gray-950 shadow-xl">
                {actingCredits.length === 0 && (
                  <div className="p-4 text-gray-500">No acting credits found.</div>
                )}

                {actingCredits.map((c, index) => {
                  const title = c.media_type === 'movie' ? c.title : c.name;
                  const year = getYear(c);
                  const role = c.character ? `as ${c.character}` : '';
                  const href = getCreditHref(c);

                  return (
                    <div
                      key={c.credit_id ?? `${c.media_type}-${c.id}-${title}-${index}`}
                      className="border-b border-gray-200 p-4 last:border-b-0 sm:p-5"
                    >
                      <div className="flex items-start gap-4 sm:gap-6">
                        <div className="w-12 shrink-0 text-sm text-gray-500">{year}</div>
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="flex-1">
                          <Link href={href} className="font-bold text-gray-950 hover:underline">
                            {title}
                          </Link>
                          <div className="mt-1 text-sm text-gray-600">{role || '—'}</div>
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
