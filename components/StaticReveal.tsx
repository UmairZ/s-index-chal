'use client';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, type TermKey } from '@/lib/content';

export default function StaticReveal({ onTermClick }: { onTermClick: (k: TermKey) => void }) {
  return (
    <div className="wrap">
      <HeroIntro />
      <div className="prins" style={{ margin: '32px 0 44px' }}>
        {PRINCIPLES.map(p => <PrincipleCard key={p.key} p={p} />)}
      </div>
      <div className="sr-eq">
        <div className="cap">And the equation they demand</div>
        <Equation interactive onTermClick={onTermClick} />
        <p className="sr-note">Every term exists because a principle demanded it. Tap any of them.</p>
      </div>
    </div>
  );
}
