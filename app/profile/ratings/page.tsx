'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthClient, completeAuthRedirect, signInWithGoogle } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

// ✅ Initialize auth correctly
const auth = getAuthClient();

function useAuthGuard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await completeAuthRedirect().catch(() => {});
      unsub = onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
    })();
    return () => unsub();
  }, []);
  return { ready, user };
}

export default function RatingsPage() {
  const { ready, user } = useAuthGuard();
  if (!ready) return <div className="p-6 text-white/70">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-white/80 mb-4">Sign in to see your ratings.</p>
        <Button onClick={() => signInWithGoogle()} className="bg-sky-600 hover:bg-sky-700">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-300" /> Ratings
        </h1>
        <Button asChild variant="outline" className="border-white/20 text-black">
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </header>

      {/* TODO: replace with your ratings list/grid */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/80 mb-2">You haven’t rated any titles.</p>
        <p className="text-sm text-white/60">Rate titles to get better recommendations.</p>
      </div>
    </div>
  );
}
