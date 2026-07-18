'use client';
import type { TermKey } from '@/lib/content';

interface Props {
  interactive?: boolean;
  onTermClick?: (k: TermKey) => void;
  highlight?: TermKey | null;
}

export default function Equation({ interactive = true, onTermClick, highlight }: Props) {
  const term = (k: TermKey, cls: string, label: string, children: React.ReactNode) => (
    <button
      type="button"
      className={`term ${cls}${highlight === k ? ' hl' : ''}`}
      data-term={k}
      aria-label={label}
      tabIndex={interactive ? 0 : -1}
      onClick={() => interactive && onTermClick?.(k)}
    >
      {children}
    </button>
  );

  return (
    <div className="eq" role="group" aria-label="The S-index equation. Each coloured piece opens an explanation.">
      <span className="g">S<sub>norm</sub>&nbsp;=&nbsp;</span>
      {term('gate', 't-gate brace',
        'The qualifying gate — how and where shared, collaborative credit',
        <span className="bg">{'{'}</span>)}
      <div className="branches">
        <div className="branch">
          {term('max', 't-p1', 'The floor: max of 1 — inherent value', <>max(&nbsp;1&nbsp;,</>)}
          <span className="seg">
            <span className="g">&nbsp;(0.1·</span>
            {term('theta', 't-plain', 'Theta: honest downloads', <>θ</>)}
            <span className="g">&nbsp;+&nbsp;</span>
            {term('omega', 't-plain', 'Omega: citations', <>ω</>)}
            <span className="g">)&nbsp;×&nbsp;</span>
          </span>
          {term('norm', 't-p3', 'Mu-g over mu-f: field normalisation — norms and ethics',
            <>μ<sub>g</sub>/μ<sub>f</sub></>)}
          {term('max', 't-p1', 'Closing the floor: max of 1 — inherent value', <>)</>)}
          {term('gate', 't-gate cond',
            'Qualified: the gate — how and where shared, collaborative credit',
            <>qualified<span className="dots"><i className="d2" /><i className="d4" /></span></>)}
        </div>
        <div className="branch bot">
          {term('gate', 't-gate zero',
            'Zero otherwise: a dataset that fails the gate scores nothing',
            <><span className="z">0</span><span className="ow">otherwise</span></>)}
        </div>
      </div>
    </div>
  );
}
