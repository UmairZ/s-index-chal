'use client';
import { fmt1, raisePlan, type Dataset } from '@/lib/researchers';

interface Props {
  rows: (Dataset & { sNorm: number })[];
  s: number;
  note?: string;
}

export default function RaiseScore({ rows, s, note }: Props) {
  const p = raisePlan(rows, s);

  return (
    <section className="raise" aria-label="What would raise this score">
      <div className="k">What would raise this score?</div>
      <p className="raise-lead">
        Moving from S-index {s} to <b>{p.target}</b> takes {p.target} qualifying datasets
        each scoring S<sub>norm</sub> ≥ {p.target}. So far {p.have}{' '}
        clear{p.have === 1 ? 's' : ''} that bar,
        and {p.needed === 1 ? 'one more has' : `${p.needed} more have`} to get there.
      </p>
      <ul className="raise-list">
        {p.candidate && (
          <li className="cand">
            <b>Closest candidate: {p.candidate.title}</b>, at
            S<sub>norm</sub> {fmt1(p.candidate.sNorm)}. About {p.candidate.gapTheta} more
            downloads, or {p.candidate.gapOmega} more
            citation{p.candidate.gapOmega === 1 ? '' : 's'}, would lift it
            past {p.target}. Try it in the workbench above.
          </li>
        )}
        {p.gated.map(g => (
          <li className="gate" key={g.id}>
            <b>{g.title}</b> would clear the bar at S<sub>norm</sub> {fmt1(g.sNorm)}, but
            it does not qualify: {g.failedGate}. Fixing that one criterion raises the
            score without a single new download.
          </li>
        ))}
        {p.missing > 0 && (
          <li className="short">
            The portfolio is simply short: even if every current dataset improved,
            reaching {p.target} takes {p.missing === 1
              ? 'another linked dataset'
              : `${p.missing} more linked datasets`} entirely.
          </li>
        )}
      </ul>
      {note && <p className="raise-note">{note}</p>}
    </section>
  );
}
