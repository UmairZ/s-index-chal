'use client';
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce), (max-width: 959px)';

export function useStaticMode(): boolean {
  return useSyncExternalStore(
    cb => {
      const m = window.matchMedia(QUERY);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
