'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FOOTER } from '@/lib/content';
import { RESEARCHER_LIST, sNorm, sIndex, sIndexGlobal, type Researcher } from '@/lib/researchers';
import Workbench from '@/components/researcher/Workbench';
import AggregationStrip from '@/components/researcher/AggregationStrip';
import RaiseScore from '@/components/researcher/RaiseScore';

interface Edit { theta: number; omega: number }

export default function ScorePage({ r }: { r: Researcher }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [slim, setSlim] = useState(false);
  const [selected, setSelected] = useState(r.datasets[0].id);
  const headRef = useRef<HTMLElement>(null);
  const [spacerH, setSpacerH] = useState<number | null>(null);

  // The header is position:fixed so collapsing it never changes document height
  // (a sticky header that shrinks re-flows the page and oscillates near the
  // threshold). The spacer below it holds the expanded height, measured here.
  useLayoutEffect(() => {
    if (slim) return; // only measure the expanded state
    const measure = () => {
      if (headRef.current) setSpacerH(headRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [slim]);

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

  // cross-link to the next researcher in the list, wrapping around
  const idx = RESEARCHER_LIST.findIndex(x => x.slug === r.slug);
  const other = RESEARCHER_LIST[(idx + 1) % RESEARCHER_LIST.length];
  const otherS = sIndex(other.datasets.map(d => ({
    sNorm: sNorm(d.theta, d.omega, d.normFactor), qualifies: d.qualifies,
  })));

  const realCount = r.datasets.filter(d => !d.illustrative).length;
  const hasIllustrative = r.datasets.some(d => d.illustrative);
  // the same portfolio scored without field normalisation (raw 0.1θ + ω)
  const globalS = sIndexGlobal(r.datasets);
  const fieldS = sIndex(r.datasets.map(d => ({
    sNorm: sNorm(d.theta, d.omega, d.normFactor), qualifies: d.qualifies,
  })));
  const showNormNote = globalS !== fieldS;

  return (
    <div className="rpage">
      <header ref={headRef} className={`rhead${slim ? ' slim' : ''}`}>
        <div className="wrap rh-in">
          <Link href="/" className="rh-back" aria-label="Back to the S-index overview">S</Link>
          <div className="rh-id">
            <h1>{r.name}</h1>
            <div className="rh-meta">
              {r.orcid && <span className="rh-orcid">ORCID {r.orcid}</span>}
              <span>{r.field}</span>
              <span>{realCount} dataset{realCount === 1 ? '' : 's'}</span>
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
      <div
        className="rspace"
        style={spacerH !== null ? { height: spacerH } : undefined}
        aria-hidden="true"
      />

      <main className="wrap rmain">
        <Workbench
          rows={rows}
          selected={selected}
          sValue={s}
          onSelect={setSelected}
          onEdit={onEdit}
        />
        <AggregationStrip rows={rows} s={s} />
        {showNormNote && (
          <p className="normnote">
            Without field normalisation (every dataset measured against one global
            average), this portfolio would score <b>{globalS}</b>. Weighted against
            each dataset&rsquo;s own field, it&rsquo;s <b>{fieldS}</b>: reuse in a
            lower-citation discipline counts for what it is worth.
          </p>
        )}
        <RaiseScore rows={rows} s={s} note={r.raiseNote} />

        <section className="cavs" aria-label="Data status">
          {hasIllustrative && (
            <div className="cav prov">
              The final dataset below is marked <b>illustrative</b>: a constructed
              example of a dataset that fails the qualifying gate, included to show how
              the gate works. It is not part of this record and does not affect the
              S-index.
            </div>
          )}
          <div className="cav">
            Researcher name and ORCID are pseudonyms. The dataset records, download and
            citation counts, and S-index values are real.
          </div>
        </section>

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
