'use client';

const SECTIONS = ['Principles', 'The equation', 'In practice'];

export default function TimelineNav(
  { active, onSelect }: { active: number; onSelect: (i: number) => void },
) {
  return (
    <nav className="tnav" aria-label="Page sections">
      {SECTIONS.map((label, i) => (
        <button
          key={label}
          type="button"
          className={i === active ? 'on' : ''}
          aria-current={i === active ? 'true' : undefined}
          onClick={() => onSelect(i)}
        >
          <span className="dot" aria-hidden="true" />
          <span className="lbl">{label}</span>
        </button>
      ))}
    </nav>
  );
}
