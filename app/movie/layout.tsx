import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

export const metadata: Metadata = baseMetadata({
  title: 'Movies',
  description: 'Browse popular, top rated, now playing and upcoming movies on Trailer Fie.',
  path: '/movie',
  image: `/og?title=${encodeURIComponent('Movies')}&label=${encodeURIComponent('Movies')}&subtitle=${encodeURIComponent('Browse popular, top rated, now playing and upcoming movies.')}`,
});

export default function MovieIndexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
