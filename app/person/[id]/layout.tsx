import type { Metadata } from 'next';
import { baseMetadata, cleanDescription, fetchTmdb } from '@/lib/seo';

type PersonDetails = {
  name?: string;
  biography?: string;
  known_for_department?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const person = await fetchTmdb<PersonDetails>(`/person/${id}`);
  const title = person?.name || 'Person Details';

  return baseMetadata({
    title,
    description: cleanDescription(
      person?.biography,
      `Explore ${title}'s biography, known for titles, credits, awards and filmography.`
    ),
    path: `/person/${id}`,
    image: `/person/${id}/opengraph-image`,
  });
}

export default function PersonDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
