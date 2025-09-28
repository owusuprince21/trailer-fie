'use client';

import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';

const Loader3D = dynamic(() => import('./TrailerFieLoader3D'), { ssr: false });

export default function TrailerFieLoader({
  text = 'TRAILER FIE',
}: { text?: string }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // graceful fallback
    return (
      <div
        aria-busy
        aria-live="polite"
        className="fixed inset-0 z-[9999] grid place-items-center bg-[#050507]"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="text-2xl sm:text-4xl font-black tracking-[0.25em] text-white/90">
            {text}
          </div>
          <div className="h-1 w-56 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full w-1/3 rounded-full bg-white/70"
              animate={{ x: ['0%', '200%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      aria-busy
      aria-live="polite"
      className="fixed inset-0 z-[9999]"
    >
      <Loader3D />
    </div>
  );
}
