import type { Principle } from '@/lib/content';

export default function PrincipleCard({ p }: { p: Principle }) {
  return (
    <article className={`prin ${p.key}`}>
      <span className="wm" aria-hidden="true">{p.num}</span>
      <div className="n" aria-hidden="true">{p.num}</div>
      <b>{p.title}</b>
      <p>{p.body}</p>
      <p className="nt">{p.note}</p>
      <div className="mp">→ {p.maps}</div>
    </article>
  );
}
