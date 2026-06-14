'use client';

import { initializeApp, getApps } from 'firebase/app';
import {
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onIdTokenChanged,
  signOut,
  type User,
  type Auth,
} from 'firebase/auth';

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);

// ---- Auth singleton (lazy; never at module top) ----
let _auth: Auth | null = null;
export function getAuthClient(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(app);
  return _auth;
}

// ---- Provider factory ----
function makeProvider() {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
}

// ---- Redirect flags ----
const FLAG = 'tf_auth_redirect_inflight';
export const markRedirectInFlight = () => { try { sessionStorage.setItem(FLAG, '1'); } catch {} };
export const clearRedirectInFlight = () => { try { sessionStorage.removeItem(FLAG); } catch {} };
export const isRedirectInFlight = () => { try { return sessionStorage.getItem(FLAG) === '1'; } catch { return false } };

// ---- First-auth ready promise ----
let _ready: Promise<User | null> | null = null;
export function authReady(): Promise<User | null> {
  if (_ready) return _ready;
  const a = getAuthClient();
  _ready = new Promise<User | null>((resolve) => {
    const unsub = onIdTokenChanged(a, (u) => { unsub(); resolve(u ?? null); });
  });
  return _ready;
}

// ---- Sign-in helpers (lazy get) ----
export function googlePopup() {
  const a = getAuthClient();
  return signInWithPopup(a, makeProvider(), browserPopupRedirectResolver);
}

export function googleRedirect(force?: boolean) {
  const a = getAuthClient();
  const provider = makeProvider();
  return force
    ? signInWithRedirect(a, provider, browserPopupRedirectResolver)
    : signInWithPopup(a, provider, browserPopupRedirectResolver);
}

export async function completeAuthRedirect(): Promise<User | null> {
  const a = getAuthClient();
  const wasRedirecting = isRedirectInFlight();
  if (!wasRedirecting) return a.currentUser ?? null;

  try {
    const res = await getRedirectResult(a);
    if (res?.user) { clearRedirectInFlight(); return res.user; }
  } catch (err) {
    console.error('[completeAuthRedirect] getRedirectResult error:', err);
  }

  // Poll a bit; iOS/Safari sometimes sets currentUser without a result
  const start = Date.now();
  while (Date.now() - start < 5000) {
    try { await a.currentUser?.reload(); } catch {}
    if (a.currentUser) { clearRedirectInFlight(); return a.currentUser; }
    await new Promise(r => setTimeout(r, 200));
  }
  clearRedirectInFlight();
  return a.currentUser ?? null;
}

export async function logout() {
  clearRedirectInFlight();
  await signOut(getAuthClient());
}

export function signInWithGoogle(opts?: { forceRedirect?: boolean }) {
  if (opts?.forceRedirect) {
    return googleRedirect(true);
  }
  // Default: desktop popup. If you want auto-detect, replace with a UA check.
  return googlePopup();
}
