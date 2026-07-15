'use client';
import { useEffect, useRef } from 'react';
import { PANELS, type TermKey } from '@/lib/content';

interface Props {
  term: TermKey | null;
  onClose: () => void;
  onJump: (k: TermKey) => void;
}

export default function ExplainerPanel({ term, onClose, onJump }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!term) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [term, onClose]);

  if (!term) return null;
  const p = PANELS[term];

  return (
    <div className="panelwrap">
      <div className="panelbg" onClick={onClose} aria-hidden="true" />
      <aside className={`panel pk-${p.principle}`} role="dialog" aria-modal="true"
        aria-label={p.title} tabIndex={-1} ref={ref}>
        <button className="cls" onClick={onClose} aria-label="Close">×</button>
        <div className="ptop">
          <span className={`bdg b-${p.principle}`}>{p.badge}</span>
          <h3>{p.title}</h3>
        </div>
        {p.paragraphs.map((html, i) => (
          <p className="bd" key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
        {p.checks && (
          <>
            <div className="glead">{p.checksLead}</div>
            <div className="checks">
              {p.checks.map(c => (
                <div className={`chk c-${c.principle}`} key={c.title}>
                  <span className="ck" aria-hidden="true">✓</span>
                  <div><b>{c.title}</b><span>{c.body}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="lrow">
          {p.links.map(l => (
            <button key={l.term} onClick={() => onJump(l.term)}>{l.label}</button>
          ))}
          <button onClick={onClose}>Back</button>
        </div>
        <div className="esc">Esc to close</div>
      </aside>
    </div>
  );
}
