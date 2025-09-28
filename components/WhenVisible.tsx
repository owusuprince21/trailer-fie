// components/WhenVisible.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

export default function WhenVisible({
  children,
  rootMargin = '200px',
}: { children: React.ReactNode; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ref.current || show) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShow(true),
      { rootMargin }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [rootMargin, show]);

  return <div ref={ref}>{show ? children : null}</div>;
}
