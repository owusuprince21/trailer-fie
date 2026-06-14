import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

export const metadata: Metadata = baseMetadata({
  title: 'Search Movies, TV and People',
  description:
    'Search Trailer Fie for movies, TV shows, people, collections, companies, keywords and entertainment media.',
  path: '/search',
  image: `/og?title=${encodeURIComponent('Search Trailer Fie')}&label=${encodeURIComponent('Search')}&subtitle=${encodeURIComponent('Find movies, TV shows, people, trailers, cast and media.')}`,
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
