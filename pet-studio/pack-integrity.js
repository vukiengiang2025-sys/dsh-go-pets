// Kiểm SHA-256 của sheet nếu pack.json có "checksums".

export async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyChecksums(pack, files) {
  const sums = pack && pack.checksums;
  if (!sums || typeof sums !== 'object') return { ok: true, checked: 0 };
  for (const [name, expected] of Object.entries(sums)) {
    const blob = files && files[name];
    if (!blob) return { ok: false, bad: name, reason: 'missing' };
    const got = await sha256Hex(await blob.arrayBuffer());
    if (got !== expected) return { ok: false, bad: name, reason: 'mismatch' };
  }
  return { ok: true, checked: Object.keys(sums).length };
}
