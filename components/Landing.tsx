'use client';
import { useEffect, useRef, useState } from 'react';
import Nav from './Nav';
import Tail from './Tail';
import TimelineNav from './TimelineNav';
import AssemblyStage from './AssemblyStage';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import ExplainerPanel from './ExplainerPanel';
import { PRINCIPLES, type TermKey } from '@/lib/content';
import { useStaticMode } from '@/lib/useStaticMode';

const STEP_MS = 1050; // matches the 1s scene/assembly transitions

export default function Landing() {
  const [section, setSection] = useState(0);
  const [panel, setPanel] = useState<TermKey | null>(null);
  const staticMode = useStaticMode();

  // refs so the input listeners never hold stale state
  const busyUntil = useRef(0);
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const panelRef = useRef(panel);
  panelRef.current = panel;

  const go = (i: number) => {
    const n = Math.max(0, Math.min(2, i));
    if (n === sectionRef.current) return;
    busyUntil.current = Date.now() + STEP_MS;
    setPanel(null);
    setSection(n);
  };

  useEffect(() => {
    if (staticMode) return;
    document.body.style.overflow = 'hidden';
    let acc = 0;
    let consumed = false;
    let accTimer = 0;
    const step = (dir: 1 | -1) => {
      if (panelRef.current !== null || Date.now() < busyUntil.current) return;
      go(sectionRef.current + dir);
    };
    const onWheel = (e: WheelEvent) => {
      if (panelRef.current !== null) return; // wheel scrolls the panel, not sections
      acc += e.deltaY;
      window.clearTimeout(accTimer);
      accTimer = window.setTimeout(() => { acc = 0; consumed = false; }, 180);
      if (Math.abs(acc) > 60) {
        const dir: 1 | -1 = acc > 0 ? 1 : -1;
        acc = 0;
        if (!consumed) {
          step(dir);
          consumed = true;
        }
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (panelRef.current !== null) return; // Esc/close handled by the panel
      const tgt = e.target as HTMLElement | null;
      if (e.key === ' ' && tgt !== document.body) return; // let buttons take Space
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); step(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); step(-1);
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) step(dy > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(accTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode]);

  if (staticMode) {
    // normal-flow document: mobile + prefers-reduced-motion
    return (
      <main>
        <Nav />
        <div className="wrap static-flow">
          <section className="astatic">
            <HeroIntro />
            <div className="prins">
              {PRINCIPLES.map(p => <PrincipleCard p={p} key={p.key} />)}
            </div>
            <div className="sr-eq">
              <div className="cap">Every principle, one equation</div>
              <Equation onTermClick={setPanel} highlight={panel} />
              <p className="sr-note">Tap any coloured term to see which principle demanded it.</p>
            </div>
          </section>
        </div>
        <Tail />
        <ExplainerPanel term={panel} onClose={() => setPanel(null)} onJump={setPanel} />
      </main>
    );
  }

  return (
    <main>
      <Nav />
      <div inert={panel !== null || undefined}><TimelineNav active={section} onSelect={go} /></div>
      <div className={`scenes sec-${section}`}>
        <div className="scene scene-stage" inert={section === 2 || panel !== null || undefined}>
          <AssemblyStage
            assembled={section >= 1}
            panelOpen={panel !== null}
            activeTerm={panel}
            // defensive: also blocks clicks when inert is unsupported (pre-2023 browsers)
            onTermClick={k => { if (sectionRef.current === 1) setPanel(k); }}
          />
        </div>
        <div className="scene scene-tail" inert={section !== 2 || panel !== null || undefined}>
          <div className="wrap"><Tail /></div>
        </div>
      </div>
      <ExplainerPanel term={panel} onClose={() => setPanel(null)} onJump={setPanel} />
    </main>
  );
}
