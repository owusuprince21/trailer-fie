
export const dynamic = 'force-dynamic'
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SectionTabs from '@/components/SectionTabs';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <SectionTabs title="Trending Movies" type="trending" />
        <SectionTabs title="Latest Trailers" type="latest-trailers" />
        <SectionTabs title="What's Popular" type="popular" />
        <SectionTabs title="Free to Watch" type="free-to-watch" />
      </div>

      <Newsletter />
      <Footer />
    </main>
  );
}
