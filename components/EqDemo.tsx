'use client';
import { useState } from 'react';
import Equation from './Equation';
import ExplainerPanel from './ExplainerPanel';
import type { TermKey } from '@/lib/content';

export default function EqDemo() {
  const [open, setOpen] = useState<TermKey | null>(null);
  return (
    <>
      <Equation interactive onTermClick={setOpen} />
      <ExplainerPanel term={open} onClose={() => setOpen(null)} onJump={setOpen} />
    </>
  );
}
