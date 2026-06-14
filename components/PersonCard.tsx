'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/tmdb';
import { prefetchPerson } from '@/lib/prefetch';

interface PersonCardProps {
  person: {
    id: number;
    name?: string | null;
    profile_path?: string | null;
    known_for_department?: string | null;
    known_for?: Array<{ title?: string; name?: string }> | null;
  };
}

export default function PersonCard({ person }: PersonCardProps) {
  const [imageError, setImageError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefetched = useRef(false);

  if (!person?.id) return null;

  const href = `/person/${person.id}`;
  const name = person.name || 'Unknown';
  const dept = person.known_for_department || '';
  const knownForTitle =
    person.known_for?.[0]?.title || person.known_for?.[0]?.name || '';

  const handlePrefetch = async () => {
    if (prefetched.current) return;
    // App Router prefetch returns void — no .catch()
    router.prefetch(href);
    await prefetchPerson(queryClient, person.id);
    prefetched.current = true;
  };

  return (
    <motion.div
      className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer group h-full flex flex-col"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={href}
        prefetch
        className="flex h-full flex-col"
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        onTouchStart={handlePrefetch}
        aria-label={`View ${name}'s profile`}
      >
        {/* Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {!imageError && person.profile_path ? (
            <Image
              src={getImageUrl(person.profile_path)}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 50vw, 20vw"
              priority={false}
            />
          ) : (
            <Image src="/person-placeholder.svg" alt={name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 20vw" />
          )}

          {/* Hover overlay */}
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/50">
                View Profile
              </Button>
            </motion.div>
          )}
        </div>

        {/* Text block (fixed heights so all cards align) */}
        <div className="p-3">
          <h3
            className="font-semibold text-gray-900 mb-1 text-sm md:text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.8em',
            }}
            title={name}
          >
            {name}
          </h3>

          <p className="text-xs md:text-sm text-gray-600 line-clamp-1">
            {dept || '\u00A0'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1" title={knownForTitle}>
            {knownForTitle || '\u00A0'}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
