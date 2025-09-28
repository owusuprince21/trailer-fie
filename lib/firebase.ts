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
  inMemoryPersistence,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, // e.g. yourproj.firebaseapp.com
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Try local → session → memory
async function ensurePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch {
      await setPersistence(auth, inMemoryPersistence);
    }
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
  const preferRedirect = !!opts?.forceRedirect || isMobileUA();

  try {
    if (preferRedirect) {
      await signInWithRedirect(auth, provider);
      return;
    }
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    const code = err?.code as string | undefined;
    // Fallback to redirect for popup issues or domain quirks
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/unauthorized-domain'
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    console.error('[Firebase signIn error]', code, err);
    throw err;
  }
}

/** Call once on mount (client). Safe no-op if no pending redirect. */
export async function completeAuthRedirect(): Promise<void> {
  try {
    await ensurePersistence();
    const res = await getRedirectResult(auth);
    // res may be null if user cancelled or storage was memory-only; onAuthStateChanged will still fire if signed in
    if (!res) {
      // Optional: log to see what happens on mobile devices
      // console.info('[Firebase] No redirect result (possibly session/memory persistence).');
    }
  } catch (err: any) {
    console.warn('[Firebase redirect completion]', err?.code || err);
  }
}

export async function logout() {
  await signOut(auth);
}
