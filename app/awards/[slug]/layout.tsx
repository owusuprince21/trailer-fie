import type { Metadata } from 'next';
import { getAwardDetails } from '@/lib/awards';
import { baseMetadata, cleanDescription } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const award = await getAwardDetails(slug);
  const title = award?.name || 'Award Details';
  const description = cleanDescription(
    award?.description,
    'Explore award ceremonies, categories, winners and nomination histories.'
  );

  return baseMetadata({
    title,
    description,
    path: `/awards/${slug}`,
    image:
      award?.backdropUrl ||
      award?.imageUrl ||
      `/og?title=${encodeURIComponent(title)}&label=${encodeURIComponent('Awards')}&subtitle=${encodeURIComponent(description)}`,
  });
}

export default function AwardDetailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
