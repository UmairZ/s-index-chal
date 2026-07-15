'use client';
import type { Variant } from '@/lib/variant';

export default function VariantToggle({ variant, onChange }:
  { variant: Variant; onChange: (v: Variant) => void }) {
  return (
    <div className="vtoggle" role="group" aria-label="Design variant (team review tool)">
      <button className={variant === 'a' ? 'on' : ''} onClick={() => onChange('a')}>A · Assembly</button>
      <button className={variant === 'b' ? 'on' : ''} onClick={() => onChange('b')}>B · Rail</button>
    </div>
  );
}
