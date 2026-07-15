import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'S-index · A measure of shared data',
  description:
    'A metric for research data sharing, built from four principles. An AI.Health4All proposal for the NIH data sharing challenge.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
