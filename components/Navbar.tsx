'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, User } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';


import {
  getAuthClient,
  signInWithGoogle,
  completeAuthRedirect,
  authReady as waitForAuthReady,
  markRedirectInFlight,
  clearRedirectInFlight,
  googlePopup,
  logout,
  isRedirectInFlight,
  googleRedirect,
} from '@/lib/firebase';




import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

/* ---------------- Prefetch helper ---------------- */
function useSmartPrefetch() {
  const router = useRouter();
  const cacheRef = useRef<Set<string>>(new Set());
  return useCallback(
    (href: string) => {
      if (!href || cacheRef.current.has(href)) return;
      cacheRef.current.add(href);
      const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void) => void);
      if (typeof idle === 'function') idle(() => router.prefetch(href));
      else setTimeout(() => router.prefetch(href), 0);
    },
    [router]
  );
}

type MobileDropdownKey = 'movies' | 'tv' | null;

const MOVIE_ITEMS = [
  { label: 'Popular',      href: '/movies/popular' },
  { label: 'Airing Today', href: '/movies/airing-today' },
  { label: 'On TV',        href: '/movies/on-tv' },
  { label: 'Top Rated',    href: '/movies/top-rated' },
];

const TV_ITEMS = [
  { label: 'Popular',      href: '/tv/popular' },
  { label: 'Airing Today', href: '/tv/airing-today' },
  { label: 'On TV',        href: '/tv/on-tv' },
  { label: 'Top Rated',    href: '/tv/top-rated' },
];

/** Lightweight env detection for mobile auth edge cases */
function detectProblematicEnv() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { inApp: false, isStandalonePWA: false, isIOS: false, isAndroid: false, ua: '' };
  }

  const ua = navigator.userAgent || '';

  // Common in-app browsers that frequently break OAuth (cookies/webview)
  const inApp =
    /\bFBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Pinterest|Snapchat|WhatsApp|WeChat|TikTok|Messenger/i.test(ua) ||
    // Android WebView
    /\bwv\b/.test(ua) ||
    // iOS WebView indicators
    (/\b(iPhone|iPad|iPod)\b/i.test(ua) && !/(Safari|CriOS|FxiOS|EdgiOS)/i.test(ua));

  const isIOS = /\b(iPhone|iPad|iPod)\b/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  // PWA standalone (no browser UI)
  const isStandalonePWA =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true;

  return { inApp, isStandalonePWA, isIOS, isAndroid, ua };
}

export default function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<MobileDropdownKey>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [signingIn, setSigningIn] = useState(false); // ← added
  const router = useRouter();
  const prefetch = useSmartPrefetch();
  const [authInitialized, setAuthInitialized] = useState(false);
  const auth = getAuthClient();

  // Subscribe FIRST, then finalize any pending redirect (prevents iOS race)
// useEffect(() => {
//   let mounted = true;

//   const unsub = onAuthStateChanged(auth, (u) => {
//     if (!mounted) return;
//     console.log('[onAuthStateChanged] user:', u?.email || 'null');
//     setUser(u);
//     setSigningIn(false);
//   });

//   // Only check for redirect on initial load, then mark ready
//   (async () => {
//     if (isRedirectInFlight()) {
//       await completeAuthRedirect();
//     }
//     if (mounted) setAuthReady(true);
//   })();

//   return () => {
//     mounted = false;
//     unsub();
//   };
// }, []);

useEffect(() => {
  let mounted = true;

  const unsub = onAuthStateChanged(auth, (u) => {
    if (!mounted) return;
    console.log('[onAuthStateChanged] user:', u?.email || 'null');
    setUser(u);
    setSigningIn(false);
  });

  // Only check for redirect on initial load, then mark ready
  (async () => {
    if (isRedirectInFlight()) {
      await completeAuthRedirect();
    }
    if (mounted) setAuthReady(true);
  })();

  return () => {
    mounted = false;
    unsub();
  };
}, []); // ← Empty dependency array - run once on mount
  useEffect(() => setMounted(true), []);

  // Lock page scroll when the mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileMenuOpen]);

  // Glass navbar after slight scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

const handleDesktopSignIn = async () => {
  try {
    setSigningIn(true);
    await googlePopup();
    // success: onAuthStateChanged will set user & clear signingIn
  } catch (err) {
    console.error('[signin] popup error', err);
    setSigningIn(false);
  }
};

