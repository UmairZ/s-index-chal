'use client';
import { useEffect, useState } from 'react';
import Nav from './Nav';
import Tail from './Tail';
import StaticReveal from './StaticReveal';
import VariantToggle from './VariantToggle';
import ExplainerPanel from './ExplainerPanel';
import { parseVariant, type Variant } from '@/lib/variant';
import { useStaticMode } from '@/lib/useStaticMode';
import type { TermKey } from '@/lib/content';

export default function Landing() {
  const [variant, setVariant] = useState<Variant>('a');
  const [panel, setPanel] = useState<TermKey | null>(null);
  const staticMode = useStaticMode();

  useEffect(() => {
    const sync = () => setVariant(parseVariant(window.location.hash));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const choose = (v: Variant) => { window.location.hash = v; };

  // Task 6 replaces the 'a' branch with <RevealA/>, Task 7 the 'b' branch with <RevealB/>.
  const body = <StaticReveal onTermClick={setPanel} />;

  return (
    <main>
      <div className="stage">
        <div className="wrap"><Nav /></div>
        {body}
      </div>
      <Tail />
      <VariantToggle variant={variant} onChange={choose} />
      <ExplainerPanel term={panel} onClose={() => setPanel(null)} onJump={setPanel} />
    </main>
  );
}
