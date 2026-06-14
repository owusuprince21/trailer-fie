import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

export const metadata: Metadata = baseMetadata({
  title: 'Popular People',
  description:
    'Discover actors, directors, creators and celebrities with biographies, known for titles, credits and awards.',
  path: '/people',
  image: `/og?title=${encodeURIComponent('Popular People')}&label=${encodeURIComponent('People')}&subtitle=${encodeURIComponent('Explore biographies, known-for titles, credits and filmographies.')}`,
});

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
