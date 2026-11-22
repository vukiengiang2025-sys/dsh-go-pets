// Thử nghiệm A/B cục bộ, ổn định theo máy.
export function assignVariant(seed) {
  const text = String(seed || '');
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 2 === 0 ? 'A' : 'B';
}

export function newSeed() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
