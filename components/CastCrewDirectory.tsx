'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clapperboard, Users } from 'lucide-react';
import { getBackdropUrl, getImageUrl } from '@/lib/tmdb';

type CastMember = {
  id: number;
  credit_id?: string;
  name?: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
};

type CrewMember = {
  id: number;
  credit_id?: string;
  name?: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
};

function PersonAvatar({
  path,
  name,
  className = 'h-16 w-16',
}: {
  path?: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-white/10 ${className}`}>
      {path ? (
        <Image
          src={getImageUrl(path, 'w185')}
          alt={name}
          fill
          sizes="96px"
          className="object-cover"
        />
      ) : (
        <Image src="/person-placeholder.svg" alt={name} fill sizes="96px" className="object-cover" />
      )}
    </div>
  );
}

export default function CastCrewDirectory({
  title,
  subtitle,
  backHref,
  posterPath,
  backdropPath,
  cast = [],
  crew = [],
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  cast?: CastMember[];
  crew?: CrewMember[];
}) {
  const crewByDepartment = crew.reduce<Record<string, CrewMember[]>>((groups, member) => {
    const department = member.department || 'Crew';
    groups[department] = groups[department] || [];
    groups[department].push(member);
    return groups;
  }, {});

  const departments = Object.keys(crewByDepartment).sort((a, b) => {
    const preferred = ['Directing', 'Writing', 'Production', 'Camera', 'Editing', 'Sound'];
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.localeCompare(b);
  });

  return (
    <main className="min-h-screen">
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: `url(${getBackdropUrl(backdropPath || null)})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/55" />
        <div className="relative mx-auto flex max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
          <div className="relative hidden aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg bg-white/10 shadow-xl sm:block">
            {posterPath ? (
              <Image
                src={getImageUrl(posterPath, 'w342')}
                alt={title}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 self-center">
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to details
            </Link>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-white/70">{subtitle}</p> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-sky-300" />
          <h2 className="text-2xl font-bold text-white">Cast</h2>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-sm text-white/65">
            {cast.length}
          </span>
        </div>

        {cast.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cast.map((person, index) => {
              const name = person.name || 'Unknown';
              return (
                <Link
                  key={person.credit_id ?? `${person.id}-${index}`}
                  href={`/person/${person.id}`}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <PersonAvatar path={person.profile_path} name={name} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{name}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-white/60">
                      {person.character || 'Role not listed'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-white/65">
            No cast has been added yet.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-emerald-300" />
          <h2 className="text-2xl font-bold text-white">Crew</h2>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-sm text-white/65">
            {crew.length}
          </span>
        </div>

        {departments.length ? (
          <div className="space-y-8">
            {departments.map((department) => (
              <div key={department}>
                <h3 className="mb-3 text-lg font-semibold text-white">{department}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {crewByDepartment[department].map((person, index) => {
                    const name = person.name || 'Unknown';
                    return (
                      <Link
                        key={person.credit_id ?? `${person.id}-${person.job}-${index}`}
                        href={`/person/${person.id}`}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                      >
                        <PersonAvatar path={person.profile_path} name={name} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white">{name}</div>
                          <div className="mt-1 line-clamp-2 text-sm text-white/60">
                            {person.job || department}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-white/65">
            No crew has been added yet.
          </div>
        )}
      </section>
    </main>
  );
}
