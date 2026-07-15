'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, CARD_TERM, type Principle, type PrincipleKey, type TermKey } from '@/lib/content';

function RailItem({ p, i, active, onActive }: {
  p: Principle; i: number; active: boolean; onActive: (k: PrincipleKey) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // always-on (once:false) tracking so the active highlight follows scroll in
  // both directions; kept separate from the entrance animation below.
  const inView = useInView(ref, { margin: '-42% 0px -42% 0px' });

  useEffect(() => {
    if (inView) onActive(p.key);
  }, [inView, p.key, onActive]);

  return (
    <motion.div
      ref={ref}
      className={`rb-item${active ? ' on' : ''}`}
      initial={{ opacity: 0, x: -28 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: i * 0.04 }}
      viewport={{ once: true, margin: '-42% 0px -42% 0px' }}
    >
      <PrincipleCard p={p} />
      <p className="rb-note">{p.note}</p>
    </motion.div>
  );
}

export default function RevealB({ onTermClick }: { onTermClick: (k: TermKey) => void }) {
  const [active, setActive] = useState<PrincipleKey | null>(null);

  return (
    <section className="revealB" aria-label="From principles to equation">
      <div className="wrap">
        <HeroIntro />
        <div className="prins" style={{ margin: '32px 0 0' }}>
          {PRINCIPLES.map(p => <PrincipleCard key={p.key} p={p} />)}
        </div>
        <div className="rb-hint" aria-hidden="true">Scroll ↓</div>

        <div className="rb-cols">
          <div className="rb-rail">
            {PRINCIPLES.map((p, i) => (
              <RailItem key={p.key} p={p} i={i} active={active === p.key} onActive={setActive} />
            ))}
          </div>
          <div className="rb-eqcol">
            <motion.div
              className="rb-sticky"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: '0px 0px -30% 0px' }}
            >
              <div className="cap">The equation they demand</div>
              <Equation interactive onTermClick={onTermClick}
                highlight={active ? CARD_TERM[active] : null} />
              <p className="rb-cap">Each principle lights up its term. Click any coloured term.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
