// components/SmartLink.tsx
'use client';
import Link, { LinkProps } from 'next/link';
import { useEffect, useState } from 'react';

function useIsMobile(bp = 768) {
  const [isMobile, set] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(`(max-width:${bp - 1}px)`);
    const onChange = () => set(m.matches);
    onChange();
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [bp]);
  return isMobile;
}

type Props = LinkProps & { children: React.ReactNode; className?: string };

export default function SmartLink({ prefetch, ...props }: Props) {
  const isMobile = useIsMobile();
  // prefetch on desktop, disable on mobile
  return <Link prefetch={isMobile ? false : prefetch ?? true} {...props} />;
}
