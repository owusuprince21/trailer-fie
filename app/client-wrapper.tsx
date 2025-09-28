'use client';

import { useState, useEffect } from 'react';
import TrailerFieLoader from '@/components/loaders/TrailerFieLoader3D';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {booting && <TrailerFieLoader />}
      {children}
    </>
  );
}
