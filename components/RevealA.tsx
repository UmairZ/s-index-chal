'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, CARD_TERM, type PrincipleKey, type TermKey } from '@/lib/content';

type Delta = { dx: number; dy: number; s: number };
const START = 0.12, SPAN = 0.30, STAGGER = 0.06;

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const seg = (v: number, from: number, len: number) => smooth((v - from) / len);

export default function RevealA({ onTermClick }: { onTermClick: (k: TermKey) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const eqRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLParagraphElement>(null);
  const cardEls = useRef<Partial<Record<PrincipleKey, HTMLDivElement>>>({});
  const termEls = useRef<Partial<Record<TermKey, HTMLButtonElement>>>({});
  const deltas = useRef<Partial<Record<PrincipleKey, Delta>>>({});
  const [done, setDone] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  // keep the FIRST element registered per term (the opening paren for 'max')
  const setTermRef = (k: TermKey, el: HTMLButtonElement | null) => {
    if (el && !termEls.current[k]) termEls.current[k] = el;
  };

  const apply = useCallback((v: number) => {
    PRINCIPLES.forEach((p, i) => {
      const el = cardEls.current[p.key];
      const term = termEls.current[CARD_TERM[p.key]];
      const d = deltas.current[p.key];
      if (!el || !term || !d) return;
      const k = seg(v, START + i * STAGGER, SPAN);
      el.style.transform = `translate(${k * d.dx}px, ${k * d.dy}px) scale(${1 - (1 - d.s) * k})`;
      el.style.opacity = String(1 - seg(k, 0.85, 0.15)); // card fades as it lands
      term.style.opacity = String(seg(k, 0.8, 0.2));     // term fades in underneath
    });
    if (eqRef.current) {
      eqRef.current.querySelectorAll<HTMLElement>('.g').forEach(g => {
        g.style.opacity = String(seg(v, 0.30, 0.20));
      });
    }
    if (introRef.current) introRef.current.style.opacity = String(1 - seg(v, 0.05, 0.12));
    if (hintRef.current) hintRef.current.style.opacity = String(1 - seg(v, 0.05, 0.08));
    if (afterRef.current) afterRef.current.style.opacity = String(seg(v, 0.66, 0.12));
    setDone(v > 0.62);
  }, []);

  const measure = useCallback(() => {
    for (const p of PRINCIPLES) {
      const card = cardEls.current[p.key];
      const term = termEls.current[CARD_TERM[p.key]];
      if (!card || !term) return;
      card.style.transform = 'none';
      const c = card.getBoundingClientRect();
      const t = term.getBoundingClientRect();
      deltas.current[p.key] = {
        dx: t.left + t.width / 2 - (c.left + c.width / 2),
        dy: t.top + t.height / 2 - (c.top + c.height / 2),
        s: Math.max(0.18, t.height / c.height),
      };
    }
    apply(scrollYProgress.get());
  }, [apply, scrollYProgress]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useMotionValueEvent(scrollYProgress, 'change', apply);

  return (
    <section ref={sectionRef} className="revealA" aria-label="From principles to equation">
      <div className="ra-stage">
        <div className="wrap">
          <div ref={introRef}><HeroIntro /></div>
          <div className="prins ra-cards">
            {PRINCIPLES.map(p => (
              <div key={p.key} className="ra-card"
                ref={el => { cardEls.current[p.key] = el ?? undefined; }}>
                <PrincipleCard p={p} />
              </div>
            ))}
          </div>
          <div className="ra-eq" ref={eqRef}>
            <Equation interactive={done} onTermClick={onTermClick} termRef={setTermRef} />
            <p className="ra-after" ref={afterRef}>
              Every term exists because a principle demanded it. Click any of them.
            </p>
          </div>
          <div className="ra-hint" ref={hintRef} aria-hidden="true">Scroll ↓</div>
        </div>
      </div>
    </section>
  );
}
