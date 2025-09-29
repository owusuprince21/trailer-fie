// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,   // ← add
  signOut,
  type User,                   // ← add
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Prefer local; gracefully fall back to session if needed (Safari Private)
async function ensurePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    await setPersistence(auth, browserSessionPersistence);
  }
}

function isMobileUA() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Mobi|Mobile|Tablet|Android|iPad|iPhone/i.test(ua);
}

/** Call from UI. Pass { forceRedirect: true } on mobile buttons. */
export async function signInWithGoogle(opts?: { forceRedirect?: boolean }) {
  await ensurePersistence();
  const forceRedirect = !!opts?.forceRedirect;
  const preferRedirect = forceRedirect || isMobileUA();
  if (preferRedirect) {
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

/** Run once on mount (client). Returns the user if a redirect just completed. */
export async function completeAuthRedirect(): Promise<User | null> {
  try {
    await ensurePersistence();
    const res = await getRedirectResult(auth);
    // If a redirect just finished, res?.user exists.
    // Otherwise, if already signed in (restored), use currentUser.
    return res?.user ?? auth.currentUser;
  } catch {
    return auth.currentUser ?? null;
  }
}

export async function logout() {
  await signOut(auth);
}
