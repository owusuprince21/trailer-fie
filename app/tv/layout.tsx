import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

export const metadata: Metadata = baseMetadata({
  title: 'TV Shows',
  description: 'Browse popular, top rated, airing today and on-the-air TV shows on Trailer Fie.',
  path: '/tv',
  image: `/og?title=${encodeURIComponent('TV Shows')}&label=${encodeURIComponent('TV')}&subtitle=${encodeURIComponent('Browse popular, top rated, airing today and on-the-air series.')}`,
});

export default function TVIndexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
