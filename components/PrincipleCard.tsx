import type { Principle } from '@/lib/content';

export default function PrincipleCard({ p }: { p: Principle }) {
  return (
    <article className={`prin ${p.key}`}>
      <div className="n" aria-hidden="true">{p.num}</div>
      <b>{p.title}</b>
      <p>{p.body}</p>
      <div className="mp">→ {p.maps}</div>
    </article>
  );
}
