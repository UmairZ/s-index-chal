import Nav from '@/components/Nav';
import HeroIntro from '@/components/HeroIntro';
import PrincipleCard from '@/components/PrincipleCard';
import Tail from '@/components/Tail';
import { PRINCIPLES } from '@/lib/content';

export default function Home() {
  return (
    <main>
      <div className="stage">
        <div className="wrap">
          <Nav />
          <HeroIntro />
          <div className="prins" style={{ padding: '32px 0 64px' }}>
            {PRINCIPLES.map(p => <PrincipleCard key={p.key} p={p} />)}
          </div>
        </div>
      </div>
      <Tail />
    </main>
  );
}
