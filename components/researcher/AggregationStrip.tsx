'use client';
import { fmt1 } from '@/lib/researchers';

interface AggRow {
  id: string; title: string; sNorm: number;
  qualifies: boolean; failedGate: string | null;
}

export default function AggregationStrip({ rows, s }: { rows: AggRow[]; s: number }) {
  const q = rows.filter(r => r.qualifies).slice().sort((a, b) => b.sNorm - a.sNorm);
  const dq = rows.filter(r => !r.qualifies);
  const max = Math.max(...q.map(r => r.sNorm), s, 1);
  // square-root scale: the data spans 1.0–40.6, linear bars would hide the small ones
  const pos = (v: number) => Math.sqrt(v / max) * 100;

  return (
    <section className="agg" aria-label="How the datasets aggregate to the S-index">
      <div className="agg-cap">
        {s > 0
          ? <>{s} qualifying dataset{s === 1 ? '' : 's'} clear{s === 1 ? 's' : ''} S<sub>norm</sub> ≥ {s} → <b>S-index = {s}</b></>
          : <>No qualifying datasets → <b>S-index = 0</b></>}
      </div>
      <div className="agg-rows">
        {q.map(r => (
          <div className="agg-row" key={r.id}>
            <span className="t">{r.title}</span>
            <div className="track">
              <div
                className={`fill${s > 0 && r.sNorm >= s ? '' : ' under'}`}
                style={{ width: `${pos(r.sNorm)}%` }}
              />
              {s > 0 && <i className="cut" style={{ left: `${pos(s)}%` }} aria-hidden="true" />}
              <span
                className="v"
                style={{ left: `min(calc(${pos(r.sNorm)}% + 8px), calc(100% - 44px))` }}
              >
                {fmt1(r.sNorm)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {dq.map(r => (
        <div className="agg-dq" key={r.id}>
          {r.title} — does not qualify ({r.failedGate}); outside the ranking
        </div>
      ))}
      <div className="agg-snote">
        Bar lengths use a square-root scale so small scores stay visible. The dashed line
        is the S-index cutoff.
      </div>
    </section>
  );
}
