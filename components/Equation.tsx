'use client';
import type { TermKey } from '@/lib/content';

interface Props {
  interactive?: boolean;
  onTermClick?: (k: TermKey) => void;
  highlight?: TermKey | null;
  termRef?: (k: TermKey, el: HTMLButtonElement | null) => void;
}

export default function Equation({ interactive = true, onTermClick, highlight, termRef }: Props) {
  const term = (k: TermKey, cls: string, label: string, children: React.ReactNode) => (
    <button
      type="button"
      className={`term ${cls}${highlight === k ? ' hl' : ''}`}
      data-term={k}
      aria-label={label}
      tabIndex={interactive ? 0 : -1}
      onClick={() => interactive && onTermClick?.(k)}
      ref={el => termRef?.(k, el)}
    >
      {children}
    </button>
  );

  return (
    <div className="eq" role="group" aria-label="The S-index equation. Each coloured term opens an explanation.">
      <span className="g">S<sub>norm</sub>&nbsp;=&nbsp;</span>
      {term('max', 't-p1', 'The floor: max of 1 — principle 1, inherent value', <>max(&nbsp;1&nbsp;,</>)}
      <span className="g">&nbsp;(0.1·</span>
      {term('theta', 't-p4', 'Theta: honest downloads — principle 4, collaborative credit', <>θ</>)}
      <span className="g">&nbsp;+&nbsp;</span>
      {term('omega', 't-p2', 'Omega: citations — principle 2, how and where shared', <>ω</>)}
      <span className="g">)&nbsp;×&nbsp;</span>
      {term('norm', 't-p3', 'Mu-g over mu-f: field normalisation — principle 3, norms and ethics',
        <>μ<sub>g</sub>/μ<sub>f</sub></>)}
      {term('max', 't-p1', 'Closing the floor: max of 1 — principle 1, inherent value', <>)</>)}
    </div>
  );
}
