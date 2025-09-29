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
  browserSessionPersistence,
  signOut,
  type User,
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

const REDIRECT_FLAG = 'tf_auth_redirect_inflight';

export function markRedirectInFlight() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(REDIRECT_FLAG, '1');
  }
}
export function clearRedirectInFlight() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(REDIRECT_FLAG);
  }
}
export function isRedirectInFlight() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(REDIRECT_FLAG) === '1';
}

/** Call from UI. Pass { forceRedirect: true } on mobile buttons. */
export async function signInWithGoogle(opts?: { forceRedirect?: boolean }) {
  await ensurePersistence();
  const preferRedirect = !!opts?.forceRedirect || isMobileUA();
  if (preferRedirect) {
    markRedirectInFlight();
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

/** Run once on mount (client). Returns user if redirect completed (and clears the flag). */
export async function completeAuthRedirect(): Promise<User | null> {
  try {
    await ensurePersistence();
    const res = await getRedirectResult(auth);
    if (res?.user) {
      clearRedirectInFlight();
      return res.user;
    }
    // No fresh redirect result — maybe already restored:
    const u = auth.currentUser ?? null;
    if (u) clearRedirectInFlight();
    return u;
  } catch {
    // even on error, try to use restored session
    const u = auth.currentUser ?? null;
    if (u) clearRedirectInFlight();
    return u;
  }
}

export async function logout() {
  clearRedirectInFlight();
  await signOut(auth);
}
