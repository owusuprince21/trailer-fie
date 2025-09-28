'use client';

import { SWRConfig } from 'swr';
import * as React from 'react';

type Props = { children: React.ReactNode };

// Optional: only used when a hook doesn't pass its own fetcher.
// If your SWR hooks already call your tmdbApi helpers, they'll keep doing that.
const defaultFetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    // @ts-expect-error attach status for error UI if you want
    err.status = res.status;
    throw err;
  }
  return res.json();
};

export default function Providers({ children }: Props) {
  return (
    <SWRConfig
      value={{
        fetcher: defaultFetcher,
        // “Cut chatter” (less automatic revalidation):
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        shouldRetryOnError: false,
        errorRetryCount: 1,
        // Reduce duplicate requests across components within a short window:
        dedupingInterval: 60_000,           // 60s
        focusThrottleInterval: 60_000,      // ignore frequent focus events
        keepPreviousData: true,             // smoother UI during tab switches
      }}
    >
      {children}
    </SWRConfig>
  );
}
