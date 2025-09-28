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
  signOut,
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

function isMobileUA() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Mobi|Mobile|Tablet|Android|iPad|iPhone/i.test(ua);
}

/** Call from UI. Pass { forceRedirect: true } on mobile buttons. */
export async function signInWithGoogle(opts?: { forceRedirect?: boolean }) {
  await setPersistence(auth, browserLocalPersistence);
  const forceRedirect = !!opts?.forceRedirect;
  const preferRedirect = forceRedirect || isMobileUA();

  if (preferRedirect) {
    await signInWithRedirect(auth, provider);
  } else {
    await signInWithPopup(auth, provider);
  }
}

/** Safe no-op if there’s no pending redirect. Call once on mount (client). */
export async function completeAuthRedirect(): Promise<void> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await getRedirectResult(auth);
  } catch {
    // ignore
  }
}

export async function logout() {
  await signOut(auth);
}
