'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FOOTER } from '@/lib/content';
import { RESEARCHER_LIST, sNorm, sIndex, type Researcher } from '@/lib/researchers';
import Workbench from '@/components/researcher/Workbench';
import AggregationStrip from '@/components/researcher/AggregationStrip';
import RaiseScore from '@/components/researcher/RaiseScore';

interface Edit { theta: number; omega: number }

export default function ScorePage({ r }: { r: Researcher }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [slim, setSlim] = useState(false);
  const [selected, setSelected] = useState(r.datasets[0].id);

  const onEdit = useCallback((id: string, field: 'theta' | 'omega', value: number) => {
    setEdits(prev => {
      const d = r.datasets.find(x => x.id === id);
      if (!d) return prev;
      const cur = prev[id] ?? { theta: d.theta, omega: d.omega };
      const next = { ...cur, [field]: value };
      if (next.theta === d.theta && next.omega === d.omega) {
        const { [id]: _drop, ...rest } = prev;
        return rest; // editing back to the original value clears the edit
      }
      return { ...prev, [id]: next };
    });
  }, [r]);

  useEffect(() => {
    const on = () => setSlim(window.scrollY > 60);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const rows = useMemo(() => r.datasets.map(d => {
    const e = edits[d.id];
    const theta = e?.theta ?? d.theta;
    const omega = e?.omega ?? d.omega;
    return { ...d, theta, omega, sNorm: sNorm(theta, omega, d.normFactor) };
  }), [r, edits]);
  const s = sIndex(rows);
  const edited = Object.keys(edits).length > 0;

  const other = RESEARCHER_LIST.find(x => x.slug !== r.slug);
  const otherS = other
    ? sIndex(other.datasets.map(d => ({
        sNorm: sNorm(d.theta, d.omega, d.normFactor), qualifies: d.qualifies,
      })))
    : 0;
  const hasProvisional = r.datasets.some(d => d.provisional);

  return (
    <div className="rpage">
      <header className={`rhead${slim ? ' slim' : ''}`}>
        <div className="wrap rh-in">
          <Link href="/" className="rh-back" aria-label="Back to the S-index overview">S</Link>
          <div className="rh-id">
            <h1>{r.name}</h1>
            <div className="rh-meta">
              {r.orcid && (
                <a href={`https://orcid.org/${r.orcid}`} target="_blank" rel="noreferrer">
                  ORCID {r.orcid}
                </a>
              )}
              <span>{r.field}</span>
              <span>{r.datasets.length} dataset{r.datasets.length === 1 ? '' : 's'}</span>
            </div>
            <p className="rh-sentence">{r.scoreSentence}</p>
          </div>
          <div className="rh-score">
            {edited && (
              <button type="button" className="reset" onClick={() => setEdits({})}>
                Reset values
              </button>
            )}
            <div className="chip">
              <span className="lbl">S-index</span>
              <span className="val">{s}</span>
              {edited && <span className="tag">edited</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="wrap rmain">
        <Workbench
          rows={rows}
          selected={selected}
          sValue={s}
          onSelect={setSelected}
          onEdit={onEdit}
        />
        <AggregationStrip rows={rows} s={s} />
        <RaiseScore rows={rows} s={s} note={r.raiseNote} />

        {hasProvisional && (
          <section className="cavs" aria-label="Data status">
            <div className="cav prov">
              Per-dataset titles and figures on this page are illustrative pending the
              team&rsquo;s final calculation document; the published S-index values are
              real.
            </div>
          </section>
        )}

        {other && (
          <Link href={`/researchers/${other.slug}`} className="xlink">
            <span className="xs" aria-hidden="true">{otherS}</span>
            <span><b>{other.name}</b><i>{other.hook}</i></span>
          </Link>
        )}
      </main>

      <footer className="ftr">{FOOTER}</footer>
    </div>
  );
}
