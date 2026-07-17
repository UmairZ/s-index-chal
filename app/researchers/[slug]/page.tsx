import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RESEARCHER_LIST } from '@/lib/researchers';
import ScorePage from '@/components/researcher/ScorePage';

export function generateStaticParams() {
  return RESEARCHER_LIST.map(r => ({ slug: r.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const r = RESEARCHER_LIST.find(x => x.slug === slug);
  if (!r) return {};
  return { title: `${r.name} · S-index`, description: r.scoreSentence };
}

export default async function ResearcherRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const r = RESEARCHER_LIST.find(x => x.slug === slug);
  if (!r) notFound();
  return <ScorePage r={r} />;
}
