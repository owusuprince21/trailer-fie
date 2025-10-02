'use client';
export const dynamic = 'force-dynamic'
import { useState } from 'react';
import { Search } from 'lucide-react';
import NextDynamic from 'next/dynamic';
const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });
import Footer from '@/components/Footer';
import PersonCard from '@/components/PersonCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePopularPeople } from '@/lib/swr';
import { tmdbApi } from '@/lib/tmdb';

interface PeopleResults {
  results: any[];
}

export default function PeoplePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PeopleResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: popularPeople, isLoading } = usePopularPeople();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await tmdbApi.searchMulti(searchQuery);
      const peopleResults =
        results.results?.filter((item: any) => item.media_type === 'person') || [];
      setSearchResults({ results: peopleResults });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const displayPeople = searchResults || popularPeople;
  const showSkeleton = isLoading || isSearching;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Popular People</h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover your favorite movie stars and celebrities
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="flex items-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-full shadow-lg overflow-hidden">
                <span className="pl-4 text-gray-300">
                  <Search className="h-5 w-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Search actors, directors, celebrities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 focus:ring-0 px-4 py-3 text-[16px] md:text-lg"
                />
                {searchResults && (
                  <Button
                    type="button"
                    onClick={clearSearch}
                    variant="outline"
                    className="rounded-full mx-2 px-4 bg-white/10 text-white hover:bg-white/20 border-white/30"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* People Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            {searchResults
              ? `Search Results (${searchResults.results?.length || 0})`
              : 'Popular People'}
          </h2>
        </div>

        {showSkeleton ? (
          <PeopleSkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {displayPeople?.results?.map((person: any) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}

        {searchResults && searchResults.results?.length === 0 && !isSearching && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No people found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

/* ---------------- Skeletons ---------------- */

function PeopleSkeletonGrid() {
  // Render a consistent grid of skeleton person cards
  const items = Array.from({ length: 12 });
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {items.map((_, i) => (
        <PersonCardSkeleton key={i} />
      ))}
    </div>
  );
}

function PersonCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="relative w-full">
        {/* Poster area: 2/3 aspect ratio */}
        <div className="w-full" style={{ paddingBottom: '150%' }}>
          <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