// const handleMobileSignIn = async () => {
//   try {
//     setSigningIn(true);
//     await googleRedirect(true); // force redirect on mobile
//     // no manual clear; redirect flow will return and your effect will set state
//   } catch (err) {
//     console.error('[signin] redirect error', err);
//     setSigningIn(false);
//   }
// };
const handleMobileSignIn = async () => {
  const env = detectProblematicEnv();

  // If inside an in-app browser or PWA standalone, warn the user first.
  if (env.inApp || env.isStandalonePWA) {
    alert(
      'To sign in with Google, please open this site in your browser.\n' +
        (env.isIOS
          ? 'Tap the ••• menu and choose "Open in Safari".'
          : 'Tap the menu and choose "Open in Chrome".')
    );
    return;
  }

  try {
    setSigningIn(true);

    // Try POPUP first on mobile (more reliable on many devices than redirect)
    await googlePopup();
    // onAuthStateChanged will flip UI to avatar
  } catch (err: any) {
    console.error('[mobile signin][popup] error:', err);
    // If popup is blocked or not allowed, fallback to REDIRECT.
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-opener-blocked') {
      try {
        markRedirectInFlight();
        await googleRedirect(true); // will navigate away
      } catch (e) {
        console.error('[mobile signin][redirect] error:', e);
        clearRedirectInFlight();
        setSigningIn(false);
        alert('Sign-in was blocked. Please allow pop-ups or try a different browser.');
      }
      return;
    }

    if (err?.code === 'auth/popup-closed-by-user') {
      // user closed it — just stop the spinner
      setSigningIn(false);
      return;
    }

    // Generic error
    setSigningIn(false);
    alert('Sign-in failed. Please try again.');
  }
};


  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Prefetch the search route while typing (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    const t = setTimeout(() => prefetch(href), 250);
    return () => clearTimeout(t);
  }, [searchQuery, prefetch]);

  return (
    <nav
      className={cn(
        'fixed inset-x-0 top-0 isolate z-[2147483647] transition-colors duration-300',
        (scrolled || mobileMenuOpen)
          ? 'bg-neutral-900/55 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo (prefetch home) */}
          <Link
            href="/"
            prefetch
            onMouseEnter={() => prefetch('/')}
            onFocus={() => prefetch('/')}
            className={cn(
              'text-xl sm:text-2xl font-extrabold tracking-wide',
              'bg-gradient-to-r from-sky-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent',
              'drop-shadow-[0_1px_8px_rgba(99,102,241,0.35)]'
            )}
            aria-label="Go to homepage"
          >
            TRAILER FIE
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <HoverDropdown label="Movies" items={MOVIE_ITEMS} />
            <HoverDropdown label="TV Series" items={TV_ITEMS} />
            <Link
              href="/people"
              prefetch
              onMouseEnter={() => prefetch('/people')}
              onFocus={() => prefetch('/people')}
              className="text-sm font-medium text-gray-100 transition-colors hover:text-sky-300"
            >
              People
            </Link>
            <Link
              href="/events"
              prefetch
              onMouseEnter={() => prefetch('/events')}
              onFocus={() => prefetch('/events')}
              className="text-sm font-medium text-gray-100 transition-colors hover:text-sky-300"
            >
              Events
            </Link>
          </div>

          {/* Right: Search (desktop) + Auth + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Search (hidden on mobile) */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <Input
                type="text"
                placeholder="Search movies, TV, people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => prefetch('/search')}
                className={cn(
                  'w-64 pl-10 text-white placeholder:text-gray-300',
                  'bg-white/5 border-white/10 focus-visible:ring-sky-400/40'
                )}
                aria-label="Search"
              />
            </form>

            {/* Auth (gate until authReady to prevent SignUp flash) */}
            {authReady && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 ring-1 ring-white/20">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback className="bg-white/10 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-56 bg-neutral-900/95 text-white backdrop-blur-xl border-white/10"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" prefetch onMouseEnter={() => prefetch('/profile')}>
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/lists" prefetch onMouseEnter={() => prefetch('/profile/lists')}>
                      Lists
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/favorites" prefetch onMouseEnter={() => prefetch('/profile/favorites')}>
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/watchlist" prefetch onMouseEnter={() => prefetch('/profile/watchlist')}>
                      Watchlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/ratings" prefetch onMouseEnter={() => prefetch('/profile/ratings')}>
                      Ratings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              authReady && (
                <>
                  {/* Desktop popup */}
                  <Button
                    onClick={handleDesktopSignIn}
                    disabled={signingIn} // ← added
                    className="hidden sm:inline-flex bg-sky-600 hover:bg-sky-700"
                  >
                    {signingIn ? 'Signing in…' : 'Sign Up'}
                  </Button>
                  {/* Mobile forced redirect */}
                  <Button
                    onClick={handleMobileSignIn}
                    disabled={signingIn} // ← added
                    className="sm:hidden bg-sky-600 hover:bg-sky-700"
                    size="sm"
                  >
                    {signingIn ? 'Signing in…' : 'Sign Up'}
                  </Button>
                </>
              )
            )}

            {/* Mobile Hamburger */}
            <Hamburger
              open={mobileMenuOpen}
              onToggle={() => {
                setMobileMenuOpen((v) => !v);
                setOpenMobileDropdown(null);
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Overlay Panel — rendered in a PORTAL above the hero */}
      {mounted && mobileMenuOpen &&
        createPortal(
          <div
            className={cn(
              'fixed inset-x-0 top-16 bottom-0 z-[2147483646] overflow-y-auto text-white pointer-events-auto',
              'bg-neutral-950/90 backdrop-blur-md'
            )}
          >
            <div className="px-4 py-3 pb-24">
              {/* Signed-in quick panel */}
              {authReady && user && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <Avatar className="h-10 w-10 ring-1 ring-white/20">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-white/10 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.displayName}</p>
                    <p className="truncate text-xs text-gray-300">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Movies */}
              <MobileAccordion
                label="Movies"
                open={openMobileDropdown === 'movies'}
                onToggle={() =>
                  setOpenMobileDropdown((prev: MobileDropdownKey) => (prev === 'movies' ? null : 'movies'))
                }
                items={MOVIE_ITEMS}
                onItemClick={() => {
                  setMobileMenuOpen(false);
                  setOpenMobileDropdown(null);
                }}
              />
              {/* TV Shows */}
              <MobileAccordion
                label="TV Series"
                open={openMobileDropdown === 'tv'}
                onToggle={() =>
                  setOpenMobileDropdown((prev: MobileDropdownKey) => (prev === 'tv' ? null : 'tv'))
                }
                items={TV_ITEMS}
                onItemClick={() => {
                  setMobileMenuOpen(false);
                  setOpenMobileDropdown(null);
                }}
              />

              {/* Singles */}
              <div className="mt-2 flex flex-col gap-1">
                <Link
                  href="/people"
                  prefetch
                  onMouseEnter={() => prefetch('/people')}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  People
                </Link>
                <Link
                  href="/events"
                  prefetch
                  onMouseEnter={() => prefetch('/events')}
                  className="rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Events
                </Link>
              </div>

              {/* Profile quick links (mobile) */}
              {authReady && user && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/profile"           className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>View Profile</Link>
                  <Link href="/profile/lists"     className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>Lists</Link>
                  <Link href="/profile/favorites" className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>Favorites</Link>
                  <Link href="/profile/watchlist" className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>Watchlist</Link>
                  <Link href="/profile/ratings"   className="rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>Ratings</Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="rounded-lg bg-red-600/20 px-3 py-2 text-sm hover:bg-red-600/30 text-red-200"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* --- Mobile Search at the END of the menu --- */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <form
                  onSubmit={(e) => {
                    handleSearch(e);
                    setMobileMenuOpen(false);
                  }}
                  className="relative"
                  aria-label="Mobile search"
                >
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    type="text"
                    placeholder="Search movies, TV, people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => prefetch('/search')}
                    className={cn(
                      'w-full pl-10 pr-28 text-white placeholder:text-gray-300',
                      'bg-white/5 border-white/10 focus-visible:ring-sky-400/40',
                      'text-base sm:text-[14px]' // <=16px to prevent iOS zoom
                    )}
                  />
                  <Button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full px-4 bg-sky-600 hover:bg-sky-700"
                  >
                    Search
                  </Button>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </nav>
  );
}

/* ---------- Desktop dropdown (hover + keyboard + prefetch warmup) ---------- */
function HoverDropdown({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prefetch = useSmartPrefetch();

  const openMenu = () => {
    setOpen(true);
    items.forEach((it) => prefetch(it.href)); // warm up all targets on open
  };
  const closeMenu = () => setOpen(false);

  // Close on outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) closeMenu();
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // Close when focus leaves the dropdown area
  const handleBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
    const next = e.relatedTarget as Node | null;
    if (!ref.current?.contains(next)) closeMenu();
  };

  // Trigger keyboard handling
  const handleTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openMenu();
      requestAnimationFrame(() => {
        const first = ref.current?.querySelector<HTMLAnchorElement>('a[data-menuitem]');
        first?.focus();
      });
    }
  };

  // Menu keyboard handling
  const handleMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const itemsEls = Array.from(
      ref.current?.querySelectorAll<HTMLAnchorElement>('a[data-menuitem]') ?? []
    );
    const idx = itemsEls.findIndex((el) => el === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = itemsEls[(idx + 1) % itemsEls.length];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = itemsEls[(idx - 1 + itemsEls.length) % itemsEls.length];
      prev?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      (ref.current?.querySelector('button[data-trigger]') as HTMLButtonElement | null)?.focus();
    }
  };

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onBlur={handleBlur}
    >
      <button
        data-trigger
        className="flex items-center gap-1 text-sm font-medium text-gray-100 transition-colors hover:text-sky-300 focus:outline-none focus:text-sky-300"
        aria-haspopup="menu"
        aria-expanded={open}
        onFocus={openMenu}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn('h-4 w-4 opacity-80 transition-transform', open ? '-rotate-180' : 'rotate-0')}
        />
      </button>

      <div
        className={cn(
          'absolute left-0 top-full z-50 mt-3 w-56 rounded-2xl border border-white/10 bg-neutral-900/90 p-2 backdrop-blur-xl shadow-2xl transition',
          open ? 'visible opacity-100' : 'invisible opacity-0'
        )}
        role="menu"
        aria-label={label}
        onKeyDown={handleMenuKeyDown}
      >
        {/* pointer buffer to prevent flicker moving from trigger to menu */}
        <div className="absolute -top-3 left-0 right-0 h-3" aria-hidden />

        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                prefetch
                onMouseEnter={() => prefetch(it.href)}
                onFocus={() => prefetch(it.href)}
                role="menuitem"
                data-menuitem
                tabIndex={open ? 0 : -1}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-100 hover:bg-white/5 focus:bg-white/10 focus:outline-none"
              >
                <span>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Mobile accordion dropdowns ---------- */
function MobileAccordion({
  label,
  open,
  onToggle,
  items,
  onItemClick,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  items: { label: string; href: string }[];
  onItemClick: () => void;
}) {
  const prefetch = useSmartPrefetch();

  useEffect(() => {
    if (open) items.forEach((it) => prefetch(it.href));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="mb-1 rounded-xl">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/5"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <ul className="mt-1 flex max-h-[50vh] flex-col gap-1 overflow-y-auto rounded-lg bg-white/5 p-1">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                prefetch
                onMouseEnter={() => prefetch(it.href)}
                onFocus={() => prefetch(it.href)}
                onClick={onItemClick}
                className="block rounded-md px-3 py-2 text-sm hover:bg-white/10"
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Animated hamburger ---------- */
function Hamburger({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      className="relative inline-flex h-10 w-10 items-center justify-center md:hidden"
      aria-label="Toggle menu"
      aria-expanded={open}
      onClick={onToggle}
    >
      <span
        className={cn(
          'absolute block h-0.5 w-6 transform rounded-full bg-white transition-all duration-300',
          open ? 'translate-y-0 rotate-45' : '-translate-y-2 rotate-0'
        )}
      />
      <span
        className={cn(
          'absolute block h-0.5 w-6 transform rounded-full bg-white transition-all duration-300',
          open ? 'opacity-0' : 'opacity-100'
        )}
      />
      <span
        className={cn(
          'absolute block h-0.5 w-6 transform rounded-full bg-white transition-all duration-300',
          open ? 'translate-y-0 -rotate-45' : 'translate-y-2 rotate-0'
        )}
      />
    </button>
  );
}
