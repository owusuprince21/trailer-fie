'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, User } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthClient, completeAuthRedirect, signInWithGoogle, logout } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ✅ Initialize Firebase Auth properly
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

export default function SettingsPage() {
  const { ready, user } = useAuthGuard();

  if (!ready) return <div className="p-6 text-white/70">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-white/80 mb-4">Sign in to manage settings.</p>
        <Button onClick={() => signInWithGoogle()} className="bg-sky-600 hover:bg-sky-700">
          Sign in
        </Button>
      </div>
    );
  }

  const displayName = user.displayName || '';
  const email = user.email || '';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-sky-400" /> Settings
        </h1>
        <Button asChild variant="outline" className="border-white/20 text-black">
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-white font-semibold">Account</h2>
          <div className="grid gap-4">
            <label className="text-sm text-white/80">
              Display name
              <Input
                value={displayName}
                readOnly
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </label>
            <label className="text-sm text-white/80">
              Email
              <Input
                value={email}
                readOnly
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="border-white/20 text-black">
              Change password
            </Button>
            <Button onClick={() => logout()} className="bg-rose-600 hover:bg-rose-700">
              Logout
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-2 text-white font-semibold">Privacy</h2>
          <p className="text-sm text-white/70">More settings coming soon.</p>
        </section>
      </div>
    </div>
  );
}
