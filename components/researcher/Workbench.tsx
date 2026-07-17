'use client';
import { NORM_PATH_LABEL, type Dataset } from '@/lib/researchers';

export interface WbRow extends Dataset { sNorm: number }

interface Props {
  rows: WbRow[];
  selected: string;
  sValue: number;
  onSelect: (id: string) => void;
  onEdit: (id: string, field: 'theta' | 'omega', value: number) => void;
}

const fmt = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

export default function Workbench({ rows, selected, sValue, onSelect, onEdit }: Props) {
  const sel = rows.find(x => x.id === selected) ?? rows[0];
  const floored = (0.1 * sel.theta + sel.omega) * sel.normFactor < 1;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = rows.findIndex(x => x.id === sel.id);
    const next = rows[i + (e.key === 'ArrowDown' ? 1 : -1)];
    if (next) onSelect(next.id);
  };

  const num = (field: 'theta' | 'omega', value: number, cls: string, label: string) => (
    <input
      type="number" min={0} step={1} value={value}
      className={`wb-num ${cls}`}
      style={{ width: `${String(value).length + 2.5}ch` }}
      aria-label={`${label} for ${sel.title}`}
      onChange={e => {
        const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
        onEdit(sel.id, field, v);
      }}
    />
  );

  return (
    <section className="wb" aria-label="Score workbench">
      <div
        className="wb-list" role="listbox" aria-label="Datasets" tabIndex={0}
        onKeyDown={onKey}
      >
        {rows.map(d => (
          <div
            key={d.id} role="option" aria-selected={d.id === sel.id}
            className={`wb-it${d.id === sel.id ? ' on' : ''}${d.qualifies ? '' : ' dq'}`}
            onClick={() => onSelect(d.id)}
          >
            <b>{d.title}</b>
            <span className="m">{d.repository}{d.year ? ` · ${d.year}` : ''}</span>
            {d.qualifies
              ? <span className="sn">S<sub>norm</sub> {fmt(d.sNorm)}</span>
              : <span className="bad">does not qualify · {d.failedGate}</span>}
          </div>
        ))}
      </div>

      <div className="wb-eq" key={sel.id}>
        <div className="wb-ds">
          <b>{sel.title}</b>
          <span>{sel.repository}{sel.doi ? ` · DOI ${sel.doi}` : ''}</span>
        </div>
        <div className="wb-line" role="group" aria-label="The equation with this dataset's values">
          <span className="g">S<sub>norm</sub> = max( 1, ( 0.1 · </span>
          <span className="wb-term t4">
            <i>θ downloads</i>
            {num('theta', sel.theta, 't4', 'θ — honest downloads')}
          </span>
          <span className="g"> + </span>
          <span className="wb-term t2">
            <i>ω citations</i>
            {num('omega', sel.omega, 't2', 'ω — citations')}
          </span>
          <span className="g"> ) × </span>
          <span className="wb-term t3">
            <i>μ<sub>g</sub>/μ<sub>f</sub></i>
            <span className="wb-fix">{sel.normFactor}</span>
          </span>
          <span className="g"> )</span>
        </div>
        <div className="wb-path">
          normalised via <b>{NORM_PATH_LABEL[sel.normPath]}</b> — the field mean is not
          the researcher&rsquo;s number, so it stays fixed
        </div>
        <p className="wb-out" aria-live="polite">
          {sel.qualifies ? (
            <>
              S<sub>norm</sub> = <b>{fmt(sel.sNorm)}</b>
              {floored && <span className="floor"> · floored to 1 — the floor at work</span>}
              <span className="agg-note"> · S-index {sValue}</span>
            </>
          ) : (
            <>S<sub>norm</sub> would be {fmt(sel.sNorm)} — <b>not counted</b></>
          )}
        </p>
        {!sel.qualifies && (
          <div className="wb-gate">
            Blocked at the gate: <b>{sel.failedGate}</b>. A dataset that fails a qualifying
            criterion is excluded from the S-index entirely — the equation only ever runs
            on qualifying datasets.
          </div>
        )}
      </div>
    </section>
  );
}
