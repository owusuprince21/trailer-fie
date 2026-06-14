import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

export const metadata: Metadata = baseMetadata({
  title: 'Movie Events',
  description:
    'Discover upcoming movie premieres, entertainment events, festivals and special screenings on Trailer Fie.',
  path: '/events',
  image: `/og?title=${encodeURIComponent('Movie Events')}&label=${encodeURIComponent('Events')}&subtitle=${encodeURIComponent('Premieres, festivals, screenings and entertainment events.')}`,
});

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
