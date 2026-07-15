import { RESEARCHERS, FOOTER } from '@/lib/content';

export default function Tail() {
  return (
    <>
      <section className="tail wrap">
        <div className="k">See it work</div>
        <h2>Two researchers, and every number traced</h2>
        <p>The same equation, carrying real shared data. Researcher pages are coming next.</p>
        <div className="rcs">
          {RESEARCHERS.map(r => (
            <div className="rc" key={r.name}>
              <div className="s" aria-hidden="true">{r.score}</div>
              <div><b>{r.name}</b><span>{r.meta}</span></div>
            </div>
          ))}
        </div>
      </section>
      <footer className="ftr">{FOOTER}</footer>
    </>
  );
}
