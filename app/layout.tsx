import type { Metadata } from 'next';
import './globals.css';

const description =
  'A metric for research data sharing, built from four principles. An AI.Health4All proposal for the NIH data sharing challenge.';

export const metadata: Metadata = {
  title: 'S-index · A measure of shared data',
  description,
  openGraph: {
    title: 'S-index · A measure of shared data',
    description,
    url: 'https://s-index-chal.vercel.app',
    siteName: 'S-index',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
