// app/profile/layout.tsx
export const dynamic = 'force-dynamic'
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Your Profile • TRAILER FIE',
  description: 'Manage your watchlist, ratings, favorites, lists and settings.',
};

export default function ProfileSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* offset below fixed navbar */}
      <div className="pt-16">{children}</div>
      <Footer />
    </div>
  );
}
