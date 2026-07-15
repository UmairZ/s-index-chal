import { HERO } from '@/lib/content';

export default function HeroIntro() {
  return (
    <div className="intro">
      <div className="k">{HERO.kicker}</div>
      <h1>{HERO.headline}</h1>
      <p>{HERO.sub}</p>
    </div>
  );
}
