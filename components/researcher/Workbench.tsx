'use client';
import { useState } from 'react';
import { fmt1, type Dataset } from '@/lib/researchers';

export interface WbRow extends Dataset { sNorm: number }

interface Props {
  rows: WbRow[];
  selected: string;
  sValue: number;
  onSelect: (id: string) => void;
  onEdit: (id: string, field: 'theta' | 'omega', value: number) => void;
}

type Field = 'theta' | 'omega';

export default function Workbench({ rows, selected, sValue, onSelect, onEdit }: Props) {
  const sel = rows.find(x => x.id === selected) ?? rows[0];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = rows.findIndex(x => x.id === sel.id);
    const next = rows[i + (e.key === 'ArrowDown' ? 1 : -1)];
    if (next) onSelect(next.id);
  };

  return (
    <section className="wb" aria-label="Score workbench">
      <div
        className="wb-list" role="listbox" aria-label="Datasets" tabIndex={0}
        aria-activedescendant={`wbopt-${sel.id}`}
        onKeyDown={onKey}
      >
        {rows.map(d => (
          <div
            key={d.id} id={`wbopt-${d.id}`} role="option" aria-selected={d.id === sel.id}
            className={`wb-it${d.id === sel.id ? ' on' : ''}${d.qualifies ? '' : ' dq'}`}
            onClick={() => onSelect(d.id)}
          >
            <b>{d.title}</b>
            <span className="m">
              {d.repository}{d.year ? ` · ${d.year}` : ''}
              {d.illustrative && <span className="illus">illustrative</span>}
            </span>
            {d.qualifies
              ? <span className="sn">S<sub>norm</sub> {fmt1(d.sNorm)}</span>
              : <span className="bad">does not qualify · {d.failedGate}</span>}
          </div>
        ))}
      </div>

      <EqPane key={sel.id} sel={sel} sValue={sValue} onEdit={onEdit} />
    </section>
  );
}

function EqPane({ sel, sValue, onEdit }: { sel: WbRow; sValue: number; onEdit: Props['onEdit'] }) {
  const floored = (0.1 * sel.theta + sel.omega) * sel.normFactor < 1;
  const [draft, setDraft] = useState<{ field: Field; text: string } | null>(null);

  const num = (field: Field, value: number, cls: string, label: string) => {
    const displayed = draft?.field === field ? draft.text : String(value);
    return (
      <input
        type="number" min={0} step={1} value={displayed}
        className={`wb-num ${cls}`}
        style={{ width: `${displayed.length + 2.5}ch` }}
        aria-label={`${label} for ${sel.title}`}
        onFocus={() => setDraft({ field, text: String(value) })}
        onBlur={() => setDraft(null)}
        onChange={e => {
          const text = e.target.value;
          setDraft({ field, text });
          const v = Math.max(0, Math.floor(Number(text) || 0));
          onEdit(sel.id, field, v);
        }}
      />
    );
  };

  return (
    <div className="wb-eq">
      <div className="wb-ds">
        <b>{sel.title}</b>
        <span>{sel.repository}{sel.illustrative ? ' · illustrative example' : ''}</span>
      </div>
      <div className="wb-line" role="group" aria-label="The equation with this dataset's values">
        <span className="g">S<sub>norm</sub> = </span>
        <span className="wb-brace" aria-hidden="true">{'{'}</span>
        <div className="wb-branches">
          <div className={`wb-branch${sel.qualifies ? '' : ' dim'}`}>
            <span className="g">max( 1, ( 0.1 · </span>
            <span className="wb-term th">
              <i>θ downloads</i>
              {num('theta', sel.theta, 'th', 'θ — honest downloads')}
            </span>
            <span className="g"> + </span>
            <span className="wb-term om">
              <i>ω citations</i>
              {num('omega', sel.omega, 'om', 'ω — citations')}
            </span>
            <span className="g"> ) × </span>
            <span className="wb-term t3">
              <i>μ<sub>g</sub>/μ<sub>f</sub></i>
              <span className="wb-fix">{sel.normFactor}</span>
            </span>
            <span className="g"> )</span>
            <span className="wb-cond">qualified<span className="dots"><i className="d2" /><i className="d4" /></span></span>
          </div>
          <div className={`wb-branch bot${sel.qualifies ? ' dim' : ''}`}>
            <span className="z">0</span>
            <span className="ow">otherwise</span>
          </div>
        </div>
      </div>
      <div className="wb-path">
        normalised against the <b>{sel.subfield ?? 'global'} mean</b> — the field mean is
        not the researcher&rsquo;s number, so it stays fixed
      </div>
      <p className="wb-out" aria-live="polite">
        {sel.qualifies ? (
          <>
            S<sub>norm</sub> = <b>{fmt1(sel.sNorm)}</b>
            {floored && <span className="floor"> · floored to 1 — the floor at work</span>}
            <span className="agg-note"> · S-index {sValue}</span>
          </>
        ) : (
          <>
            S<sub>norm</sub> = <b className="z0">0</b> — blocked at the gate
            <span className="agg-note"> · S-index {sValue}</span>
          </>
        )}
      </p>
      {!sel.qualifies && (
        <div className="wb-gate">
          Blocked at the gate: <b>{sel.failedGate}</b>. A dataset that fails a qualifying
          criterion scores 0 — the top branch never runs. Qualified, it would have
          scored {fmt1(sel.sNorm)}.
        </div>
      )}
    </div>
  );
}
