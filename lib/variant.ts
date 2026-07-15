export type Variant = 'a' | 'b';

export function parseVariant(hash: string): Variant {
  return hash.replace('#', '').toLowerCase() === 'b' ? 'b' : 'a';
}
