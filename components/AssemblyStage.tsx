'use client';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import HeroIntro from './HeroIntro';
import PrincipleCard from './PrincipleCard';
import Equation from './Equation';
import { PRINCIPLES, CARD_TERM, type TermKey, type PrincipleKey } from '@/lib/content';

interface Props {
  assembled: boolean;
  panelOpen: boolean;
  activeTerm: TermKey | null;
  onTermClick: (k: TermKey) => void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const DUR = 1000;   // ms for a full 0↔1 assembly
const CARD_W = 290; // natural card width, matches .acard CSS

const WIRE_COLOR: Record<PrincipleKey, string> = {
  p1: 'var(--p1-l)', p2: 'var(--p2-l)', p3: 'var(--p3-l)', p4: 'var(--p4-l)',
};

interface Geo {
  start: { x: number; y: number }[];
  end: { x: number; y: number }[];
  startS: number;
  endS: number;
}

export default function AssemblyStage({ assembled, panelOpen, activeTerm, onTermClick }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const t = useRef(0); // assembly progress 0..1
  const raf = useRef(0);
  const geo = useRef<Geo>({ start: [], end: [], startS: 1, endS: 0.6 });

  const layout = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const gap = 16;
    // scattered row: scale cards down until four fit with margins
    const startS = clamp((W - 96 - 3 * gap) / (4 * CARD_W), 0.55, 1);
    const sw = CARD_W * startS;
    const rowW = 4 * sw + 3 * gap;
    // row sits below the heading block, never overlapping it
    const head = el.querySelector<HTMLElement>('.as-head');
    const headBottom = head ? head.offsetTop + head.offsetHeight : H * 0.35;
    const x0 = (W - rowW) / 2, y0 = Math.max(H * 0.40, headBottom + 16);
    // settled corners around the centred equation; cards are compact there
    // (body text collapsed via .settled CSS), so they shrink less and stay readable
    const endS = 0.82;
    const ew = CARD_W * endS;
    const cx = W / 2, cy = H / 2;
    const off = Math.min(265, cx - ew - 24);
    const leftX = cx - off - ew, rightX = cx + off;
    // the piecewise equation is two rows tall and settled cards carry the note,
    // so the upper cards start higher and the lower cards further down
    const upY = cy - 275, downY = cy + 70;
    geo.current = {
      startS, endS,
      start: [0, 1, 2, 3].map(i => ({ x: x0 + i * (sw + gap), y: y0 })),
      end: [
        { x: leftX, y: upY }, { x: leftX, y: downY },
        { x: rightX, y: upY }, { x: rightX, y: downY },
      ],
    };
  }, []);

  const drawWires = useCallback(() => {
    const el = stageRef.current, svg = svgRef.current;
    if (!el || !svg) return;
    const d = el.getBoundingClientRect();
    let out = '';
    PRINCIPLES.forEach((p, i) => {
      const card = el.querySelector(`.acard[data-i="${i}"]`);
      // first match — 'max' has two buttons and 'gate' three; wire to the
      // opening paren / the brace respectively
      const key = CARD_TERM[p.key];
      const term = el.querySelector(`.term[data-term="${key}"]`);
      if (!card || !term) return;
      const c = card.getBoundingClientRect(), r = term.getBoundingClientRect();
      const cx = c.left + c.width / 2 - d.left, cy = c.top + c.height / 2 - d.top;
      const tx = r.left + r.width / 2 - d.left;
      // both gate principles land on the brace: p2 upper (gold), p4 lower (rose)
      const ty = key === 'gate'
        ? r.top + r.height * (p.key === 'p2' ? 0.24 : 0.62) - d.top
        : r.top + r.height / 2 - d.top;
      const mx = (cx + tx) / 2;
      const col = WIRE_COLOR[p.key];
      out += `<path d="M ${cx} ${cy} C ${mx} ${cy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" `
        + `stroke="${col}" stroke-width="1.4" opacity=".45" stroke-dasharray="5 5"/>`
        + `<circle cx="${tx}" cy="${ty}" r="3" fill="${col}" opacity=".85"/>`;
    });
    svg.setAttribute('viewBox', `0 0 ${d.width} ${d.height}`);
    svg.innerHTML = out;
  }, []);

  const apply = useCallback((p: number) => {
    const el = stageRef.current;
    if (!el || !geo.current.start.length) return;
    const { start, end, startS, endS } = geo.current;
    el.querySelectorAll<HTMLElement>('.acard').forEach((c, i) => {
      const x = lerp(start[i].x, end[i].x, p);
      const y = lerp(start[i].y, end[i].y, p);
      const s = lerp(startS, endS, p);
      c.style.transform = `translate(${x}px,${y}px) scale(${s})`;
      c.style.opacity = '1';
    });
    const set = (sel: string, v: number) => {
      const n = el.querySelector<HTMLElement>(sel);
      if (n) n.style.opacity = String(v);
    };
    set('.as-head', 1 - smooth(0, 0.45, p));
    set('.as-hint', 1 - smooth(0, 0.2, p));
    set('.as-prompt', smooth(0.92, 1, p));
    const eqA = smooth(0.35, 0.8, p);
    const eq = el.querySelector<HTMLElement>('.as-eq');
    if (eq) {
      eq.style.opacity = String(eqA);
      eq.style.transform =
        `translate(-50%,-50%) translateY(${lerp(28, 0, eqA)}px) scale(${lerp(0.96, 1, eqA)})`;
    }
    const wireA = smooth(0.86, 1, p);
    if (svgRef.current) svgRef.current.style.opacity = String(wireA);
    if (wireA > 0) drawWires();
    else if (svgRef.current) svgRef.current.innerHTML = '';
  }, [drawWires]);

  // layout on mount and resize (declared before the tween effect so mount order is layout → apply)
  useLayoutEffect(() => {
    layout();
    apply(t.current);
    const onResize = () => { layout(); apply(t.current); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [layout, apply]);

  // tween t toward the target whenever `assembled` flips; reversal starts from current t
  useEffect(() => {
    const target = assembled ? 1 : 0;
    const from = t.current;
    if (from === target) { apply(target); return; }
    const t0 = performance.now();
    const dur = Math.max(1, DUR * Math.abs(target - from));
    const frame = (now: number) => {
      const k = clamp((now - t0) / dur, 0, 1);
      t.current = lerp(from, target, easeInOut(k));
      apply(t.current);
      if (k < 1) raf.current = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [assembled, apply]);

  return (
    <div
      ref={stageRef}
      className={`astage${panelOpen ? ' foc' : ''}${assembled ? ' settled' : ''}`}
    >
      <div className="as-head"><HeroIntro /></div>
      <svg className="wires" ref={svgRef} aria-hidden="true" />
      {PRINCIPLES.map((p, i) => (
        <div
          key={p.key}
          className="acard"
          data-i={i}
          onClick={() => assembled && onTermClick(CARD_TERM[p.key])}
        >
          <PrincipleCard p={p} />
        </div>
      ))}
      <div className="as-eq">
        <Equation interactive={assembled} onTermClick={onTermClick} highlight={activeTerm} />
        <div className="as-prompt">
          Every principle is now part of one equation. <b>Click any term or card to go deeper.</b>
        </div>
      </div>
      <div className="as-hint" aria-hidden="true">Scroll<span className="chev" /></div>
    </div>
  );
}
