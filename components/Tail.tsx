import Link from 'next/link';
import { RESEARCHERS, FOOTER } from '@/lib/content';

export default function Tail() {
  return (
    <>
      <section className="tail wrap">
        <div className="k">See it work</div>
        <h2>Five researchers, every number traced</h2>
        <p>
          The same equation, carrying real shared data. Open a researcher and drive
          the numbers yourself.
        </p>
        <div className="rcs">
          {RESEARCHERS.map(r => (
            <Link className="rc" key={r.slug} href={`/researchers/${r.slug}`}>
              <div className="s" aria-hidden="true">{r.score}</div>
              <div><b>{r.name}</b><span>{r.meta}</span></div>
              <span className="go" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="ftr">{FOOTER}</footer>
    </>
  );
}
