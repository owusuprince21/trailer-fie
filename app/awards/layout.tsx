import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

export const metadata: Metadata = baseMetadata({
  title: 'Awards',
  description:
    'Explore major movie and television awards, ceremonies, categories, winners and nomination histories.',
  path: '/awards',
  image: `/og?title=${encodeURIComponent('Awards')}&label=${encodeURIComponent('Prestigious Awards')}&subtitle=${encodeURIComponent('Explore ceremonies, categories and award histories.')}`,
});

export default function AwardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
